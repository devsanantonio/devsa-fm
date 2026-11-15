// renders github-social.html to .github/media/social-preview.png at GitHub's 1280x640
const path = require('path')
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'))
;(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 640 })
  await pg.goto('file://' + path.join(__dirname, 'github-social.html'), { waitUntil: 'load' })
  await pg.evaluate(() => document.fonts.ready)
  const out = path.join(__dirname, '..', '.github', 'media', 'social-preview.png')
  await pg.screenshot({ path: out }); console.log(out)
  await b.close()
})()
