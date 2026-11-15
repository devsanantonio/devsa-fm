// Renders DEVSA FM's picture: out/loop-<scene>.mp4, a seamless 60-second loop, with this week's
// events read fresh from devsa.community. Run it once a day, before the stream.
//
//   node render.cjs            full loop (60 s at 30 fps)
//   node render.cjs --still    one frame, out/still.png, to check the layout
//
// A scene can be synced to one track instead (SYNC=beats-<name>.json, made by tools/beats.py,
// and SYNC_AUDIO=<the track>): the loop is then the song's full length, the scene gets the
// beat grid and loudness as window.BEATS, and the song is muxed into the loop, so picture
// and music can never drift apart.
//
// Needs Chrome (CHROME=/path/to/chrome, defaults to the macOS app) and ffmpeg.
// The video is encoded ready to stream: H.264, 30 fps, a keyframe every 2 s, so the
// stream can copy it without re-encoding and the machine stays nearly idle.
const fs = require('fs'), path = require('path'), { spawn } = require('child_process')
let puppeteer
try { puppeteer = require('puppeteer-core') } catch { puppeteer = require(process.env.PUPPETEER_CORE) }

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = path.join(__dirname, 'out')
const FPS = 30
const still = process.argv.includes('--still')
const SCENE = process.env.SCENE || 'riverwalk.html'
const NAME = process.env.SCENE_NAME || SCENE.replace(/\.html$/, '')
const QUERY = process.env.SCENE_QUERY ? '&' + process.env.SCENE_QUERY : ''   // e.g. night, for commute.html
const LOOP = `loop-${NAME}.mp4`   // one file per scene, so a scene never streams another's picture
const BEATS = process.env.SYNC ? JSON.parse(fs.readFileSync(path.join(__dirname, 'scene', process.env.SYNC), 'utf8')) : null
// LOOP_SECONDS: a scene that needs a longer loop than 60 s (the cathedral's roll call of every group and partner)
const FRAMES = Math.round((BEATS ? BEATS.duration : (+process.env.LOOP_SECONDS || 60)) * FPS)
const T = FRAMES / FPS
const PICTURE = `picture-${NAME}.mp4`   // each scene its own: two synced renders can run at once

// The next seven days of public events, in San Antonio time.
async function thisWeek() {
  try {
    const res = await fetch('https://www.devsa.community/api/events', { signal: AbortSignal.timeout(15000) })
    const { events = [] } = await res.json()
    const now = new Date(), end = new Date(now.getTime() + 7 * 864e5)
    const tz = { timeZone: 'America/Chicago' }
    return events
      .filter(e => e.status === 'published' && !e.unlisted && e.date)
      .map(e => ({ ...e, when: new Date(e.date) }))
      .filter(e => new Date(e.endTime || e.when.getTime() + 2 * 36e5) >= now && e.when <= end)
      .sort((a, b) => a.when - b.when)
      .slice(0, 4)
      .map(e => ({
        day: e.when.toLocaleDateString('en-US', { ...tz, weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase().replace(',', '')
          + ' · ' + e.when.toLocaleTimeString('en-US', { ...tz, hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '\u2009'),
        title: e.title,
        who: e.communityName || (e.partnerNames || []).join(', '),
        where: (e.venue || e.location || '').split(',')[0],
      }))
  } catch (err) {
    console.error('events: could not read devsa.community, using none:', err.message)
    return []
  }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const events = await thisWeek()
  console.log(`events this week: ${events.length}`)
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'] })
  try {
    const pg = await b.newPage(); await pg.setViewport({ width: 1920, height: 1080 })
    // music credits, one line per track: CC BY tracks must be credited on the stream
    const credFile = path.join(__dirname, process.env.MUSIC_DIR || 'music', 'credits.txt')
    let credits = fs.existsSync(credFile) ? fs.readFileSync(credFile, 'utf8').split('\n').map(l => l.trim()).filter(Boolean) : []
    // a synced scene plays one song, so it credits that one only
    if (process.env.SYNC_AUDIO) { const one = credits.filter(c => c.includes(path.basename(process.env.SYNC_AUDIO, path.extname(process.env.SYNC_AUDIO)))); if (one.length) credits = one }
    await pg.evaluateOnNewDocument((ev, cr, b, t) => { window.EVENTS = ev; window.CREDITS = cr; window.BEATS = b; window.LOOP_T = t }, events, credits, BEATS, T)
    await pg.goto('file://' + path.join(__dirname, 'scene', SCENE) + '?still' + QUERY, { waitUntil: 'load' })
    await pg.evaluate(() => window.ready)
    if (still) {
      await pg.evaluate(() => render(8)); await pg.screenshot({ path: path.join(OUT, 'still.png') })
      return console.log('wrote out/still.png')
    }
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-tune', 'animation', '-pix_fmt', 'yuv420p',
      '-b:v', '4500k', '-maxrate', '4500k', '-bufsize', '9000k', '-g', String(FPS * 2), '-keyint_min', String(FPS * 2), '-sc_threshold', '0',
      '-movflags', '+faststart', path.join(OUT, BEATS ? PICTURE : LOOP)], { stdio: ['pipe', 'inherit', 'inherit'] })
    for (let i = 0; i < FRAMES; i++) {
      await pg.evaluate(t => render(t), i / FPS)
      ff.stdin.write(await pg.screenshot({ type: 'jpeg', quality: 95 }))
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r))
    if (BEATS) {   // the song goes into the loop itself
      await new Promise((ok, no) => spawn('ffmpeg', ['-y', '-v', 'error', '-i', path.join(OUT, PICTURE), '-i', path.join(__dirname, process.env.SYNC_AUDIO),
        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-ac', '2', '-shortest', '-movflags', '+faststart',
        path.join(OUT, LOOP)], { stdio: 'inherit' }).on('close', c => c ? no(new Error('mux failed')) : ok()))
      fs.unlinkSync(path.join(OUT, PICTURE))
    }
    console.log(`wrote out/${LOOP}` + (BEATS ? ` (${T.toFixed(1)} s, synced to ${process.env.SYNC_AUDIO})` : ''))
  } finally { await b.close() }
})()
