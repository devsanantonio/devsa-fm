// DEVSA FM's agents, as plush monsters: one soft blob with stubby arms and short legs, a fuzzy
// edge, tie-dye fleece in the brand colours (its team's colour leading), big shiny button eyes,
// a round grin with a couple of gappy teeth, an antenna tuft with a glowing tip, and a stitched
// >_ patch on the belly carrying its number. Our own design, in the spirit of ugly-cute plush.
//
//   drawPlush(ctx, { x, y, s, tint, number, t, stride, run, lean, airborne, armsUp, armsWide, hold,
//                    slide, look, mouth, seed })
// x, y: the point between its feet, on the floor. s: scale (1 is ~120 px tall). stride: the walk
// cycle in radians. run: 0..1, how hard it's moving. Returns where its head is, for a status chip.

const PLUSH_FUR = {}
function plushFur(ctx, tint) {
  if (PLUSH_FUR[tint]) return PLUSH_FUR[tint]
  const c = document.createElement("canvas"); c.width = c.height = 240; const g = c.getContext("2d")
  g.fillStyle = "#f4ead6"; g.fillRect(0, 0, 240, 240)
  const all = ["#00b2a9", "#ef426f", "#ff8200"], others = all.filter(x => x !== tint)
  let sd = tint.charCodeAt(1) * 131 + tint.charCodeAt(3); const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 46; i++) {                          // tie-dye: soft blobs, the team's colour leading
    const col = r() < .72 ? tint : others[i % 2], x = r() * 240, y = r() * 240, rad = 18 + r() * 34
    for (const [dx, dy] of [[0, 0], [240, 0], [-240, 0], [0, 240], [0, -240]]) {      // wrap, so the pattern tiles
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad)
      gr.addColorStop(0, col + "c8"); gr.addColorStop(.6, col + "70"); gr.addColorStop(1, col + "00")
      g.fillStyle = gr; g.beginPath(); g.arc(x + dx, y + dy, rad, 0, Math.PI * 2); g.fill()
    }
  }
  g.globalAlpha = .18; g.strokeStyle = "#ffffff"; g.lineWidth = 1               // fleece: a fine tuft texture
  for (let i = 0; i < 900; i++) { const x = r() * 240, y = r() * 240, a = r() * Math.PI * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); g.stroke() }
  g.globalAlpha = 1
  return (PLUSH_FUR[tint] = { canvas: c, pattern: ctx.createPattern(c, "repeat") })
}

