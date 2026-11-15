"""Measure a track's tempo, first-beat offset and loudness, for scenes that light up on the real beat.

    python3 tools/beats.py "music-tejano/Tejano Lofi.mp3" > scene/beats-tejano.json

Prints JSON: {"duration", "bpm" (the felt tempo, folded into 60-110), "offset" (seconds to the
first beat), "energy" (loudness every 0.5 s, 0..1)}. Numpy only: onset strength from spectral flux, tempo from its autocorrelation,
then the beat grid refined over the whole track.
"""
import json, subprocess, sys
import numpy as np

SR, HOP, N = 22050, 512, 2048
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
dur = len(x) / SR

# onset strength: positive spectral flux on a log-magnitude spectrogram
frames = 1 + (len(x) - N) // HOP
win = np.hanning(N).astype(np.float32)
idx = np.arange(N)[None, :] + HOP * np.arange(frames)[:, None]
S = np.log1p(10 * np.abs(np.fft.rfft(x[idx] * win, axis=1)))
flux = np.maximum(0, np.diff(S, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
flux -= np.convolve(flux, np.ones(16) / 16, mode="same")       # remove the slow trend
flux = np.maximum(flux, 0)
fps = SR / HOP

# tempo: autocorrelation peak between 70 and 180 BPM, gently favouring ~110
ac = np.correlate(flux, flux, mode="full")[len(flux) - 1:]
best, best_bpm = -1, 0
for bpm in np.arange(70, 180, .1):
    lag = 60 * fps / bpm
    l0 = int(lag); fr = lag - l0
    v = ac[l0] * (1 - fr) + ac[l0 + 1] * fr
    v *= np.exp(-.5 * (np.log2(bpm / 110) / 1.0) ** 2)
    if v > best: best, best_bpm = v, bpm

# refine tempo and phase together: the grid that lands on the most onset strength
t_on = np.arange(len(flux)) / fps
def score(bpm, off):
    beats = np.arange(off, dur, 60 / bpm)
    i = np.clip(np.round(beats * fps).astype(int), 0, len(flux) - 1)
    return flux[i].sum() + .5 * flux[np.clip(i - 1, 0, None)].sum() + .5 * flux[np.clip(i + 1, None, len(flux) - 1)].sum()
cands = []
for bpm in np.arange(best_bpm - 1.5, best_bpm + 1.5, .02):
    period = 60 / bpm
    for off in np.arange(0, period, .005):
        cands.append((score(bpm, off), bpm, off))
s, bpm, off = max(cands)

# fold into the felt tempo (lofi runs 60-110): halve, and keep the half-grid whose beats hit
# harder in the low end (the kick lands on the felt beat)
lowN = 1024; lidx = np.arange(lowN)[None, :] + 256 * np.arange(1 + (len(x) - lowN) // 256)[:, None]
low = np.abs(np.fft.rfft(x[lidx] * np.hanning(lowN), axis=1))[:, :int(150 / (SR / lowN))].sum(1)
lowf = np.concatenate([[0], np.maximum(0, np.diff(np.log1p(low)))]); lfps = SR / 256
while bpm > 110:
    p = 60 / bpm
    hits = [lowf[np.clip(np.round(np.arange(off + k * p, dur, 2 * p) * lfps).astype(int), 0, len(lowf) - 1)].mean() for k in (0, 1)]
    off = off + p * int(np.argmax(hits)); bpm = bpm / 2

# loudness every 0.5 s, normalised to 0..1 between the 5th and 95th percentiles
step = SR // 2
rms = np.array([np.sqrt(np.mean(x[i:i + step] ** 2)) for i in range(0, len(x), step)])
lo, hi = np.percentile(rms, 5), np.percentile(rms, 95)
energy = np.clip((rms - lo) / (hi - lo + 1e-9), 0, 1)

print(json.dumps({"duration": round(dur, 3), "bpm": round(float(bpm), 3), "offset": round(float(off), 3),
                  "energy": [round(float(e), 3) for e in energy]}))
