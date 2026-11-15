// Saves a scene as a PNG at the times you name, for checking your work and for pull requests.
//   npm run still -- starter 4 12 30         -> out/stills/starter-t4.png, -t12.png, -t30.png
//   SYNC=beats-tejano.json npm run still -- cathedral 50    (a synced scene, on that song's beat grid)
// Needs Chrome: set CHROME=/path/to/chrome if it isn't the macOS app.
const fs = require('fs'), path = require('path')
let puppeteer
try { puppeteer = require('puppeteer-core') } catch { puppeteer = require(process.env.PUPPETEER_CORE) }
const ROOT = path.join(__dirname, '..')
const [name, ...times] = process.argv.slice(2)
if (!name) { console.error('usage: npm run still -- <scene> [seconds...]'); process.exit(1) }

;(async () => {
  const out = path.join(ROOT, 'out', 'stills'); fs.mkdirSync(out, { recursive: true })
  const beats = process.env.SYNC ? JSON.parse(fs.readFileSync(path.join(ROOT, 'scene', process.env.SYNC), 'utf8')) : null
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); await pg.setViewport({ width: 1920, height: 1080 })
  pg.on('pageerror', e => console.error('scene error:', e.message))
  await pg.evaluateOnNewDocument((b, t) => { window.BEATS = b; window.LOOP_T = t }, beats, beats ? beats.duration : 60)
  await pg.goto('file://' + path.join(ROOT, 'scene', name.replace(/\.html$/, '') + '.html') + '?still', { waitUntil: 'load' })
  const ready = await pg.evaluate(() => Promise.race([window.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 20000))]))
  if (!ready) { console.error('the scene never set window.ready: check the browser console with npm run preview'); await b.close(); process.exit(1) }
  for (const t of times.length ? times : ['8']) {
    await pg.evaluate(t => window.render(t), +t); await new Promise(r => setTimeout(r, 150))
    const file = path.join(out, `${name}-t${t}.png`); await pg.screenshot({ path: file }); console.log(file)
  }
  await b.close()
})()
