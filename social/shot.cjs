// renders post.html to the Instagram size: node shot.cjs
const path = require('path')
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'))
;(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); await pg.setViewport({ width: 1080, height: 1350 })
  await pg.goto('file://' + path.join(__dirname, 'post.html'), { waitUntil: 'load' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.screenshot({ path: path.join(__dirname, 'devsa-fm-instagram-1080x1350.png') })
  for (let n = 1; n <= 7; n++) {   // the carousel after the cover
    await pg.goto('file://' + path.join(__dirname, 'slide.html') + '?n=' + n, { waitUntil: 'load' })
    await pg.evaluate(() => document.fonts.ready)
    await pg.screenshot({ path: path.join(__dirname, `devsa-fm-carousel-${String(n + 1).padStart(2, '0')}.png`) })
  }
  await b.close()
})()
