// The river boat, after GO RIO's boats on the River Walk: a long open boat with rounded ends, a dark hull, tall side
// panels of cut metal (papel picado sunbursts, and the DEVSA alt mark cut through every other panel) in teal, a wood
// rim, its wake, and at Christmas chasing bulbs along the rim. Shared by riverwalk.html (where it was drawn first) and
// xmas-arneson.html. It is drawn in the River Walk's coordinates, x 470 to 1110 with its rim at y 800; a scene places
// it with its own translate and scale. Riders are the scene's: draw them first so the panels hide their legs.
//   const boat = makeRioBoat({ ALT, ROCK, LT })   ALT: the devsa-alt-logo image; ROCK(t): the rock in px; LT: loop length
//   boat.barge(ctx, t); boat.bulbs(ctx, t)
window.makeRioBoat = function ({ ALT, ROCK, LT }) {
  const TAU = Math.PI * 2, TEAL = "#00b2a9", PINK = "#ef426f", ORANGE = "#ff8200", GOLD = "#ffd343"
  const BOAT = { panel: "#2c8fa3", panelDark: "#1d6474", cut: "#0b1f24", rim: "#c58a4a", hull: "#1a1d20", hullLine: "#3a3f45" }
  // the alt logo turned into a cut: its black window and tabs become openings (cut colour),
  // its light chevron, SA and cursor stay as metal (panel colour). Built once.
  let CUT = null
  function cutMark() {
    if (CUT || !ALT.complete) return CUT
    const c = document.createElement("canvas"); c.width = 368; c.height = 276
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(ALT, 0, 0, c.width, c.height)
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
    const [cr, cg, cb] = hex(BOAT.cut), [pr, pg, pb] = hex(BOAT.panel)
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 20) continue
      const light = p[i] > 128
      p[i] = light ? pr : cr; p[i + 1] = light ? pg : cg; p[i + 2] = light ? pb : cb
    }
    // the tabs are light in the alt logo; on a cut they read as openings too
    for (let y = 0; y < c.height * 0.17; y++) for (let q = 0; q < c.width; q++) { const i = (y * c.width + q) * 4
      if (p[i + 3] >= 20) { p[i] = cr; p[i + 1] = cg; p[i + 2] = cb } }
    x.putImageData(d, 0, 0); CUT = c; return CUT
  }
  function barge(ctx, t, dir = 1) {                         // dir: 1 heading right (the wake trails left), -1 heading left
    const x0 = 470, x1 = 1110, top = 800 + ROCK(t), panelH = 92, r = 46
    const y1 = top + panelH, hullH = 40
    // hull: dark, rounded ends, with the black rubber bumper line
    ctx.fillStyle = BOAT.hull
    ctx.beginPath(); ctx.moveTo(x0 + r, y1); ctx.lineTo(x1 - r, y1); ctx.quadraticCurveTo(x1 + 6, y1, x1 + 6, y1 + hullH * .5)
    ctx.quadraticCurveTo(x1, y1 + hullH, x1 - r, y1 + hullH); ctx.lineTo(x0 + r, y1 + hullH)
    ctx.quadraticCurveTo(x0, y1 + hullH, x0 - 6, y1 + hullH * .5); ctx.quadraticCurveTo(x0 - 6, y1, x0 + r, y1); ctx.fill()
    ctx.fillStyle = BOAT.hullLine; ctx.fillRect(x0 + 10, y1 + 10, x1 - x0 - 20, 6)
    // the panels: rounded at both ends, a wood rim on top
    ctx.save()
    ctx.beginPath(); ctx.moveTo(x0 + r, top); ctx.lineTo(x1 - r, top); ctx.quadraticCurveTo(x1, top, x1, top + r)
    ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, top + r); ctx.quadraticCurveTo(x0, top, x0 + r, top); ctx.closePath()
    ctx.fillStyle = BOAT.panel; ctx.fill(); ctx.clip()
    // panel seams and cut-out sunbursts, like the boats' papel picado panels
    const n = 7, pw = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const cx = x0 + pw * (i + .5), cy = top + panelH * .55
      if (i % 2 === 1) {                   // every other panel: the DEVSA mark cut through the metal
        ctx.fillStyle = BOAT.panelDark; ctx.fillRect(x0 + pw * i - 2, top, 4, panelH)
        const cut = cutMark(); if (cut) { const lh = panelH * .7, lw = lh * cut.width / cut.height
          ctx.drawImage(cut, cx - lw / 2, top + (panelH - lh) / 2 + 3, lw, lh) }
        // the small punched holes papel picado has round its edge
        ctx.fillStyle = BOAT.cut
        for (const dx of [-1, 1]) for (const yy of [top + 12, y1 - 12]) { ctx.beginPath(); ctx.arc(cx + dx * pw * .42, yy, 3, 0, TAU); ctx.fill() }
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - pw * .3 + k * pw * .15, top + 9, 2, 0, TAU); ctx.fill() }
        continue
      }
      ctx.fillStyle = BOAT.panelDark; ctx.fillRect(x0 + pw * i - 2, top, 4, panelH)
      ctx.fillStyle = BOAT.cut
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fill()
      for (let k = 0; k < 12; k++) { const a = k * TAU / 12
        ctx.save(); ctx.translate(cx + Math.cos(a) * 21, cy + Math.sin(a) * 21); ctx.rotate(a)
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, TAU); ctx.fill(); ctx.restore() }
      for (const dx of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + dx * pw * .42, top + 20, 3, 0, TAU); ctx.fill()
        ctx.beginPath(); ctx.arc(cx + dx * pw * .42, y1 - 18, 3, 0, TAU); ctx.fill() }
    }
    ctx.restore()
    ctx.fillStyle = BOAT.rim
    ctx.beginPath(); ctx.moveTo(x0 + r, top - 6); ctx.lineTo(x1 - r, top - 6); ctx.quadraticCurveTo(x1 + 2, top - 6, x1 + 2, top + r - 4)
    ctx.lineTo(x1 - 4, top + r - 4); ctx.quadraticCurveTo(x1 - 4, top, x1 - r, top); ctx.lineTo(x0 + r, top)
    ctx.quadraticCurveTo(x0 + 4, top, x0 + 4, top + r - 4); ctx.lineTo(x0 - 2, top + r - 4); ctx.quadraticCurveTo(x0 - 2, top - 6, x0 + r, top - 6); ctx.fill()
    // the wake behind it
    for (let k = 0; k < 4; k++) { const u = ((t / LT) * 8 + k / 4) % 1
      ctx.fillStyle = `rgba(235,235,235,${(.45 * (1 - u)).toFixed(2)})`
      ctx.fillRect(dir > 0 ? x0 - 20 - u * 220 : x1 - 10 + u * 220, y1 + 24 + (k % 2) * 10, 30 + u * 40, 5) }
  }
  
  function bulbs(ctx, t) {
    const x0 = 470, x1 = 1110, y = 800 + ROCK(t) - 6, C = [TEAL, PINK, ORANGE, GOLD], step = Math.floor(t * 6)
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 30, y); ctx.lineTo(x1 - 30, y); ctx.stroke()
    for (let x = x0 + 36, i = 0; x < x1 - 30; x += 20, i++) {
      const c = C[(i + step) % 4], on = (i + step) % 4 === 0 ? 1 : .55
      ctx.save(); ctx.globalCompositeOperation = "lighter"; const gr = ctx.createRadialGradient(x, y + 3, 0, x, y + 3, 14), [r, gg, bl] = [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16)); gr.addColorStop(0, `rgba(${r},${gg},${bl},${(.4 * on).toFixed(3)})`); gr.addColorStop(1, `rgba(${r},${gg},${bl},0)`); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y + 3, 14, 0, TAU); ctx.fill(); ctx.restore()
      ctx.fillStyle = c; ctx.globalAlpha = .6 + .4 * on; ctx.beginPath(); ctx.arc(x, y + 3, 4.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
    }
  }
  
  return { BOAT, barge, bulbs }
}
