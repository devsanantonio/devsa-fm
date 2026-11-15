#!/usr/bin/env bash
# The six scene slides as 30-second videos, 1080x1350, with the song: each slide's scene area plays
# the scene itself (cropped exactly as slide.html crops the still), the slide's text over it.
# Synced scenes take their audio from the same moment in their loop, so the beat still lines up.
#   node overlay.cjs && ./videos.sh
set -euo pipefail
cd "$(dirname "$0")"
OUT=../out SONG="../music-tejano/Tejano Lofi.mp3"
mkdir -p video
# slide  loop                 start  scale-w crop-x crop-y  audio (song start, or "loop" for the loop's own)
while read -r n loop start sw cx cy audio; do
  ch=$(awk -v w=$sw -v y=$cy 'BEGIN{h=int(w*1080/1920*990/1080)-y; if(h>910)h=910; print h - h%2}'); oy=$((910-ch))
  if [ "$audio" = loop ]; then
    ffmpeg -nostdin -v error -y -ss "$start" -t 30 -i "$OUT/$loop" -i "video/overlay-$n.png" \
      -filter_complex "color=c=0x0c0c0c:s=1080x1350:r=30:d=30[bg];[0:v]scale=$sw:-2,crop=1080:$ch:$cx:$cy[sc];[bg][sc]overlay=0:$oy[v1];[v1][1:v]overlay=0:0,format=yuv420p[v]" \
      -map "[v]" -map 0:a -c:v libx264 -preset medium -crf 18 -r 30 -c:a aac -b:a 192k -t 30 -movflags +faststart "video/devsa-fm-carousel-$n.mp4"
  else
    ffmpeg -nostdin -v error -y -ss "$start" -t 30 -i "$OUT/$loop" -i "video/overlay-$n.png" -ss "$audio" -t 30 -i "$SONG" \
      -filter_complex "color=c=0x0c0c0c:s=1080x1350:r=30:d=30[bg];[0:v]scale=$sw:-2,crop=1080:$ch:$cx:$cy[sc];[bg][sc]overlay=0:$oy[v1];[v1][1:v]overlay=0:0,format=yuv420p[v]" \
      -map "[v]" -map 2:a -af "afade=t=in:d=1,afade=t=out:st=28.5:d=1.5" -c:v libx264 -preset medium -crf 18 -r 30 -c:a aac -b:a 192k -t 30 -movflags +faststart "video/devsa-fm-carousel-$n.mp4"
  fi
  echo "slide $n: $loop from ${start}s"
done <<'LIST'
02 loop-commute-night.mp4 0     1350 118 0  90
03 loop-fish.mp4          0     1765 341 0  30
04 loop-court.mp4         179.4 1765 341 23 loop
05 loop-taco.mp4          179.4 1765 265 0  loop
06 loop-rand.mp4          60    1765 341 0  loop
07 loop-riverwalk.mp4     10    1765 341 0  loop
LIST
