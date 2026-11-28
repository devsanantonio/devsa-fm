#!/usr/bin/env bash
# DEVSA FM: one daily session. Renders the picture, lines up the music, and streams to
# YouTube for DURATION seconds, then stops on its own.
#
#   ./stream.sh [scene]          the real thing (needs config.env with YT_STREAM_KEY)
#   ./stream.sh [scene] --test   30 seconds to out/test.mp4 instead of YouTube
#
# Scenes, each with its own picture and music:
#   riverwalk (default)  night on the River Walk                music-tejano/ (synced)
#   commute              a day on the road                      music-tejano/
#   commute-night        the same road after dark               music-tejano/
#   rand                 a night concert at the Rand Building   music-tejano/ (synced to Tejano Lofi)
#   market               Market Square at Fiesta                music-tejano/
#   taco                 midnight at the Alamo Python truck     music-tejano/ (synced: one feature shipped per song)
#   court                a night game between two bots, intros to final  music-tejano/ (synced: one game per song)
#   fish                 glowing sunfish under the bridge, Museum Reach  music-tejano/
#   dome                 a flying roadster on the street at the Alamodome  music-tejano/ (synced: lights on the beat)
#   grocery              dusk at the grocery, agents crossing with baskets  music-tejano/
#   paseo                lotería at Market Square, under the papel picado  music-tejano/ (synced to Agentic Cumbia)
#   cathedral            San Fernando at night, a DEVSA projection show  music-tejano/
#   room                 the ASCII room                         music-tejano/ (DURATION=n for longer; runs faster than real time)
#
#   xmas                 the Christmas FM edition (from the day after Thanksgiving): popping into downtown spaces: the
#                        DEVSA tree, the bus ride, the gift station at Market Square, movie night at Mission Marquee Plaza, the Express passing the Alamodome,
#                        the band at the Arneson River Theatre, San Fernando's show, the Rand Building on Houston Street, the taco truck, the New Year finale. Each synced to a track in music-xmas/ (ElevenLabs, see LICENSES.txt).
#   mix                  the show: commute-night, fish, court, taco, rand, paseo, cathedral, riverwalk. Each
#                        scene is synced to one song (the table in scene_env) and changes when the
#                        song ends, so a cut always lands on a song change.
#
# The video is copied, not re-encoded (render.cjs made it stream-ready), so a small
# machine can run this.
set -euo pipefail
# On a Mac, keep it awake for the whole session: macOS idle sleep pauses ffmpeg, and YouTube drops a
# stream that goes quiet (the first night mix died 19 minutes in, at the Mac's 1-minute sleep timer).
# caffeinate -i blocks idle sleep only; the display can still turn off. Closing a laptop's lid still sleeps it.
if [ "$(uname)" = Darwin ] && [ -z "${DEVSA_FM_AWAKE:-}" ] && command -v caffeinate >/dev/null; then
  DEVSA_FM_AWAKE=1 exec caffeinate -i "$0" "$@"
fi
cd "$(dirname "$0")"
shopt -s nullglob nocaseglob

_DUR="${DURATION:-}"                       # DURATION or MUSIC_DIR given on the command line win over config.env
_MUSIC="${MUSIC_DIR:-}"
[ -f config.env ] && source config.env
DURATION="${_DUR:-${DURATION:-9000}}"     # 2.5 hours
MIX_ORDER=(commute-night fish court taco rand paseo cathedral riverwalk)
XMAS_ORDER=(xmas-tree commute-xmas paseo-xmas xmas-marquee dome-xmas xmas-arneson cathedral-xmas rand-xmas taco-xmas xmas-finale)   # opens and closes on the two DEVSA TV desk graphics (ep1 tree, ep2 fireworks)
                                                                                           # the plaza, the truck, then fireworks   # an evening: calm, calm, the game, a breather, the concert,
                                                                            # then the walk downtown: Market Square, San Fernando, the river

TEST=0; SCENE_NAME=riverwalk
for arg in "$@"; do
  case "$arg" in
    --test) TEST=1 ;;
    riverwalk|commute|commute-night|rand|market|taco|court|fish|dome|grocery|paseo|cathedral|room|mix|xmas) SCENE_NAME="$arg" ;;
    *) echo "Unknown argument: $arg (scenes: riverwalk, commute, commute-night, rand, market, taco, court, fish, dome, grocery, paseo, cathedral, room, mix, xmas)" >&2; exit 1 ;;
  esac
done

