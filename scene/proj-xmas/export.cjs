// node export.cjs -> ../proj/xmas-<name>/001..060.jpg (the cathedral's film frames) and
//                    ~/Downloads/devsa-cathedral-projections/<name>.gif (to preview or share)
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process')
const p = require(path.join(__dirname, '../../node_modules/puppeteer-core'))
;(async () => {
  const b = await p.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); pg.on('pageerror', e => console.error('error:', e.message)); await pg.setViewport({ width: 800, height: 682 })
  await pg.goto('file://' + path.join(__dirname, 'films.html'), { waitUntil: 'load' }); await pg.evaluate(() => window.ready)
  const names = await pg.evaluate(() => window.FILMS), GIFS = path.join(process.env.HOME, 'Downloads/devsa-cathedral-projections')
  fs.mkdirSync(GIFS, { recursive: true })
  for (const n of names) {
    const dir = path.join(__dirname, '../proj', 'xmas-' + n); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
    for (let f = 0; f < 60; f++) {
      const d = await pg.evaluate((n, f) => { draw(n, f); return document.getElementById('c').toDataURL('image/jpeg', .92) }, n, f)
      fs.writeFileSync(path.join(dir, String(f + 1).padStart(3, '0') + '.jpg'), Buffer.from(d.split(',')[1], 'base64'))
    }
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '15', '-i', path.join(dir, '%03d.jpg'), '-vf', 'split[a][b];[a]palettegen=max_colors=64[pp];[b][pp]paletteuse=dither=none', '-loop', '0', path.join(GIFS, n + '.gif')])
    console.log(n)
  }
  await b.close()
})()
