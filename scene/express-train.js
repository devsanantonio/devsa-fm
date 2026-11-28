// The DEVSA Express: the holiday train, shared so a scene can run it along its own track. It was its own scene
// (xmas-express.html) until 2026-11-27; it now passes in front of the Alamodome (dome.html?xmas), where the rail
// line really runs. Behind the engine, one container per community group in DEVSA's network, each carrying the
// group's logo (xmas-logos/, read from the directory, groups.json); a boxcar with the DEVSA logo, a flatcar with the
// PySanAntonio mascot and the Linux SA penguin (the original images), and a caboose with an elf. Real wheels (steel
// tyres, spokes, a gold hub) on trucks, couplers between the cars. The engine's bell swings on the beat; its smoke
// puffs in the tab colours and gold; its headlamp throws a flickering beam down the track.
//
// makeExpress({ ctx, W, RAIL, BPM, PENGUIN, PYSA, passes }) -> { ready, draw(t), track() }
//   RAIL     the top of the rail, in px; wheels sit on it
//   passes   [[t0, t1], ...]: the train crosses the frame once per window, left to right, and the groups are
//            split evenly between the passes, so each one is shorter and the backdrop gets its gaps
window.makeExpress = function ({ ctx, W, RAIL, BPM, PENGUIN, PYSA, passes }) {
  const TAU = Math.PI * 2, TEAL = xs.TEAL, PINK = xs.PINK, ORANGE = xs.ORANGE, GOLD = xs.GOLD, P = xs.PAL
  const DECK = RAIL - 46, GAP = 22
  const lerp = (a, b, p) => a + (b - a) * p, clamp01 = x => Math.max(0, Math.min(1, x))
  const lit = fn => { ctx.save(); ctx.globalCompositeOperation = "lighter"; fn(); ctx.restore() }
  const glow = (x, y, rx, ry, c) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx)
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore()
  }
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})` }

  // the trains, one per pass: an engine, its share of the groups, then the DEVSA boxcar (first pass) or the
  // PySanAntonio flatcar (second), and a caboose
  let TRAINS = passes.map(() => [])
  const build = groups => {
    const per = Math.ceil(groups.length / passes.length)
    TRAINS = passes.map((_, k) => {
      const cars = [{ type: "engine", w: 330 }, ...groups.slice(k * per, (k + 1) * per).map((gr, j) => ({ type: "container", w: 250, gr, i: k * per + j }))]
      cars.push(k % 2 ? { type: "pysa", w: 330 } : { type: "devsa", w: 300 }, { type: "caboose", w: 260 })
      return { cars, len: cars.reduce((a, c) => a + c.w + GAP, 0) }
    })
  }
  build([])
  const ready = fetch("xmas-logos/groups.json").then(r => r.json()).then(gs => Promise.all(gs.map(gr => {
    const im = new Image(); im.src = "xmas-logos/" + gr.file
    return new Promise(r => { im.onload = im.onerror = () => r({ ...gr, im }) })
  }))).then(build, () => {})

  function wheel(x, y, r, d) {                          // a wheel turning as the train rolls d px: a steel tyre, spokes, a hub
    ctx.fillStyle = "#2a2b32"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
    ctx.strokeStyle = "#9a9ca6"; ctx.lineWidth = Math.max(3, r * .18); ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, 0, TAU); ctx.stroke()
    ctx.strokeStyle = "#5c5e68"; ctx.lineWidth = Math.max(2, r * .12)
    for (let k = 0; k < 4; k++) { const a = d / r + k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r * .72, y - Math.sin(a) * r * .72); ctx.lineTo(x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72); ctx.stroke() }
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x, y, r * .22, 0, TAU); ctx.fill()
  }
  function bulbs(x0, x1, y, t, seed) {                   // a string of bulbs chasing along a roof line
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
    const C = [TEAL, PINK, ORANGE, GOLD], step = Math.floor(t * 6)
    for (let x = x0 + 8, i = 0; x < x1 - 4; x += 18, i++) {
      const c = C[(i + seed + step) % 4], on = (i + step) % 4 === 0 ? 1 : .55
      lit(() => glow(x, y + 5, 16, 16, rgba(c, .35 * on)))
      ctx.fillStyle = c; ctx.globalAlpha = .6 + .4 * on; ctx.beginPath(); ctx.arc(x, y + 5, 4.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
    }
  }
  function flatcar(x, w, d) {                           // a deck on two trucks, a coupler behind
    ctx.fillStyle = "#5a2a1e"; ctx.fillRect(x, DECK, w, 16)
    ctx.fillStyle = "#3a1a12"; ctx.fillRect(x + 10, DECK + 16, w - 20, 10)
    for (const tx of [x + 59, x + w - 59]) { ctx.fillStyle = "#33343c"; ctx.fillRect(tx - 34, RAIL - 26, 68, 10) }
    wheel(x + 40, RAIL - 14, 16, d); wheel(x + 78, RAIL - 14, 16, d); wheel(x + w - 78, RAIL - 14, 16, d); wheel(x + w - 40, RAIL - 14, 16, d)
    ctx.fillStyle = "#6a6c76"; ctx.fillRect(x - GAP, DECK + 16, GAP, 8)
    ctx.fillStyle = "#4a4c56"; ctx.fillRect(x - GAP - 2, DECK + 12, 6, 16); ctx.fillRect(x - 4, DECK + 12, 6, 16)
  }
  function engine(x, w, t, d) {
    const top = DECK - 150
    lit(() => {                                          // the headlamp's beam down the track, flickering a touch
      const fl = .36 + .08 * Math.sin(t * 9) + .04 * Math.sin(t * 23)
      const b = ctx.createLinearGradient(x + w, 0, x + w + 520, 0); b.addColorStop(0, `rgba(255,236,190,${fl.toFixed(3)})`); b.addColorStop(1, "rgba(255,236,190,0)")
      ctx.fillStyle = b; ctx.beginPath(); ctx.moveTo(x + w - 8, top + 60); ctx.lineTo(x + w + 520, top + 10); ctx.lineTo(x + w + 520, RAIL + 20); ctx.lineTo(x + w - 8, top + 86); ctx.fill()
      glow(x + w - 6, top + 72, 34, 34, "rgba(255,236,190,.6)")
    })
    ctx.fillStyle = "#24242c"; ctx.fillRect(x + 10, top + 40, w - 110, 96)             // the boiler
    ctx.fillStyle = ORANGE; ctx.fillRect(x + 10, top + 56, w - 110, 14)                // an orange band
    ctx.fillStyle = GOLD; for (let k = 0; k < 4; k++) ctx.fillRect(x + 40 + k * 50, top + 40, 6, 96)   // gold rings
    ctx.fillStyle = TEAL; ctx.fillRect(x + 10, top - 10, 110, 146)                     // the cab, teal
    ctx.fillStyle = "#24242c"; ctx.fillRect(x, top - 26, 130, 18)
    ctx.fillStyle = "#ffd88a"; ctx.fillRect(x + 34, top + 10, 52, 40)                  // lit cab window
    ctx.fillStyle = "#24242c"; ctx.fillRect(x + w - 150, top - 20, 34, 60)              // the stack
    ctx.fillRect(x + w - 158, top - 34, 50, 16)
    { const sw = Math.sin(TAU * BPM / 60 * t / 2) * .45                                  // the bell, swinging on the beat
      ctx.save(); ctx.translate(x + w - 101, top + 2); ctx.rotate(sw); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(14, 26); ctx.lineTo(-14, 26); ctx.closePath(); ctx.fill()
      ctx.fillStyle = "#b8901e"; ctx.fillRect(-14, 24, 28, 4); ctx.restore(); ctx.fillStyle = "#24242c"; ctx.fillRect(x + w - 112, top - 4, 22, 8) }
    ctx.fillStyle = "#24242c"; ctx.fillRect(x + w - 100, top + 50, 90, 86)              // smokebox front
    ctx.fillStyle = "#fff1d0"; ctx.beginPath(); ctx.arc(x + w - 10, top + 72, 12, 0, TAU); ctx.fill()   // the headlamp
    ctx.fillStyle = "#8a8a94"; ctx.beginPath(); ctx.moveTo(x + w - 20, DECK + 10); ctx.lineTo(x + w + 26, RAIL - 2); ctx.lineTo(x + w - 20, RAIL - 2); ctx.fill()   // cowcatcher
    ctx.fillStyle = "#3a1a12"; ctx.fillRect(x + 10, DECK + 10, w - 30, 16)
    wheel(x + 60, RAIL - 22, 24, d); wheel(x + 130, RAIL - 30, 32, d); wheel(x + 210, RAIL - 30, 32, d); wheel(x + w - 50, RAIL - 16, 16, d)
    ctx.strokeStyle = "#2f9e4f"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x + w - 56, top + 100, 18, 0, TAU); ctx.stroke()   // a wreath
    ctx.fillStyle = "#e8323c"; ctx.fillRect(x + w - 62, top + 112, 12, 10)
    for (let i = 0; i < 9; i++) {                        // smoke: puffs off the stack in the tab colours and gold, blown back and up
      const k = ((t * 1.4) + i / 9) % 1, sx = x + w - 133 - k * 260, sy = top - 40 - k * 150 - Math.sin(k * 5 + i) * 10, r = 14 + k * 46
      ctx.fillStyle = rgba([TEAL, PINK, ORANGE, GOLD, "#e6e8ee"][i % 5], .55 * (1 - k))
      for (let q = -1; q <= 1; q++) ctx.fillRect(Math.round((sx + q * r * .5) / 8) * 8, Math.round((sy - Math.abs(q) * r * .2) / 8) * 8, Math.round(r / 8) * 8, Math.round(r * .7 / 8) * 8)
    }
    bulbs(x, x + 130, top - 26, t, 0)
  }
  function pysaCar(x, w, t, d) {
    flatcar(x, w, d)
    if (PYSA.complete && PYSA.naturalWidth) {            // the original mascot, unaltered, standing on the deck
      const h = 210, iw = h * PYSA.naturalWidth / PYSA.naturalHeight
      lit(() => glow(x + w / 2, DECK - 100, 150, 130, "rgba(255,210,140,.16)"))
      ctx.drawImage(PYSA, x + 60, DECK - h + 4, iw, h)
    }
    if (PENGUIN.complete && PENGUIN.naturalWidth) {      // Linux SA's penguin beside him, the original image, crisp
      const h = 120, pw = h * PENGUIN.naturalWidth / PENGUIN.naturalHeight, bob = Math.round(Math.sin(t * 5) * 3)
      ctx.imageSmoothingEnabled = false; ctx.drawImage(PENGUIN, x + w - pw - 40, DECK - h + 4 + bob, pw, h); ctx.imageSmoothingEnabled = true
    }
    bulbs(x + 6, x + w - 6, DECK - 6, t, 0)
  }
  function devsaCar(x, w, t, d) {                        // a boxcar, the DEVSA logo on its side
    flatcar(x, w, d)
    const top = DECK - 170
    ctx.fillStyle = "#1c1c22"; ctx.fillRect(x + 4, top, w - 8, 170)
    ctx.fillStyle = GOLD; ctx.fillRect(x + 4, top + 162, w - 8, 4)
    ctx.fillStyle = "#26262e"; for (let k = 1; k < 8; k++) ctx.fillRect(x + 4 + k * (w - 8) / 8, top, 3, 170)
    ctx.fillStyle = "#24242c"; ctx.fillRect(x, top - 12, w, 14)
    const px = 5, [mw, mh] = [26 * px, 18 * px]
    xs.mark(ctx, x + (w - mw) / 2, top + (170 - mh) / 2, px)
    bulbs(x, x + w, top - 18, t, 1)
  }
  function caboose(x, w, t, d) {
    flatcar(x, w, d)
    const top = DECK - 130
    ctx.fillStyle = ORANGE; ctx.fillRect(x + 30, top, w - 60, 130)
    ctx.fillStyle = ORANGE; ctx.fillRect(x + w / 2 - 40, top - 50, 80, 52)           // the cupola
    ctx.fillStyle = "#24242c"; ctx.fillRect(x + 20, top - 10, w - 40, 12); ctx.fillRect(x + w / 2 - 50, top - 60, 100, 12)
    ctx.fillStyle = "#ffd88a"; ctx.fillRect(x + 60, top + 30, 34, 34); ctx.fillRect(x + w - 94, top + 30, 34, 34); ctx.fillRect(x + w / 2 - 22, top - 38, 44, 24)
    lit(() => glow(x + 4, top + 50, 24, 24, "rgba(255,59,48,.55)")); ctx.fillStyle = "#ff3b30"; ctx.fillRect(x, top + 44, 10, 12)   // tail lamp
    const px = 4, [, eh] = xs.size(xs.ELF, px), ex = x + 2, ey = DECK - eh            // the elf on the back platform, waving
    xs.spr(ctx, xs.ELF, P, ex, ey, px)
    const up = Math.sin(t * 6 + 1) > 0
    ctx.fillStyle = P.S; ctx.fillRect(ex, ey + (up ? 6 : 11) * px, 2 * px, 2 * px)
    bulbs(x + 20, x + w - 20, top - 16, t, 2)
  }
  // a container per group, the logo painted on the dark steel: drawn first, then the corrugation, the shading and
  // the door bars over it, so it reads as paint on the container rather than a sticker on top
  const BOX = [TEAL, PINK, ORANGE]
  function containerCar(x, w, t, d, car) {
    flatcar(x, w, d)
    const top = DECK - 168, h = 168, c = BOX[car.i % BOX.length], bx = x + 6, bw = w - 12
    ctx.fillStyle = car.i % 2 ? "#17171d" : "#1c1c23"; ctx.fillRect(bx, top, bw, h)
    const im = car.gr.im, lx = bx + 18, ly = top + 26, lw = bw - 50, lh = h - 52
    if (im.complete && im.naturalWidth) {
      const s = Math.min(lw / im.naturalWidth, lh / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s
      ctx.globalAlpha = .92; ctx.drawImage(im, lx + (lw - iw) / 2, ly + (lh - ih) / 2, iw, ih); ctx.globalAlpha = 1
    }
    for (let k = 0; k < bw; k += 12) {
      ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(bx + k, top, 3, h)
      ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(bx + k + 6, top, 3, h)
    }
    const sh = ctx.createLinearGradient(0, top, 0, top + h); sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(.35, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(255,200,140,.06)")
    ctx.fillStyle = sh; ctx.fillRect(bx, top, bw, h)
    ctx.fillStyle = c; ctx.fillRect(bx, top, bw, 12); ctx.fillRect(bx, top + h - 12, bw, 12)
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(bx, top + 10, bw, 2); ctx.fillRect(bx, top + h - 12, bw, 2)
    ctx.fillStyle = "#3a3a44"; for (const [cx, cy] of [[bx, top], [bx + bw - 10, top], [bx, top + h - 12], [bx + bw - 10, top + h - 12]]) ctx.fillRect(cx, cy, 10, 12)
    ctx.fillStyle = "rgba(200,200,210,.35)"; ctx.fillRect(bx + bw - 22, top + 14, 3, h - 28); ctx.fillRect(bx + bw - 14, top + 14, 3, h - 28)
    bulbs(x + 6, x + w - 6, top - 8, t, car.i)
  }
  const DRAW = { engine, container: containerCar, pysa: pysaCar, devsa: devsaCar, caboose }

  // the track: ties on the ballast, the rail's dark web and its bright head
  function track() {
    ctx.fillStyle = "#4a3222"; for (let x = 0; x < W; x += 36) ctx.fillRect(x, RAIL + 10, 22, 10)
    ctx.fillStyle = "#3a3c44"; ctx.fillRect(0, RAIL + 4, W, 8)
    ctx.fillStyle = "#c4c8d0"; ctx.fillRect(0, RAIL, W, 5)
  }
  // where the engine's nose is at t, or null between passes
  function head(t) {
    for (let k = 0; k < passes.length; k++) {
      const [t0, t1] = passes[k]; if (t < t0 || t > t1) continue
      return { k, len: TRAINS[k].len, hx: lerp(-40, W + TRAINS[k].len + 40, clamp01((t - t0) / (t1 - t0))) }
    }
    return null
  }
  function draw(t) {
    const h = head(t); if (!h) return
    let x = h.hx
    for (const c of TRAINS[h.k].cars) { x -= c.w; if (x < W + 20 && x + c.w > -20) DRAW[c.type](x, c.w, t, h.hx, c); x -= GAP }
  }
  return { ready, draw, track, head }
}
