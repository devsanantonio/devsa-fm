// Checks scenes against the scene contract in CONTRIBUTING.md, the way a pull request is checked:
//   npm run check -- paseo starter      (or no names: every scene)
//
// For each scene it:
//   - loads it with nothing but what's in the repo, and fails on a script error or a scene that never gets ready
//     (so it proves the scene runs without the City's icons and the logos, which aren't in the repo);
//   - renders the same second twice, with other frames between, and fails if they differ (determinism);
//   - renders t = 0 and t = fm.T and fails if they differ (the loop's seam);
//   - saves three stills to out/check/ for the pull request.
// Needs Chrome: set CHROME=/path/to/chrome if it isn't the macOS app.
const fs = require('fs'), path = require('path')
let puppeteer
try { puppeteer = require('puppeteer-core') } catch { puppeteer = require(process.env.PUPPETEER_CORE) }
const ROOT = path.join(__dirname, '..'), SCENES = path.join(ROOT, 'scene')
const OUT = path.join(ROOT, 'out', 'check')
const OPTIONAL = /\/scene\/(icons|proj\/groups|proj\/partners)\//      // not in the repo, skipped by design

let names = process.argv.slice(2).map(n => path.basename(n).replace(/\.html$/, ''))
if (!names.length) names = fs.readdirSync(SCENES).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''))

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  // SYNC=beats-cumbia.json: check on a song's beat grid, the way a synced scene runs on stream
  const beats = process.env.SYNC ? JSON.parse(fs.readFileSync(path.join(SCENES, process.env.SYNC), 'utf8')) : null
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'],
  })
  const report = []
  for (const name of names) {
    const file = path.join(SCENES, name + '.html')
    const r = { name, problems: [], notes: [], stills: [] }; report.push(r)
    if (!fs.existsSync(file)) { r.problems.push('no such scene: scene/' + name + '.html'); continue }
    const pg = await browser.newPage(); await pg.setViewport({ width: 1920, height: 1080 })
    if (beats) await pg.evaluateOnNewDocument((b, t) => { window.BEATS = b; window.LOOP_T = t }, beats, beats.duration)
    const missing = new Set()
    pg.on('pageerror', e => r.problems.push('script error: ' + e.message.split('\n')[0]))
    pg.on('requestfailed', q => { const u = q.url(); if (!OPTIONAL.test(u)) missing.add(u.replace('file://' + ROOT + '/', '')) })
    try {
      await pg.goto('file://' + file + '?still', { waitUntil: 'load', timeout: 60000 })
      const ready = await pg.evaluate(() => Promise.race([
        (window.ready || Promise.reject(new Error('no window.ready'))).then(() => true),
        new Promise(res => setTimeout(() => res(false), 30000))]))
      if (!ready) { r.problems.push('never became ready (window.ready did not resolve in 30 s)'); continue }
      const res = await pg.evaluate(() => {
        const c = document.querySelector('canvas'), x = c.getContext('2d', { willReadFrequently: true })
        // the loop's length: fmkit's fm.T, or an older scene's own global T (they don't use fmkit yet)
        const LEN = (window.fm && fm.T) || (typeof T === 'number' ? T : 0) || window.LOOP_T || 60
        const at = t => { window.render(t); return x.getImageData(0, 0, c.width, c.height).data }
        const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
          if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++
          return n / (a.length / 4) }
        // Chrome moves a canvas from the GPU to software after the first read-back, which shifts anti-aliasing
        // a hair, so draw and read a few frames first: otherwise the first frames always look different.
        for (const w of [3, 41, 17]) at(w)
        const probe = +(LEN * .37).toFixed(3)
        const a = at(probe); at(LEN * .81); at(1.5); const b = at(probe)
        const s0 = at(0), s1 = at(LEN)
        return { T: LEN, determinism: diff(a, b), seam: diff(s0, s1), probe }
      })
      r.T = res.T
      // a hair of tolerance: canvas text and blur can land a pixel differently between two draws
      if (res.determinism > .001) r.problems.push(`not deterministic: second ${res.probe} drew differently the second time (${(res.determinism * 100).toFixed(2)}% of pixels). Use hash() or a seeded generator, not Math.random() or the clock, and don't carry state between frames.`)
      if (res.seam > .002) r.problems.push(`the loop has a seam: t = 0 and t = ${res.T} differ (${(res.seam * 100).toFixed(2)}% of pixels). Everything periodic should finish a whole number of cycles in fm.T.`)
      for (const k of [.1, .45, .8]) {
        const t = +(res.T * k).toFixed(2)
        await pg.evaluate(t => window.render(t), t); await new Promise(z => setTimeout(z, 100))
        const png = path.join(OUT, `${name}-t${t}.png`); await pg.screenshot({ path: png }); r.stills.push(path.relative(ROOT, png))
      }
      for (const m of missing) r.notes.push('could not load ' + m)
    } catch (e) {
      r.problems.push('failed to run: ' + e.message.split('\n')[0])
    } finally { await pg.close() }
  }
  await browser.close()

  // A summary in Markdown: printed, and written for the pull request check to post.
  const lines = ['| Scene | Loop | Result |', '|---|---|---|']
  for (const r of report) lines.push(`| \`${r.name}\` | ${r.T ? r.T.toFixed(1) + ' s' : ''} | ${r.problems.length ? '❌ ' + r.problems.join('<br>') : '✅ runs without the optional assets, deterministic, seamless'} |`)
  const notes = report.flatMap(r => r.notes.map(n => `- \`${r.name}\`: ${n}`))
  if (notes.length) lines.push('', 'Files a scene asked for that aren\'t in the repo (check these are optional):', ...notes)
  const md = lines.join('\n') + '\n'
  fs.writeFileSync(path.join(OUT, 'summary.md'), md)
  console.log(md)
  process.exit(report.some(r => r.problems.length) ? 1 : 0)
})()
