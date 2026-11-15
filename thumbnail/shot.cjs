// renders thumb.html's two layouts to PNGs at YouTube's 1280x720
const path = require('path')
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'))
;(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 720 })
  for (const v of ['a', 'b', 'c', 'd']) {
    await pg.goto('file://' + path.join(__dirname, 'thumb.html') + '?' + v, { waitUntil: 'load' })
    await pg.evaluate(() => document.fonts.ready)
    await pg.screenshot({ path: path.join(__dirname, `${{ a: 'devsa-fm-thumbnail-a', b: 'devsa-fm-thumbnail-b', c: 'devsa-fm-thumbnail-radio', d: 'devsa-fm-thumbnail-radio-mosaic' }[v]}.png`) })
  }
  await b.close()
})()
