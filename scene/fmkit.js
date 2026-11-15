// Shared by the newer DEVSA FM scenes (grocery, paseo, cathedral): the ASCII renderer, the colour
// helpers and the footer, so each scene file is only its own picture. The older scenes carry their
// own copies of the same code. 1920x1080, a scene paints greys at character resolution into `g`,
// then fm.ascii() turns every cell into a character by brightness; colour is drawn on top in ctx.
const fm = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2, CELL = 12, COLS = W / CELL, ROWS = H / CELL
  const TEAL = "#00b2a9", PINK = "#ef426f", ORANGE = "#ff8200"
  const RAMP = " .,:;-=+*#%@"
  const canvas = document.getElementById("c"), ctx = canvas.getContext("2d")
  const sc = document.createElement("canvas"); sc.width = COLS; sc.height = ROWS
  const g = sc.getContext("2d", { willReadFrequently: true })
  const B = window.BEATS || null
  const T = window.LOOP_T || 60, LT = T / Math.max(1, Math.round(T / 60))
  const clamp01 = p => Math.max(0, Math.min(1, p))
  const lerp = (a, b, p) => a + (b - a) * p
  const ease = p => { p = clamp01(p); return p * p * (3 - 2 * p) }
  const span = (c, a, b) => clamp01((c - a) / (b - a))
  const hash = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s) }
  const gray = v => { const c = Math.round(clamp01(v) * 255); return `rgb(${c},${c},${c})` }
  const box = (x, y, w, h, v) => { g.fillStyle = gray(v); g.fillRect(x, y, w, h) }
  const BPM = B ? B.bpm : 76, OFFSET = B ? B.offset : 0
  const pulseAt = t => { const bc = (t - OFFSET) * BPM / 60; return Math.exp(-(bc - Math.floor(bc)) * 3.5) }

  // City of San Antonio line icons, inked into the grey scene
  const ICON = {}, ICON_IMG = {}
  async function loadIcons(names) {
    for (const n of names) {
      const svg = await fetch("icons/" + n + ".svg").then(r => r.ok ? r.text() : "", () => "")
      if (!/viewBox=/.test(svg)) continue    // the City's icons are optional: a clone without them still runs
      ICON[n] = { vb: svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number), svg }
    }
  }
  function iconImg(n, colour, sw) {
    const key = n + colour + sw; if (ICON_IMG[key]) return ICON_IMG[key]
    const s = ICON[n].svg.replace(/#231f20/gi, colour).replace(/stroke-width:\s*[^;]+;/g, "")
      .replace(new RegExp(`stroke:\\s*${colour};`, "gi"), `stroke: ${colour}; stroke-width: ${sw}px;`)
    const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); ICON_IMG[key] = im; return im
  }
  function onGround(n, x, base, w, v) {
    if (!ICON[n]) return; const im = iconImg(n, "#ffffff", ICON[n].vb[2] / w * 1.1); if (!im.complete) return
    const h = w * ICON[n].vb[3] / ICON[n].vb[2]; g.save(); g.globalAlpha = v; g.drawImage(im, x, base - h, w, h); g.restore()
  }

  /** The grey scene as characters. `tint(x, y, v)` may return an [r,g,b] for a cell (a projection, a sign), else grey. */
  function ascii(bg = "#0c0c0c", tint = null) {
    const d = g.getImageData(0, 0, COLS, ROWS).data
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
    ctx.font = `700 ${CELL + 1}px "Geist Mono"`; ctx.textAlign = "center"; ctx.textBaseline = "middle"
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = d[(y * COLS + x) * 4] / 255, c = tint && tint(x, y, v)
      const ch = RAMP[Math.min(RAMP.length - 1, Math.floor((c ? Math.max(v, c[3] ?? .5) : v) * RAMP.length))]
      if (ch === " ") continue
      ctx.fillStyle = c ? `rgba(${c[0]},${c[1]},${c[2]},${(.55 + v * .45).toFixed(2)})` : `rgba(235,235,235,${(.25 + v * .75).toFixed(2)})`
      ctx.fillText(ch, x * CELL + CELL / 2, y * CELL + CELL / 2 + 1)
    }
  }
  const glow = (x, y, rx, ry, c) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx)
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore()
  }
  const lit = fn => { ctx.save(); ctx.globalCompositeOperation = "lighter"; fn(); ctx.restore() }
  const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16))
  const rgba = (h, a) => { const [r, gg, b] = hex(h); return `rgba(${r},${gg},${b},${a})` }

  // a car along the street, its headlights sweeping ahead of it; dir 1 = left to right
  function car(x, y, dir, body = "#121418", tail = "#ff3b30") {
    lit(() => {
      const beam = ctx.createLinearGradient(x + dir * 150, 0, x + dir * 820, 0); beam.addColorStop(0, "rgba(255,240,200,.3)"); beam.addColorStop(1, "rgba(255,240,200,0)")
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(x + dir * 150, y - 40); ctx.lineTo(x + dir * 820, y - 150); ctx.lineTo(x + dir * 820, y + 30); ctx.lineTo(x + dir * 150, y - 24); ctx.fill()
      glow(x - dir * 150, y - 40, 40, 20, "rgba(255,59,48,.5)")
    })
    ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(x - 150, y - 56, 300, 46, 12); ctx.fill(); ctx.beginPath(); ctx.roundRect(x - 75 + dir * 10, y - 92, 150, 40, 14); ctx.fill()
    ctx.fillStyle = "rgba(120,140,170,.35)"; ctx.beginPath(); ctx.roundRect(x - 63 + dir * 10, y - 86, 126, 28, 8); ctx.fill()
    ctx.fillStyle = "#fff4d6"; ctx.fillRect(dir > 0 ? x + 140 : x - 152, y - 44, 12, 10)
    ctx.fillStyle = tail; ctx.fillRect(dir > 0 ? x - 152 : x + 142, y - 46, 10, 10)
    ctx.fillStyle = "#0a0b0d"; ctx.beginPath(); ctx.arc(x - 86, y - 10, 22, 0, TAU); ctx.arc(x + 86, y - 10, 22, 0, TAU); ctx.fill()
  }

  function footer(t) {
    const cr = window.CREDITS && window.CREDITS.length ? window.CREDITS : ['"Tejano Lofi" by Patrick · made with Suno']
    const line = cr[Math.floor(t / 15) % cr.length]
    const fade = ctx.createLinearGradient(0, H - 130, 0, H); fade.addColorStop(0, "rgba(10,10,12,0)"); fade.addColorStop(1, "rgba(10,10,12,.75)")
    ctx.fillStyle = fade; ctx.fillRect(0, H - 130, W, 130)
    ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"
    ctx.font = '500 20px "Geist"'; ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText("♪  " + line, W - 60, H - 52)
    // a contributed scene credits its maker: set window.SCENE_BY = "Name or @handle" in the scene
    if (window.SCENE_BY) { ctx.font = '500 17px "Geist"'; ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText("scene by " + window.SCENE_BY, W - 60, H - 80) }
    ctx.textAlign = "left"; ctx.font = '700 22px "Geist Mono"'; ctx.fillStyle = "rgba(255,255,255,0.8)"
    ctx.letterSpacing = "3px"; ctx.fillText("DEVSA FM  ·  devsa.community", 60, H - 52); ctx.letterSpacing = "0px"
    ;[TEAL, PINK, ORANGE].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(60 + i * 52, H - 40, 46, 6) })
  }

  /** Wire a scene up: fonts and assets, then window.render / window.ready the way render.cjs expects. */
  function start(render, extra = []) {
    window.render = t => render(((t % T) + T) % T)
    window.ready = Promise.all([document.fonts.load('700 20px "Geist Mono"'), document.fonts.load('500 20px "Geist"'), ...extra])
      .then(() => { window.render(0); return new Promise(r => setTimeout(r, 400)) })
    window.ready.then(() => {
      const q = new URLSearchParams(location.search)
      if (q.has("still")) return window.render(Number(q.get("t") || 8))
      const t0 = performance.now(); (function loop() { window.render((performance.now() - t0) / 1000); requestAnimationFrame(loop) })()
    })
  }
  const loadImg = src => { const i = new Image(); i.src = src; return [i, i.complete ? 0 : new Promise(r => { i.onload = r; i.onerror = r })] }

  return { W, H, TAU, CELL, COLS, ROWS, TEAL, PINK, ORANGE, ctx, g, T, LT, clamp01, lerp, ease, span, hash, gray, box,
           pulseAt, loadIcons, onGround, ascii, glow, lit, hex, rgba, car, footer, start, loadImg }
})()
