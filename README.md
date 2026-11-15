# DEVSA FM

A daily 2.5-hour YouTube livestream on @devsatx: music for San Antonio's learners and
builders, over an ASCII room with the DEVSA mark as a pixel character nodding along.

## What's here

| | |
|---|---|
| `scene/riverwalk.html` | the default picture: the River Walk at night, the penguin and the PySA mascot on a GO RIO boat; music in `music/` |
| `scene/commute.html` | the road, by day (`commute`) or with `?night` (`commute-night`): a VIVA-style bus with the DEVSA TV stickers and passengers, Mission San José, the boots; at night streetlamps light the bus as it passes, the landmarks are floodlit and a car comes the other way; music in `music-tejano/` |
| `scene/rand.html` | a night concert at the Rand Building: the PySA mascot on a riser, the windows running a light show on the song's real beat and spelling >SA_, phones up in the quiet parts; synced to Tejano Lofi (its loop is the song, with the song inside it) |
| `scene/taco.html` | midnight at the Alamo Python taco truck: the penguin shipping something at a folding table; music in `music-tejano/` |
| `scene/market.html` | Market Square at Fiesta: papel picado, four stalls, the penguin in line for a concha (kept for April) |
| `tools/beats.py` | measures a track's tempo, first beat and loudness for a synced scene: `python3 tools/beats.py track.mp3 > scene/beats-<name>.json` |
| `scene/grocery.html` | dusk at a San Antonio grocery: the DEVSA mark on the stone tower, a red roof over a lit glass band; cars pass, and between them the agents cross the crosswalk carrying baskets |
| `scene/paseo.html` | lotería at Market Square: El Mercado's green arcade and the brick building, papel picado cut with the DEVSA mark, a caller and three players (two agents and the penguin on his laptop) under string lights, a conjunto duo under the lamp post; the deck is DEVSA's own cards and the City of San Antonio's icons; synced to Agentic Cumbia, three rounds a song, the winner rotating |
| `scene/cathedral.html` | San Fernando Cathedral at night, traced from a photograph, with a projection show mapped to the stone: sweeps, coursing and the rose window on the beat, the DEVSA mark, then the conference films (More Human Than Human, PySanAntonio, Access Granted, The Model) in an arch over the door; agents watch from folding chairs; synced to Smooth Tech-jano |
| `scene/fmkit.js` | shared by grocery, paseo and cathedral: the ASCII renderer, colour helpers, cars, the footer |
| `scene/room.html` | a second scene: an ASCII room; `SCENE=room.html ./stream.sh` to use it |
| `render.cjs` | records the picture as `out/loop.mp4`, a seamless 60-second loop, stream-ready |
| `stream.sh` | one session: render, shuffle the music, stream for `DURATION`, stop |
| `music/` | the tracks, and `credits.txt`, one line per track, shown on screen |
| `youtube-description.txt` | paste into the stream's description (the CC BY credit belongs there too) |

## One-time setup

1. **YouTube:** in YouTube Studio, Create → Go live. The first time, the channel must be
   verified and live streaming can take up to 24 hours to switch on. Then Stream →
   copy the **stream key**. Turn on **Auto-start** so the stream goes live as soon as the
   script connects. Paste `youtube-description.txt` into the description.
2. **Config:** `cp config.env.example config.env` and paste the stream key into it.
   The key lets anyone broadcast as the channel: keep `config.env` private.
3. **Install:** Chrome and ffmpeg, plus `npm install puppeteer-core` in this folder.
   On a server, set `CHROME=` to the Chrome binary.
4. **Test without going live:** `./stream.sh --test` writes 30 seconds to `out/test.mp4`.

## Every day

`./stream.sh` renders today's picture and streams for 2.5 hours. Pick a scene by name: `./stream.sh commute` (each scene has its own music folder; `riverwalk` is the default). Schedule it:

- **A Mac that stays on:** `launchd` (see `fm.devsa.stream.plist`; set the time, then
  `cp fm.devsa.stream.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/fm.devsa.stream.plist`).
  The Mac must be awake at that time.
- **A small Linux server:** `crontab -e`, then e.g. `0 18 * * * /path/to/devsa-fm/stream.sh >> /path/to/devsa-fm/out/stream.log 2>&1`
  (cron uses the server's time zone).

## Music

Only music licensed for YouTube streaming. Add a file to `music/`, add its credit line
to `music/credits.txt` (CC BY tracks require it), and to the stream description.
Currently in `music-tejano/`: "Tejano Lofi", "Agentic Cumbia" and "Smooth Tech-jano", by Patrick, made with Suno.

Streams over 12 hours aren't archived by YouTube; 2.5 hours is well inside that.

## The night mix

`./stream.sh mix` plays commute-night, fish, court, taco, rand, paseo, cathedral and riverwalk, each synced
to one song so no two scenes in a row share one (the table is in `scene_env` in `stream.sh`). A round
is about 24 minutes.

## What isn't in the repo

`.gitignore` keeps out the stream key (`config.env`), rendered video (`out/`, `social/clips/`), the music
files (each folder's `credits.txt` is tracked), and other organizations' marks: the City of San Antonio's
icons (`scene/icons/`, copy them from `~/Downloads/cosa-icons/SVG`) and the group, partner and model logos
under `scene/proj/`. A scene loads them if they're present and draws without them if not.