function drawPlush(ctx, o) {
  const TAU = Math.PI * 2, s = o.s, run = o.run || 0, stride = o.stride || 0, t = o.t || 0
  const fur = plushFur(ctx, o.tint)
  const W = 66 * s, Hb = 92 * s                                   // the body
  const waddle = o.airborne || o.slide ? 0 : Math.sin(stride) * .1 * run
  const bob = o.airborne ? 0 : Math.abs(Math.sin(stride)) * 4 * s * run
  const squash = o.squash || 0                                    // landing: wider and shorter
  const bw = W * (1 + squash * .12), bh = Hb * (1 - squash * .1)
  // shadow on the floor
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(o.x, o.y, 30 * s, 7 * s, 0, 0, TAU); ctx.fill()
  ctx.save(); ctx.translate(o.x, o.y - (o.liftPx || 0) - bob); ctx.rotate((o.lean || 0) + waddle)
  const legH = 16 * s, cy = -legH - bh / 2                       // body centre, above the legs
  const furFill = () => { const m = new DOMMatrix().translateSelf(o.seed * 37 % 240, o.seed * 53 % 240).scaleSelf(s * .9, s * .9); fur.pattern.setTransform(m); return fur.pattern }
  // legs: two stubby fleece stumps, stepping when it walks, apart when it slides
  for (const d of [-1, 1]) {
    const step = o.airborne ? -6 * s : o.slide ? 0 : Math.max(0, Math.sin(stride) * d) * 7 * s * run
    const lx = d * (o.slide ? 22 : 14) * s + (o.slide ? 0 : Math.sin(stride) * d * 4 * s * run)
    ctx.fillStyle = furFill(); ctx.beginPath(); ctx.roundRect(lx - 9 * s, -legH - 6 * s - step, 18 * s, legH + 6 * s, 8 * s); ctx.fill()
    ctx.fillStyle = "rgba(60,30,40,.35)"; ctx.beginPath(); ctx.ellipse(lx, -2 * s - step, 9 * s, 3 * s, 0, 0, TAU); ctx.fill()   // the sole
  }
  // arms: stubby nubs, swinging, up for a shot, out wide on defence, in to hold the ball
  const armAt = d => o.armsUp ? [d * bw * .42, cy - bh * .32, d * -.5] : o.armsWide ? [d * bw * .62, cy - bh * .02, d * -1.35]
    : o.hold ? [d * bw * .3, cy + bh * .14, d * .9] : [d * bw * .5, cy + bh * .08 + Math.sin(stride) * d * 4 * s * run, d * (.25 + Math.sin(stride) * d * .25 * run)]
  for (const d of [-1, 1]) { const [ax, ay, rot] = armAt(d)
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(rot + (o.armsUp ? Math.PI : 0)); ctx.fillStyle = furFill()
    ctx.beginPath(); ctx.ellipse(0, 10 * s, 8 * s, 15 * s, 0, 0, TAU); ctx.fill(); ctx.restore() }
  // the body: a soft blob, its edge fuzzed with little tufts
  const body = new Path2D()
  body.ellipse(0, cy, bw / 2, bh / 2, 0, 0, TAU)
  for (let i = 0; i < 44; i++) {
    const a = i / 44 * TAU, j = .7 + .6 * Math.abs(Math.sin(i * 7.3 + o.seed))
    body.moveTo(Math.cos(a) * bw / 2 + 3.4 * s * j, cy + Math.sin(a) * bh / 2)
    body.arc(Math.cos(a) * bw / 2, cy + Math.sin(a) * bh / 2, 3.4 * s * j, 0, TAU)
  }
  ctx.fillStyle = furFill(); ctx.fill(body)
  ctx.save(); ctx.clip(body)                                       // soft shading: lit from above
  const sh = ctx.createLinearGradient(0, cy - bh / 2, 0, cy + bh / 2); sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(.6, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(30,10,30,.28)")
  ctx.fillStyle = sh; ctx.fillRect(-bw, cy - bh, bw * 2, bh * 2); ctx.restore()
  // the antenna tuft, its tip glowing in the team colour
  const top = cy - bh / 2, tipX = -(o.lean || 0) * 20 * s, tipY = top - 18 * s
  ctx.strokeStyle = o.tint; ctx.lineWidth = 3 * s; ctx.lineCap = "round"
  for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(k * 3 * s, top + 2 * s); ctx.quadraticCurveTo(k * 6 * s, top - 8 * s, tipX + k * 2 * s, tipY + Math.abs(k) * 3 * s); ctx.stroke() }
  const on = Math.sin(t * TAU * 1.2 + o.seed * 3) > -.3
  ctx.save(); ctx.shadowColor = o.tint; ctx.shadowBlur = on ? 14 * s : 0; ctx.fillStyle = on ? "#ffffff" : "#ddd"
  ctx.beginPath(); ctx.arc(tipX, tipY - 2 * s, 4 * s, 0, TAU); ctx.fill(); ctx.fillStyle = o.tint; ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(tipX, tipY - 2 * s, 4 * s, 0, TAU); ctx.fill(); ctx.restore()
  ctx.lineCap = "butt"
  if (o.back) {                                                   // seen from behind: no face, no patch
    ctx.restore()
    return { headX: o.x, headY: o.y - (o.liftPx || 0) - bob - legH - bh - 20 * s, bellyY: o.y - (o.liftPx || 0) - bob - legH - bh * .35 }
  }
  // button eyes: dark, ringed in blue, a white glint; they look where it's going, and blink
  const look = (o.look || 0) * s, blink = ((t * 1.3 + o.seed) % 4) < .12
  for (const d of [-1, 1]) {
    const ex = d * 14 * s + look, ey = cy - bh * .2
    ctx.fillStyle = "#1d4fa3"; ctx.beginPath(); ctx.ellipse(ex, ey, 8.5 * s, blink ? 1.5 * s : 8.5 * s, 0, 0, TAU); ctx.fill()
    if (!blink) { ctx.fillStyle = "#101418"; ctx.beginPath(); ctx.arc(ex, ey, 6.4 * s, 0, TAU); ctx.fill()
      ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.beginPath(); ctx.arc(ex - 2.4 * s, ey - 2.6 * s, 1.9 * s, 0, TAU); ctx.fill() }
  }
  // the grin: round, open wider when it cheers, two mismatched teeth
  const mo = .55 + .45 * (o.mouth || 0), my = cy + bh * .02
  ctx.fillStyle = "#c9405e"; ctx.beginPath(); ctx.ellipse(look * .6, my, 13 * s, 9 * s * mo, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = "#6e1730"; ctx.beginPath(); ctx.ellipse(look * .6, my + 1 * s, 10.5 * s, 7 * s * mo, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = "#f2e6bf"
  ctx.beginPath(); ctx.roundRect(look * .6 - 7 * s, my - 7 * s * mo, 5 * s, 6 * s, 1.5 * s); ctx.fill()           // top left
  ctx.beginPath(); ctx.roundRect(look * .6 + 3 * s, my + 7 * s * mo - 5 * s, 4.4 * s, 5 * s, 1.5 * s); ctx.fill()  // bottom right, crooked
  // the stitched patch on the belly: >_ and its number
  const px = 0, py = cy + bh * .27, pw = 30 * s, ph = 24 * s
  ctx.fillStyle = "#1b1b1e"; ctx.beginPath(); ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 5 * s); ctx.fill()
  ctx.setLineDash([2.5 * s, 2 * s]); ctx.strokeStyle = "rgba(244,234,214,.9)"; ctx.lineWidth = 1.2 * s
  ctx.beginPath(); ctx.roundRect(px - pw / 2 + 2.5 * s, py - ph / 2 + 2.5 * s, pw - 5 * s, ph - 5 * s, 3.5 * s); ctx.stroke(); ctx.setLineDash([])
  ctx.textAlign = "center"; ctx.textBaseline = "middle"
  ctx.font = `700 ${Math.round(8 * s)}px "Geist Mono"`; ctx.fillStyle = "rgba(244,234,214,.9)"; ctx.fillText(">_", px, py - 5 * s)
  ctx.font = `700 ${Math.round(11 * s)}px "Geist Mono"`; ctx.fillStyle = o.tint; ctx.fillText(o.number, px, py + 5 * s)
  // the ball, held in front, if it's holding something
  ctx.restore()
  const headY = o.y - (o.liftPx || 0) - bob - legH - bh - 20 * s
  return { headX: o.x, headY, bellyY: o.y - (o.liftPx || 0) - bob - legH - bh * .35 }
}
