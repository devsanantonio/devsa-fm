// Builds the playground: every scene, live in the browser, nothing to install. GitHub Pages publishes it
// (.github/workflows/pages.yml); to look at it locally:
//   node tools/site.cjs && npx serve _site      (or any static server, then open its address)
// It copies scene/ (without the City's icons and the logos, which aren't public), takes a thumbnail of each
// scene listed in tools/scenes.json, and writes index.html and play.html into _site/.
// Needs Chrome: set CHROME=/path/to/chrome if it isn't the macOS app.
const fs = require('fs'), path = require('path')
let puppeteer
try { puppeteer = require('puppeteer-core') } catch { puppeteer = require(process.env.PUPPETEER_CORE) }
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, '_site')
const REPO = 'https://github.com/devsanantonio/devsa-fm'
const { scenes } = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenes.json'), 'utf8'))
const PRIVATE = new Set(['icons', path.join('proj', 'groups'), path.join('proj', 'partners')])
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

fs.rmSync(OUT, { recursive: true, force: true })
fs.cpSync(path.join(ROOT, 'scene'), path.join(OUT, 'scene'), {
  recursive: true, filter: src => !PRIVATE.has(path.relative(path.join(ROOT, 'scene'), src)) })
fs.copyFileSync(path.join(ROOT, 'mark', 'devsa-fm-mark.svg'), path.join(OUT, 'mark.svg'))
fs.copyFileSync(path.join(ROOT, '.github', 'media', 'social-preview.png'), path.join(OUT, 'social-preview.png'))
fs.mkdirSync(path.join(OUT, 'thumbs'))

const page = (title, body, extraHead = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="A night in San Antonio, in ASCII: DEVSA FM's scenes, live in your browser. Open source; build one.">
<meta property="og:title" content="${esc(title)}">
<meta property="og:image" content="social-preview.png">
<link rel="icon" href="mark.svg">
<style>
  @font-face { font-family: "Geist Mono"; font-weight: 700; src: url(scene/fonts/GeistMono-Bold.woff2) format("woff2"); }
  @font-face { font-family: "Geist"; font-weight: 500; src: url(scene/fonts/Geist-Medium.woff2) format("woff2"); }
  @font-face { font-family: "Geist"; font-weight: 900; src: url(scene/fonts/Geist-Black.woff2) format("woff2"); }
  :root { --bg: #0c0c0c; --card: #171717; --line: #262626; --text: #f4f4f5; --muted: rgba(255,255,255,.66);
          --teal: #00b2a9; --pink: #ef426f; --orange: #ff8200 }
  * { box-sizing: border-box }
  html, body { margin: 0; background: var(--bg); color: var(--text); font: 500 17px/1.5 "Geist", system-ui, sans-serif }
  a { color: inherit }
  .eyebrow { font: 700 12px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--muted) }
  .bars { display: flex; gap: 5px } .bars i { width: 34px; height: 5px }
  ${extraHead}
</style>
</head>
<body>
${body}
</body>
</html>
`
const BARS = '<div class="bars"><i style="background:var(--teal)"></i><i style="background:var(--pink)"></i><i style="background:var(--orange)"></i></div>'
const href = s => `play.html?s=${encodeURIComponent(s.id)}`
const card = s => `
    <a class="card" href="${href(s)}">
      <div class="thumb"><img src="thumbs/${esc(s.id)}.jpg" alt="" loading="lazy">${s.mix ? `<span class="num">${String(s.mix).padStart(2, '0')}</span>` : ''}</div>
      <div class="body"><h3>${esc(s.title)}</h3><p>${esc(s.what)}</p>${s.by ? `<p class="by">scene by ${esc(s.by)}</p>` : ''}
        <span class="file">scene/${esc(s.file)}${s.query ? '?' + esc(s.query) : ''}</span></div>
    </a>`

const indexHtml = page('DEVSA FM: the scenes', `
<header>
  <img class="mark" src="mark.svg" alt="DEVSA FM">
  <div>
    <h1>A night in San Antonio, in ASCII.</h1>
    <p class="lede">DEVSA FM is DEVSA's lofi livestream for San Antonio's learners and builders. Every scene below is one HTML
      file drawing on a canvas, running live in your browser. Open one, then open the starter and make your own.</p>
    <div class="actions">
      <a class="btn primary" href="${REPO}/blob/main/CONTRIBUTING.md">Build a scene</a>
      <a class="btn" href="${href(scenes.find(s => s.starter))}">Open the starter</a>
      <a class="btn" href="https://www.youtube.com/@devsatx">Watch on YouTube</a>
      <a class="btn" href="${REPO}">GitHub</a>
    </div>
  </div>
</header>
<main>
  <section>
    <div class="head"><span class="eyebrow">On air</span>${BARS}</div>
    <h2>The night mix, in order</h2>
    <div class="grid">${scenes.filter(s => s.mix).sort((a, b) => a.mix - b.mix).map(card).join('')}</div>
  </section>
  <section>
    <div class="head"><span class="eyebrow">More scenes</span></div>
    <h2>Not in the mix, worth a look</h2>
    <div class="grid">${scenes.filter(s => !s.mix).map(card).join('')}</div>
  </section>
  <p class="note">Some scenes draw the City of San Antonio's icons on stream. Those aren't published, so here the scenes run without them,
    the same as a fresh clone. The music isn't here either: on stream each scene is synced to its song.
    Code: MIT. DEVSA's marks and films: <a href="${REPO}/blob/main/ASSETS.md">for DEVSA FM scenes only</a>.</p>
</main>
<footer><span class="eyebrow">DEVSA FM · devsa.community</span>${BARS}</footer>`, `
  header { max-width: 1200px; margin: 0 auto; padding: 72px 24px 40px; display: flex; gap: 40px; align-items: flex-start }
  .mark { width: 120px; flex: none; margin-top: 6px }
  h1 { margin: 0; font-weight: 900; font-size: clamp(36px, 6vw, 64px); line-height: 1; letter-spacing: -.02em }
  .lede { max-width: 680px; margin: 20px 0 0; font-size: 19px; color: var(--muted) }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px }
  .btn { padding: 11px 18px; border-radius: 999px; border: 1px solid var(--line); text-decoration: none; font-weight: 500 }
  .btn:hover { border-color: #404040; background: var(--card) }
  .btn.primary { background: var(--text); color: var(--bg); border-color: var(--text) }
  main { max-width: 1200px; margin: 0 auto; padding: 0 24px }
  section { padding: 40px 0 }
  .head { display: flex; align-items: center; gap: 14px }
  h2 { margin: 12px 0 24px; font-weight: 900; font-size: 32px; letter-spacing: -.01em }
  .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) }
  .card { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 16px; overflow: hidden;
          background: var(--card); text-decoration: none; transition: border-color .15s, transform .15s }
  .card:hover { border-color: #525252; transform: translateY(-2px) }
  .thumb { position: relative; aspect-ratio: 16 / 9; background: #000 }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block }
  .num { position: absolute; left: 12px; top: 12px; padding: 4px 8px 3px; border-radius: 6px; background: rgba(12,12,12,.85);
         font: 700 13px/1 "Geist Mono", monospace; letter-spacing: .1em }
  .body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1 }
  h3 { margin: 0; font-size: 20px; font-weight: 900 }
  .body p { margin: 8px 0 14px; color: var(--muted); font-size: 15px; flex: 1 }
  .body p.by { flex: none; margin-top: -6px; color: var(--teal) }
  .file { font: 700 12px/1 "Geist Mono", monospace; color: var(--muted) }
  .note { max-width: 760px; color: var(--muted); font-size: 14px; padding: 8px 0 40px }
  footer { max-width: 1200px; margin: 0 auto; padding: 24px 24px 48px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line) }
  @media (max-width: 640px) { header { flex-direction: column; gap: 24px; padding-top: 40px } .mark { width: 88px } .grid { grid-template-columns: 1fr } }`)

const playHtml = page('DEVSA FM: a scene', `
<nav>
  <a class="back" href="./">← All scenes</a>
  <span id="title"></span>
  <span class="links"><a id="src" href="#">View source</a><a href="${REPO}/blob/main/CONTRIBUTING.md">Build one</a></span>