# what a scene needs: its page, its music, and whether it is synced to one song
scene_env() {
  local name="$1"
  case "$name" in
    *) SCENE_MUSIC=music-tejano ;;          # every scene plays Tejano Lofi; music/ holds other tracks, unused
  esac
  export SCENE_NAME="$name" SCENE="${name}.html" SCENE_QUERY=""
  # the night commute is commute.html with its night switch on: one bus, drawn once
  if [ "$name" = commute-night ]; then SCENE=commute.html; SCENE_QUERY=night; fi
  # Every scene in the night is synced to one song: its loop is that song's full length with the song
  # inside it, and it moves on that song's beat grid (tools/beats.py). The songs are dealt so no two
  # scenes in a row share one, round the loop too (riverwalk hands back to commute-night).
  SYNC=""; SYNC_AUDIO=""
  local song=""
  case "$name" in
    commute-night|taco|cathedral) song=techjano ;;
    fish|rand|riverwalk|dome)     song=tejano ;;
    court|paseo)                  song=cumbia ;;
  esac
  case "$song" in
    tejano)   SYNC=beats-tejano.json;   SYNC_AUDIO="music-tejano/Tejano Lofi.mp3" ;;
    cumbia)   SYNC=beats-cumbia.json;   SYNC_AUDIO="music-tejano/Agentic Cumbia.mp3" ;;
    techjano) SYNC=beats-techjano.json; SYNC_AUDIO="music-tejano/Smooth Tech-jano.mp3" ;;
  esac
  export SYNC SYNC_AUDIO
  # a synced scene runs its song's length; LOOP_SECONDS only matters for one that isn't
  LOOP_SECONDS=60
  export LOOP_SECONDS
  export MUSIC_DIR="${_MUSIC:-$SCENE_MUSIC}"
  # the Christmas edition: its own pages, the ?xmas switch on the year-round ones, and music-xmas/
  local xsong=""
  case "$name" in
    commute-xmas)   SCENE=commute.html;   SCENE_QUERY=xmas; xsong=tamal ;;
    xmas-tree)      SCENE=xmas-tree.html;    xsong=tree ;;
    xmas-marquee)   SCENE=xmas-marquee.html; xsong=tree ;;   # movie night at Mission Marquee Plaza; devsa.community's hero photos on its screen
    riverwalk-xmas) SCENE=riverwalk.html; SCENE_QUERY=xmas; xsong=nocturne ;;
    cathedral-xmas) SCENE=cathedral.html; SCENE_QUERY=xmas; xsong=mistletoe ;;
    paseo-xmas)     SCENE=paseo.html;     SCENE_QUERY=xmas; xsong=mistletoe ;;   # the gift station at Market Square: wrap, check, ship; Santa comes for the sleigh
    rand-xmas)      SCENE=rand.html;      SCENE_QUERY=xmas; xsong=cartridge ;;   # the Rand Building on Houston Street, its windows in a holiday show, the third floor lit for a meetup
    xmas-arneson)   SCENE=xmas-arneson.html; xsong=nocturne ;;   # the band at the Arneson River Theatre, La Villita
    dome-xmas)      SCENE=dome.html;      SCENE_QUERY=xmas; xsong=cartridge ;;   # the Express passing the dome: the train's track, its bell on the beat
    taco-xmas)      SCENE=taco.html;      SCENE_QUERY=xmas; xsong=tamal ;;
    xmas-finale)    SCENE=xmas-finale.html;  xsong=spark ;;
  esac
  case "$xsong" in
    nocturne)  SYNC=beats-xmas-river-walk-nocturne.json;        SYNC_AUDIO="music-xmas/River Walk Nocturne.wav" ;;
    cartridge) SYNC=beats-xmas-christmas-cartridge-glow.json;   SYNC_AUDIO="music-xmas/Christmas Cartridge Glow.wav" ;;
    mistletoe) SYNC=beats-xmas-midnight-mistletoe-cumbia.json;  SYNC_AUDIO="music-xmas/Midnight Mistletoe Cumbia.wav" ;;
    tree)      SYNC=beats-xmas-by-the-tree-at-midnight.json;    SYNC_AUDIO="music-xmas/By the Tree at Midnight.wav" ;;
    spark)     SYNC=beats-xmas-midnight-spark.json;             SYNC_AUDIO="music-xmas/Midnight Spark.wav" ;;   # trimmed to 2:00
    tamal)     SYNC=beats-xmas-midnight-tamal-loop.json;        SYNC_AUDIO="music-xmas/Midnight Tamal Loop.wav" ;;   # trimmed to 2:00
  esac
  if [ -n "$xsong" ]; then export SCENE SCENE_QUERY SYNC SYNC_AUDIO; export MUSIC_DIR=music-xmas; fi
  LOOP="out/loop-${name}.mp4"
}

