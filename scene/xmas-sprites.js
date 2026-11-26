// DEVSA FM's Christmas cast and DEVSA's marks as 8-bit sprites, shared by the Christmas scenes.
// Each sprite is rows of characters; each character a palette key, "." transparent. Draw with
//   xs.spr(ctx, xs.SANTA, xs.PAL, x, y, px, { flip, alpha })        x, y: top-left; px: pixel size
// and size things with xs.size(map, px) -> [w, h]. The marks have their own helpers (clapper, mark).
// The marks keep their own colours and are never recoloured; on night scenes they carry a dark-grey rim
// so the near-black body doesn't vanish. Our own designs (Nov 2026): Santa, reindeer, elf, snowman, gift.
const xs = (() => {
  const TEAL = "#00b2a9", PINK = "#ef426f", ORANGE = "#ff8200", GOLD = "#ffd343"
  const PAL = {
    R: "#d8343c", r: "#9e2028", W: "#f4f4f4", w: "#c9ccd4", S: "#f0b48a", s: "#cf8d66", K: "#2a2a32", k: "#4a4a56",
    G: GOLD, P: "#ef6f8a", B: "#8a5a3a", b: "#5e3b24", L: "#d2b089", T: "#c9a26a", N: PINK, E: TEAL, e: "#007f78",
    O: ORANGE, C: "#1c1c1c", H: "#e9e2d0",
  }
  const SANTA = [
    "...........RRR..WW..", "..........RRRRRWWWW.", ".........RRRRRRRWWW.", "........RRRRRRRR....", "......WWWWWWWWWWW...", "......WWWWWWWWWWW...",
    "......SSSSSSSSSSS...", "......SSCSSSSSCSS...", "......SPSSSssSSPS...", ".....WWWWWWWWWWWWW..", "....WWWWWWwWwWWWWWW.", "....WWWWWWWWWWWWWWW.",
    "...RRRWWWWWWWWWWRRRR", "..RRRRRWWWWWWWWRRRRR", "..RRRRRRWWWWWWRRRRRR", "..RRRRRRRWWWWRRRRRRR", "..KKRRRRRRWWRRRRRRKK", "..KKKKKKKKGGKKKKKKKK",
    "...RRRRRRRWWRRRRRRR.", "...WWWWWWWWWWWWWWWW.", "....rrrrrr..rrrrrr..", "....rrrrrr..rrrrrr..", "...KKKKKKK..KKKKKKK.", "...KkKKKKK..KkKKKKK."]
  // Santa seated (for the sleigh and the train): the top 18 rows, legs tucked out of sight
  const SANTA_SEATED = SANTA.slice(0, 18)
  // reindeer, side view facing right; its nose (N) cycles teal / pink / orange: pass { N: colour } in the palette
  const DEER = [
    "...............T...T....", "..............TT..TT....", "...............TTTT.....", "................TT......", "...............BBBB.....",
    "..............BBCBBB....", "..............BBBBBBBN..", ".............BBBB.......", "..B..........BBB........", "..BBBBBBBBBBBBBB........",
    ".BBBBBBBBBBBBBBB........", ".BBLLLLLLLLLLLBB........", "..BBLLLLLLLLLBB.........", "..BB.BB....BB.BB........", "..BB.BB....BB.BB........",
    "..bb.bb....bb.bb........"]
  // the same reindeer mid-leap (legs tucked), for a flying team: alternate with DEER for a gallop
  const DEER_LEAP = DEER.slice(0, 13).concat(["..BBB......BBB..........", ".bb..........bb.........", "........................"])
  const ELF = [
    "........G.....", ".......EE.....", "......EEE.....", ".....EEEE.....", "....EEEEEE....", "...PPPPPPPP...", "..S.SSSSSS.S..",
    "..SSSCSSCSSS..", "....SSSSSS....", "....SSPPSS....", "...EEEEEEEE...", "..EEEEGGEEEE..", "..SEEEEEEEES..", "...EEEEEEEE...",
    "...eeeeeeee...", "....OO..OO....", "....OO..OO....", "...KKK..KKK..."]
  // the elf's other step, for a walk cycle
  const ELF_STEP = ELF.slice(0, 15).concat(["...OO....OO...", "...OO....OO...", "..KKK....KKK.."])
  const SNOWMAN = [
    ".....KKKK.....", ".....KKKK.....", "....KKKKKK....", "....RRRRRR....", "....WWWWWW....", "...WWCWWCWW...", "...WWWWOOWW...",
    "....WCCCCW....", "...EEEEEEEE...", "..WWWWEEWWWW..", ".WWWWWWEWWWWW.", ".WWWWWCWWWWWW.", ".WWWWWWWWWWWW.", ".WWWWWCWWWWWW.",
    "..WWWWWWWWWW..", ".WWWWWWWWWWWW.", "WWWWWWWWWWWWWW", "WWWWWWWWWWWWWW", ".WWWWWWWWWWWW.", "..wwwwwwwwww.."]
  const GIFT = ["...GG..GG...", "....GGGG....", ".PPPPGGPPPP.", ".PPPPGGPPPP.", ".GGGGGGGGGG.", ".PPPPGGPPPP.", ".PPPPGGPPPP.", ".PPPPGGPPPP.", ".PPPPGGPPPP."]
  // gift in other wraps: pass a palette that remaps P (wrap) and G (ribbon)
  const WRAPS = [{ P: PINK, G: GOLD }, { P: TEAL, G: "#f4f4f4" }, { P: ORANGE, G: "#f4f4f4" }, { P: "#f4f4f4", G: TEAL }, { P: GOLD, G: PINK }]   // brand only: tabs, gold, white
  // Santa's sleigh, side view facing right: red with gold runners and trim, a sack of gifts behind
  const SLEIGH = [
    "..........................GG",
    "...........................G",
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRG",
    "RGGGGGGGGGGGGGGGGGGGGGGGGGRG",
    "RRRRRRRRRRRRRRRRRRRRRRRRRRR.",
    ".RRRRRRRRRRRRRRRRRRRRRRRRR..",
    "..RRRRRRRRRRRRRRRRRRRRRRR...",
    "...G........G........G......",
    "GGGGGGGGGGGGGGGGGGGGGGGGG...",
    ".GGGGGGGGGGGGGGGGGGGGGG....."]
  const SACK = ["....bb....", "...bbbb...", "..BBBBBB..", ".BBBBBBBB.", "BBBBBBBBBB", "BBBBBBBBBB", ".BBBBBBBB."]

  // ---- DEVSA's marks ----
  const MPAL = { A: "#9a9a9a", H: "#2a2a2a", T: TEAL, t: "#007f78", P: PINK, p: "#a82e4f", r: "#111111", O: ORANGE, o: "#b35a00",
    C: "#0b0b0b", L: "#eeeeee", D: "#2d2d2d", B: "#0b0b0b", W: "#e8e8e8", k: "#2a2a2a" }
  // the DEVSA FM radio: dial tabs, antenna, >FM_
  const RADIO = ["........................A.", ".......................A..", "......................A...", ".....................A....", "....................HH....",
    ".TTTTTTTTT.PPPPPPP.OOOOOO.", "TtTtTtTtTT.PpPrPpP.OoOoOOO", "HHHHHHHHHHHHHHHHHHHHHHHHHH", "HCCCCCCCCCCCCCCCCCCCCCCCCH", "HCCLLCCCCCCCCCCCCCCCCCCCCH",
    "HCCCLLCCCCLLLLCLLCCCLLCCCH", "HCCCCLLCCCLCCCCLLLCLLLCCCH", "HCCCCCLLCCLLLCCLCLLLCLCCCH", "HCCCCLLCCCLCCCCLCCLCCLCCCH", "HCCCLLCCCCLCCCCLCCCCCLCCCH",
    "HCCLLCCCCCCCCCCCCCCCCCCCCH", "HCCCCCCCCCLLLLLLLLLLLLCCCH", "HCCCCCCCCCLLLLLLLLLLLLCCCH", "HCCCCCCCCCCCCCCCCCCCCCCCCH", ".HHHHHHHHHHHHHHHHHHHHHHHH."]
  const NOTE = ["..LL", "..LL", "..L.", "..L.", "LLL.", "LLL."]
  // the DEVSA TV clapperboard: two leaning striped bars (the lower with the slate's three dots) over >TV_
  function clapBar(dots) {
    const rows = []
    for (let r = 0; r < 5; r++) {
      let s = ""
      for (let c = 0; c < 26; c++) {
        const u = c - (4 - r); let ch = "D"
        if (u >= 6 && u < 11) ch = "T"; else if (u >= 12 && u < 17) ch = "P"; else if (u >= 18 && u < 23) ch = "O"
        if (dots && c < 5) ch = (r === 1 && c === 1) || (r === 3 && (c === 1 || c === 3)) ? "W" : "B"
        if ((r === 0 || r === 4) && (c === 0 || c === 25)) ch = "."
        s += ch
      }
      rows.push(s)
    }
    return rows
  }
  const CLAP_TOP = clapBar(false), CLAP_MID = clapBar(true)
  const TV_BODY = ["kCCCCCCCCCCCCCCCCCCCCCCCCk", "kCCCCCCCCCCCCCCCCCCCCCCCCk", "kCCLLCCCCCCCCCCCCCCCCCCCCk", "kCCCLLCCCCLLLLLCLLCCCLLCCk",
    "kCCCCLLCCCCCLCCCLLCCCLLCCk", "kCCCCCLLCCCCLCCCCLLCLLCCCk", "kCCCCLLCCCCCLCCCCLLCLLCCCk", "kCCCLLCCCCCCLCCCCCLLLCCCCk", "kCCLLCCCCCCCLCCCCCCLCCCCCk",
    "kCCCCCCCCCCCCCCCCCCCCCCCCk", "kCCCCCCCCCLLLLLLLLLLLLCCCk", "kCCCCCCCCCLLLLLLLLLLLLCCCk", "kCCCCCCCCCCCCCCCCCCCCCCCCk", ".kkkkkkkkkkkkkkkkkkkkkkkk."]
  // the DEVSA logo and its alt: three tabs, a gap, the window with >SA_ (chunky S and A, like the logo's)
  const TABS = [".TTTTTTT.PPPPPPPP.OOOOOOO.", "TTTTTTTT.PPPPPPPP.OOOOOOOO", "TTTTTTTT.PPPPPPPP.OOOOOOOO"]
  const SA = (() => {
    const g = Array.from({ length: 14 }, (_, r) => r === 13 ? ".kkkkkkkkkkkkkkkkkkkkkkkk." : "k" + "C".repeat(24) + "k").map(r => [...r])
    const put = (r, c) => { g[r][c] = "L" }
    ;[[2, 3], [3, 4], [4, 5], [5, 6], [6, 5], [7, 4], [8, 3]].forEach(([r, c]) => { put(r, c); put(r, c + 1) })
    const S = [".LLLL", "LL...", ".LLL.", "...LL", "LLLL."], A = [".LLL.", "LL.LL", "LLLLL", "LL.LL", "LL.LL"]
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { if (S[r][c] === "L") put(3 + r, 10 + c); if (A[r][c] === "L") put(3 + r, 16 + c) }
    for (let c = 10; c <= 20; c++) { put(10, c); put(11, c) }
    return g.map(r => r.join(""))
  })()

  /** draw a sprite. opts: flip (mirror horizontally), alpha, lift(q) -> rows to raise column q by */
  function spr(ctx, map, pal, x, y, px, opts = {}) {
    const w = map[0].length
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha
    map.forEach((row, r) => [...row].forEach((ch, q) => {
      if (ch === ".") return
      const col = pal[ch]; if (!col) return
      const qq = opts.flip ? w - 1 - q : q, lift = opts.lift ? opts.lift(q) : 0
      ctx.fillStyle = col; ctx.fillRect(Math.round(x + qq * px), Math.round(y + (r - lift) * px), Math.ceil(px), Math.ceil(px))
    }))
    if (opts.alpha != null) ctx.globalAlpha = 1
  }
  const size = (map, px) => [map[0].length * px, map.length * px]
  /** the DEVSA TV clapperboard; open 0 (shut) .. 1 (open). 26 x 26 cells */
  function clapper(ctx, x, y, px, open = 0) {
    spr(ctx, CLAP_TOP, MPAL, x, y, px, { lift: q => Math.round(open * (1 + q * .22)) })
    spr(ctx, CLAP_MID, MPAL, x, y + 6 * px, px)
    spr(ctx, TV_BODY, MPAL, x, y + 12 * px, px)
  }
  /** the DEVSA logo (alt: white tabs). 26 x 18 cells */
  function mark(ctx, x, y, px, alt = false) {
    spr(ctx, TABS, alt ? { T: "#eeeeee", P: "#eeeeee", O: "#eeeeee" } : MPAL, x, y, px)
    spr(ctx, SA, MPAL, x, y + 4 * px, px)
  }
  /** the radio, with notes rising from it; k01 a 0..1 phase that should loop (e.g. (t / T * 12) % 1) */
  function radio(ctx, x, y, px, k01 = 0, noteSpread = 1) {
    spr(ctx, RADIO, MPAL, x, y, px)
    for (let i = 0; i < 4; i++) {
      const k = (k01 + i / 4) % 1, nx = x + 22 * px + Math.sin(k * Math.PI * 2 + i) * 5 * px * noteSpread + i * 3 * px, ny = y - 3 * px - k * 46 * px
      const a = k < .15 ? k / .15 : 1 - (k - .15) / .85
      spr(ctx, NOTE, { L: [TEAL, PINK, ORANGE, "#eeeeee"][i] }, nx, ny, px, { alpha: a })
    }
  }

  /** The DEVSA Christmas tree from the DEVSA TV desk (episode 1): 1 + 2 + 3 + 4 terminal windows, evergreen with a
   * >_ face and their three tabs as blinking lights, the DEVSA window (the mark in pixels) on top, a gold star, a
   * trunk. Drawn standing on `base`, centred on cx; px is one window pixel (the desk used 10). t in seconds, blinking
   * a whole number of times per loopT so a loop stays seamless. Returns { top, width }. */
  function devsaTree(ctx, cx, base, px, t, loopT = 60) {
    const TAU = Math.PI * 2, LIGHTS = [TEAL, PINK, ORANGE, GOLD], WW = 22 * px, WH = 18 * px, GAP = 2.4 * px
    const cell = (x, y, col, a, b, w = 1, h = 1) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x + a * px), Math.round(y + b * px), Math.ceil(w * px), Math.ceil(h * px)) }
    const trunkH = 8 * px, top = base - trunkH - 4 * WH - 3 * GAP
    ctx.fillStyle = "#6b4528"; ctx.fillRect(cx - 5 * px, base - trunkH, 10 * px, trunkH)
    ctx.fillStyle = "#4a2f1a"; ctx.fillRect(cx - 3 * px, base - trunkH, px, trunkH); ctx.fillRect(cx + px, base - trunkH + 2 * px, px, trunkH - 2 * px)
    let k = 0
    for (let r = 0; r < 4; r++) {
      const n = r + 1, rowW = n * WW + (n - 1) * GAP
      for (let i = 0; i < n; i++, k++) {
        const x = Math.round(cx - rowW / 2 + i * (WW + GAP)), y = Math.round(top + r * (WH + GAP))
        if (r === 0) {   // the DEVSA window: the mark, unaltered
          const INK = "#eeeeee"
          cell(x, y, INK, 1, 0, 20, 18); cell(x, y, INK, 0, 1, 22, 16); cell(x, y, "#111", 1, 4, 20, 13)
          cell(x, y, TEAL, 1, 1, 6, 2); cell(x, y, PINK, 8, 1, 6, 2); cell(x, y, ORANGE, 15, 1, 6, 2)
          for (const [a, b] of [[3, 7], [4, 8], [5, 9], [6, 10], [5, 11], [4, 12], [3, 13]]) cell(x, y, INK, a, b, 2, 1)
          const S = [".###", "#...", ".##.", "...#", "###."], A = [".##.", "#..#", "####", "#..#", "#..#"]
          for (let rr = 0; rr < 5; rr++) for (let c = 0; c < 4; c++) { if (S[rr][c] === "#") cell(x, y, INK, 10 + c, 7 + rr); if (A[rr][c] === "#") cell(x, y, INK, 15 + c, 7 + rr) }
          cell(x, y, INK, 10, 13, 9, 2)
        } else {         // an evergreen window
          const FRAME = "#34b56c", BODY = "#0d2418", FACE = "#9fe0b8"
          cell(x, y, FRAME, 1, 0, 20, 18); cell(x, y, FRAME, 0, 1, 22, 16); cell(x, y, BODY, 1, 4, 20, 13)
          for (let j = 0; j < 3; j++) {
            const on = Math.sin(TAU * (t / loopT) * 12 + k * 1.7 + j * 2.3) > -0.3
            cell(x, y, on ? LIGHTS[(k * 3 + j) % 4] : "#1d4a31", 1 + j * 7, 1, 6, 2)
          }
          for (const [a, b] of [[4, 7], [5, 8], [6, 9], [7, 10], [6, 11], [5, 12], [4, 13]]) cell(x, y, FACE, a, b, 2, 1)
          cell(x, y, FACE, 11, 13, 7, 1)
        }
      }
    }
    const STAR = ["...#...", "...#...", "#######", ".#####.", "..###..", ".##.##.", "#.....#"], st = 1.4 * px
    ctx.fillStyle = Math.sin(TAU * (t / loopT) * 16) > -0.5 ? GOLD : "#e0a800"
    STAR.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === "#") ctx.fillRect(Math.round(cx - 3.5 * st + rx * st), Math.round(top - 8 * st + ry * st), Math.ceil(st), Math.ceil(st)) }))
    return { top: top - 8 * st, width: 4 * WW + 3 * GAP }
  }
  const NOSE = [TEAL, PINK, ORANGE]
  return { TEAL, PINK, ORANGE, GOLD, PAL, MPAL, SANTA, SANTA_SEATED, DEER, DEER_LEAP, ELF, ELF_STEP, SNOWMAN, GIFT, WRAPS, SLEIGH, SACK, devsaTree,
    RADIO, NOTE, CLAP_TOP, CLAP_MID, TV_BODY, TABS, SA, NOSE, spr, size, clapper, mark, radio }
})()
