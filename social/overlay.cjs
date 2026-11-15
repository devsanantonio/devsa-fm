// renders the slides with their scene areas clear, for videos.sh to composite over the moving scenes
const path = require('path')
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'))
;(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); await pg.setViewport({ width: 1080, height: 1350 })
  const shots = [['post.html?overlay', 'overlay-01.png'], ...[1, 2, 3, 4, 5, 6].map(n => [`slide.html?overlay&n=${n}`, `overlay-0${n + 1}.png`])]
  for (const [url, out] of shots) {
    await pg.goto('file://' + path.join(__dirname, url.split('?')[0]) + '?' + url.split('?')[1], { waitUntil: 'load' })
    await pg.evaluate(() => document.fonts.ready)
    await pg.screenshot({ path: path.join(__dirname, 'video', out), omitBackground: true })
  }
  await b.close()
})()
