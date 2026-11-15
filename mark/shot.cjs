// renders the FM marks to PNG: node shot.cjs
const path = require('path'), fs = require('fs')
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'))
;(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' })
  const pg = await b.newPage()
  for (const [f, w, h, bg] of [['devsa-fm-mark', 1218, 1272, 'transparent'], ['devsa-fm-icon', 1000, 1000, 'transparent'], ['devsa-fm-mark-on-dark', 1600, 1100, '#161616'], ['devsa-fm-mark-on-light', 1600, 1100, '#f4f1ea']]) {
    const svg = fs.readFileSync(path.join(__dirname, f.startsWith('devsa-fm-mark') ? 'devsa-fm-mark.svg' : f + '.svg'), 'utf8')
    await pg.setViewport({ width: w, height: h })
    const pad = bg === 'transparent' ? 0 : 160
    await pg.setContent(`<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${w}px;height:${h}px">${svg.replace('<svg ', `<svg style="width:${w - 2 * pad}px;height:${h - 2 * pad}px" `)}</body></html>`)
    await pg.screenshot({ path: path.join(__dirname, f + '.png'), omitBackground: bg === 'transparent' })
  }
  await b.close()
})()
