// Saves a scene as a shareable clip: an MP4 (30 s, 1920x1080, 30 fps, with one of the scene's tracks,
// faded out) and a GIF (8 s, 960 wide, 15 fps). This week's events come from devsa.community, as on stream.
//   node tools/clip.cjs <scene> [out dir] [track.mp3]     e.g. node tools/clip.cjs grocery   (saves to social/clips/)
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, execFileSync } = require('child_process')
let puppeteer
try { puppeteer = require('puppeteer-core') } catch { puppeteer = require(process.env.PUPPETEER_CORE) }
const ROOT = path.join(__dirname, '..')
const [name, outArg, track] = process.argv.slice(2)
const outDir = outArg || path.join(ROOT, 'social', 'clips')   // "" means the default
const FPS = 30, SECONDS = +process.env.SECONDS || 30, GIF_S = 8
const LOOP = +process.env.LOOP_SECONDS || 60          // the scene's loop length, as on stream (cathedral: 180)
if (!name) { console.error('usage: node tools/clip.cjs <scene> [out dir] [track.mp3]'); process.exit(1) }

async function thisWeek() {
  try {
    const { events = [] } = await (await fetch('https://www.devsa.community/api/events', { signal: AbortSignal.timeout(15000) })).json()
    const now = new Date(), end = new Date(now.getTime() + 7 * 864e5), tz = { timeZone: 'America/Chicago' }
    return events.filter(e => e.status === 'published' && !e.unlisted && e.date).map(e => ({ ...e, when: new Date(e.date) }))
      .filter(e => new Date(e.endTime || e.when.getTime() + 2 * 36e5) >= now && e.when <= end).sort((a, b) => a.when - b.when).slice(0, 4)
      .map(e => ({ day: e.when.toLocaleDateString('en-US', { ...tz, weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase().replace(',', ''), title: e.title }))
  } catch { return [] }
}

;(async () => {
  fs.mkdirSync(outDir, { recursive: true })
  const credits = fs.readFileSync(path.join(ROOT, 'music-tejano', 'credits.txt'), 'utf8').split('\n').filter(Boolean)
  const song = track || path.join(ROOT, 'music-tejano', 'Tejano Lofi.mp3')
  const credit = credits.find(c => c.includes(path.basename(song, '.mp3'))) || credits[0]
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] })
  const pg = await b.newPage(); await pg.setViewport({ width: 1920, height: 1080 })
  const events = await thisWeek()
  // a synced scene gets the song's beat grid and its length as the loop, as on stream (the tracks with a grid in GRIDS)
  const GRIDS = { 'Tejano Lofi': 'beats-tejano.json', 'Agentic Cumbia': 'beats-cumbia.json', 'Smooth Tech-jano': 'beats-techjano.json' }
  const grid = GRIDS[path.basename(song, '.mp3')], beatsFile = grid && path.join(ROOT, 'scene', grid)
  const beats = beatsFile && fs.existsSync(beatsFile) ? JSON.parse(fs.readFileSync(beatsFile, 'utf8')) : null
  await pg.evaluateOnNewDocument((ev, cr, loop, b) => { window.EVENTS = ev; window.CREDITS = cr; window.LOOP_T = b ? b.duration : loop; window.BEATS = b }, events, [credit], LOOP, beats)
  await pg.goto('file://' + path.join(ROOT, 'scene', name + '.html') + '?still', { waitUntil: 'load' })
  await pg.evaluate(() => window.ready)
  const frame = async t => Buffer.from(await pg.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png').split(',')[1] }, t), 'base64')

  const silent = path.join(os.tmpdir(), `clip-${name}.mp4`)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let i = 0; i < FPS * SECONDS; i++) { const buf = await frame(i / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)) }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close()

  const mp4 = path.join(outDir, `devsa-fm-${name}-${SECONDS}s.mp4`), gif = path.join(outDir, `devsa-fm-${name}.gif`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', song, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-af', `afade=t=in:d=1,afade=t=out:st=${SECONDS - 2.5}:d=2.5`, '-t', String(SECONDS), '-movflags', '+faststart', mp4])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-t', String(GIF_S), '-i', silent, '-filter_complex',
    `fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', gif])
  fs.rmSync(silent)
  console.log(`${name}: ${mp4} · ${gif} · events ${events.length} · ${path.basename(song)}`)
})()