# every track in a folder, shuffled and joined into one file (looping one file is reliable,
# looping a concat list of tracks is not)
music_mix() {
  local dir="$1" out="$2"
  local tracks=("$dir"/*.mp3 "$dir"/*.wav "$dir"/*.m4a)
  if [ ${#tracks[@]} -eq 0 ]; then echo "No tracks in $dir. Add licensed tracks there." >&2; exit 1; fi
  : > out/playlist.txt
  while IFS= read -r t; do printf "file '%s'\n" "$(cd "$(dirname "$t")" && pwd)/$(basename "$t")" >> out/playlist.txt
  done < <(printf '%s\n' "${tracks[@]}" | awk 'BEGIN{srand()} {print rand() "\t" $0}' | sort -k1,1 | cut -f2-)
  ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i out/playlist.txt -vn -c:a aac -b:a 160k -ar 44100 -ac 2 "$out"
  echo "$dir: ${#tracks[@]} track(s)"
}

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# where it goes
RE=(-re)
if [ "$TEST" = 1 ]; then DURATION="${_DUR:-30}"; RE=(); DEST=(-f mp4 -movflags +faststart -y out/test.mp4)
else
  : "${YT_STREAM_KEY:?Set YT_STREAM_KEY in config.env (YouTube Studio > Go live > Stream key)}"
  DEST=(-f flv "rtmp://a.rtmp.youtube.com/live2/${YT_STREAM_KEY}")
fi
mkdir -p out

if [ "$SCENE_NAME" = mix ] || [ "$SCENE_NAME" = xmas ]; then
  [ "$SCENE_NAME" = xmas ] && MIX_ORDER=("${XMAS_ORDER[@]}")
  # 1. one segment per scene, as long as its music, with the music inside it. The scenes'
  # pictures don't change day to day, so a loop is rendered only when it's missing.
  : > out/mixlist.txt; round=0
  for name in "${MIX_ORDER[@]}"; do
    scene_env "$name"
    [ -f "$LOOP" ] || node render.cjs
    SEG="out/seg-${name}.mp4"
    if [ -n "$SYNC" ]; then cp "$LOOP" "$SEG"              # already picture and song in one file
    else
      music_mix "$MUSIC_DIR" "out/music-${name}.m4a"
      ffmpeg -hide_banner -loglevel error -y -stream_loop -1 -i "$LOOP" -i "out/music-${name}.m4a" \
        -map 0:v -map 1:a -c copy -t "$(dur "out/music-${name}.m4a")" -movflags +faststart "$SEG"
    fi
    echo "segment: $name, $(printf '%.0f' "$(dur "$SEG")") s"
    echo "file '$(pwd)/$SEG'" >> out/mixlist.txt
    round=$(awk -v a="$round" -v b="$(dur "$SEG")" 'BEGIN{print a+b}')
  done
  # 2. the rounds, enough to fill the session
  n=$(awk -v d="$DURATION" -v r="$round" 'BEGIN{print int(d/r)+2}')
  : > out/showlist.txt; for _ in $(seq 1 "$n"); do cat out/mixlist.txt >> out/showlist.txt; done
  echo "a round is $(printf '%.0f' "$round") s; live for ${DURATION}s"
  # 3. stream: picture and music come from the same files, so they can't drift apart
  ffmpeg -hide_banner -loglevel warning ${RE[@]+"${RE[@]}"} -f concat -safe 0 -i out/showlist.txt \
    -map 0:v -map 0:a -c copy \
    -t "$DURATION" "${DEST[@]}"
  echo "done"
  exit 0
fi

scene_env "$SCENE_NAME"
echo "scene: $SCENE_NAME · music: $MUSIC_DIR"

# 1. the picture
if [ "$TEST" = 0 ] || [ ! -f "$LOOP" ]; then node render.cjs; fi

# 2. the music, shuffled (a synced scene skips this: its music is already in the loop)
if [ -z "$SYNC" ]; then music_mix "$MUSIC_DIR" out/mix.m4a; fi

# 3. stream. Loop by playlist, not by -stream_loop: two looping inputs read in real time drift
# apart (the video fell minutes behind and YouTube reported "not receiving enough video"). The
# concat demuxer gives each input continuous timestamps instead.
V="$(pwd)/$LOOP"
nv=$(awk -v d="$DURATION" -v l="$(dur "$V")" 'BEGIN{print int(d/l)+2}')
: > out/vlist.txt; for _ in $(seq 1 "$nv"); do echo "file '$V'" >> out/vlist.txt; done

echo "live for ${DURATION}s"
if [ -n "$SYNC" ]; then   # picture and music in one file
  ffmpeg -hide_banner -loglevel warning ${RE[@]+"${RE[@]}"} -f concat -safe 0 -i out/vlist.txt \
    -map 0:v -map 0:a -c copy \
    -t "$DURATION" "${DEST[@]}"
else
  A="$(pwd)/out/mix.m4a"
  na=$(awk -v d="$DURATION" -v l="$(dur "$A")" 'BEGIN{print int(d/l)+2}')
  : > out/alist.txt; for _ in $(seq 1 "$na"); do echo "file '$A'" >> out/alist.txt; done
  ffmpeg -hide_banner -loglevel warning ${RE[@]+"${RE[@]}"} -f concat -safe 0 -i out/vlist.txt \
    ${RE[@]+"${RE[@]}"} -f concat -safe 0 -i out/alist.txt \
    -map 0:v -map 1:a -c copy \
    -t "$DURATION" "${DEST[@]}"
fi
echo "done"