</nav>
<div id="stage"><iframe id="scene" title="scene" width="1920" height="1080" scrolling="no"></iframe></div>
<script>
  const SCENES = ${JSON.stringify(scenes.map(({ id, file, query, title }) => ({ id, file, query, title })))}
  const id = new URLSearchParams(location.search).get('s')
  const s = SCENES.find(x => x.id === id) || SCENES[0]
  document.title = 'DEVSA FM: ' + s.title
  document.getElementById('title').textContent = s.title
  document.getElementById('src').href = '${REPO}/blob/main/scene/' + s.file
  const f = document.getElementById('scene'); f.src = 'scene/' + s.file + (s.query ? '?' + s.query : '')
  const stage = document.getElementById('stage')
  function fit() {
    const k = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1080)
    f.style.transform = 'translate(-50%, -50%) scale(' + k + ')'
  }
  addEventListener('resize', fit); fit()
</script>`, `
  html, body { height: 100%; overflow: hidden }
  body { display: flex; flex-direction: column }
  nav { display: flex; align-items: center; gap: 20px; padding: 12px 20px; border-bottom: 1px solid var(--line); font-size: 15px }
  nav a { text-decoration: none; color: var(--muted) } nav a:hover { color: var(--text) }
  #title { font-weight: 900; flex: 1 }
  .links { display: flex; gap: 18px }
  #stage { position: relative; flex: 1; background: #000 }
  iframe { position: absolute; left: 50%; top: 50%; border: 0; transform-origin: center; background: #0c0c0c }
  @media (max-width: 560px) { .links a:last-child { display: none } }`)

;(async () => {
  for (const s of scenes) {
    // a fresh browser per scene: after a dozen heavy scenes in one, later screenshots came out black
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'] })
    const pg = await browser.newPage(); await pg.setViewport({ width: 1920, height: 1080 })
    await pg.goto('file://' + path.join(OUT, 'scene', s.file) + `?still&t=${s.t}${s.query ? '&' + s.query : ''}`, { waitUntil: 'load', timeout: 60000 })
    await pg.evaluate(() => Promise.race([window.ready, new Promise(r => setTimeout(r, 30000))]))
    await pg.evaluate(t => window.render(t), s.t); await new Promise(r => setTimeout(r, 200))
    await pg.screenshot({ path: path.join(OUT, 'thumbs', s.id + '.jpg'), type: 'jpeg', quality: 82,
      clip: { x: 0, y: 0, width: 1920, height: 1080, scale: .4 } })
    await browser.close(); console.log('thumb', s.id)
  }
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml)
  fs.writeFileSync(path.join(OUT, 'play.html'), playHtml)
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '')
  console.log('wrote', path.relative(ROOT, OUT))
})()
