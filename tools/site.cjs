// Builds the published copy of the scenes: every scene, its thumbnail, and the list of them. GitHub Pages
// publishes it (.github/workflows/pages.yml): the README's stills open the scenes from there, live.
// It copies scene/ (without the City's icons and the logos, which aren't public), takes a thumbnail of each
// scene in tools/scenes.json, and writes scenes.json. index.html and play.html forward to devsa.community/fm,
// which says what DEVSA FM is and where to watch it. To look at the files locally: node tools/site.cjs && npx serve _site
// Needs Chrome: set CHROME=/path/to/chrome if it isn't the macOS app.
const fs = require('fs'), path = require('path')
let puppeteer
try { puppeteer = require('puppeteer-core') } catch { puppeteer = require(process.env.PUPPETEER_CORE) }
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, '_site')
const { scenes } = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenes.json'), 'utf8'))
const PRIVATE = new Set(['icons', path.join('proj', 'groups'), path.join('proj', 'partners')])

fs.rmSync(OUT, { recursive: true, force: true })
fs.cpSync(path.join(ROOT, 'scene'), path.join(OUT, 'scene'), {
  recursive: true, filter: src => !PRIVATE.has(path.relative(path.join(ROOT, 'scene'), src)) })
fs.mkdirSync(path.join(OUT, 'thumbs'))

const SITE = 'https://www.devsa.community/fm'
// A page that sends people to devsa.community/fm (the old playground's links land there).
const forward = (to, scene = false) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>DEVSA FM</title>
<link rel="canonical" href="${to}"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${to}">
<script>${scene ? `var s = new URLSearchParams(location.search).get('s'); location.replace('${to}' + (s ? '?scene=' + encodeURIComponent(s) : ''))` : `location.replace('${to}')`}</script>
</head><body style="background:#0c0c0c;color:#eee;font:16px system-ui;padding:32px">DEVSA FM lives at <a style="color:#00b2a9" href="${to}">${to.replace('https://', '')}</a>.</body></html>
`

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
  fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify({ scenes }, null, 2))
  fs.writeFileSync(path.join(OUT, 'index.html'), forward(SITE))
  fs.writeFileSync(path.join(OUT, 'play.html'), forward(SITE))
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '')
  console.log('wrote', path.relative(ROOT, OUT))
})()
