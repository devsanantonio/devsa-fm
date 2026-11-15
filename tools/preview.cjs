// Serves the scenes on http://localhost:8210 so you can open one in a browser and watch it loop.
//   npm run preview            then open http://localhost:8210/starter.html (or any scene)
// Scenes load fonts and images with fetch, which browsers block on file:// pages, so open them here.
// Add ?still&t=12 to a scene's URL to freeze it at second 12.
const http = require('http'), fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..', 'scene'), PORT = +process.env.PORT || 8210
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' }

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (url === '/') {                                       // an index of the scenes
    const scenes = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort()
    res.writeHead(200, { 'content-type': 'text/html' })
    return res.end(`<!doctype html><meta charset="utf-8"><title>DEVSA FM scenes</title><body style="background:#0c0c0c;color:#eee;font:16px ui-monospace,monospace;padding:32px">
      <h1>DEVSA FM scenes</h1><ul>${scenes.map(s => `<li><a style="color:#00b2a9" href="/${s}">${s}</a></li>`).join('')}</ul></body>`)
  }
  const file = path.join(ROOT, path.normalize(url))
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found') }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`DEVSA FM scenes on http://localhost:${PORT}  (Ctrl+C to stop)`))
