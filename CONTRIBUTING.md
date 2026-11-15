# Contributing to DEVSA FM

DEVSA FM is a livestream of San Antonio at night in ASCII, with music, on
[YouTube @devsatx](https://www.youtube.com/@devsatx). Every scene is a single HTML file you can
read top to bottom, so it's a good first open-source contribution: if you can write a little
JavaScript and draw on a canvas, you can make a scene that airs.

## Ways to help

- **Build a scene.** A place in San Antonio, at night, in the house style. Start from `scene/starter.html`.
- **Pitch a scene.** Open an issue with the *Scene idea* template: the place, what happens, why it's San Antonio.
- **Review a scene.** Watch one in the preview and open an issue with what reads well and what doesn't.
- **Improve the kit.** `scene/fmkit.js` (the ASCII renderer and helpers), `scene/plush.js` (the agents), `tools/`.

## Get it running

To look first, click any still in the [README](README.md#on-air): each opens its scene live in the browser.

You need [Node.js](https://nodejs.org) 18+ and Google Chrome. ffmpeg is only needed for clips.

```sh
git clone https://github.com/devsanantonio/devsa-fm.git
cd devsa-fm
npm install
npm run preview          # then open http://localhost:8210 and pick a scene
```

Open scenes through the preview server, not by double-clicking the file: browsers block the fonts and
images a scene loads from a `file://` page. Add `?still&t=12` to a scene's address to freeze it at
second 12.

On Linux or Windows, point the tools at Chrome with `CHROME=/path/to/chrome`.

## Make a scene

```sh
cp scene/starter.html scene/my-scene.html
npm run preview          # open http://localhost:8210/my-scene.html, edit, refresh
npm run still -- my-scene 5 20 40          # PNGs in out/stills/ to check your work
npm run check -- my-scene                  # the scene contract, checked (below)
```

The starter explains the three layers in its comments. In short, `render(t)` draws one frame for
second `t`:

1. **`paint(t)`** draws the world in **greys** into `g`, at one pixel per character (160 × 90). Brighter
   means a denser character.
2. **`fm.ascii()`** turns that grey picture into characters on the real canvas.
3. **Colour** goes on top in `ctx`, at full 1920 × 1080: anything that gives off light.

### The scene contract

A scene must:

- be **1920 × 1080**, one HTML file in `scene/`, using `fmkit.js` and `fm.start(render, [promises])`;
- **loop seamlessly** over `fm.T` seconds (60 unless the scene is synced to a song). Anything periodic
  completes a whole number of cycles per loop: `Math.sin(TAU * 3 * t / T)`, not `Math.sin(t * 2)`;
- give the **same frame for the same `t`**. Scenes are rendered frame by frame, offline, so never use
  `Math.random()` or the clock. Use `hash(a, b)` or a seeded generator for variety;
- **run without the optional assets**: the City of San Antonio's icons and the group and partner logos
  aren't in the repo. `fm.loadIcons` and `fm.onGround` already skip what's missing; do the same if you
  load anything else;
- leave the bottom 130 px clear for the footer (`footer(t)`: DEVSA FM, the site, the song).

`npm run check -- my-scene` tests the first four for you: it loads the scene with only what's in the repo,
draws the same second twice and compares, and compares `t = 0` with `t = fm.T`. Every pull request runs it too.

To sync a scene to a song's beat, use `fm.pulseAt(t)` (a 0–1 flash on each beat). When the scene is
synced on stream it gets the song's measured beat grid; in the preview it uses a default tempo.

### The house style

Look at `taco.html`, `riverwalk.html` and `paseo.html` before you start. What they share:

- **Night, on near-black** (`#0c0c0c`). The world is ASCII greys; **colour only where there's light**:
  lamps, windows, signs, screens, string lights, the agents.
- **DEVSA's colours lead**: teal `#00b2a9`, pink `#ef426f`, orange `#ff8200` (`fm.TEAL`, `fm.PINK`, `fm.ORANGE`).
- **San Antonio, specifically.** A real place someone from here would recognize: the River Walk, Market
  Square, San Fernando, the Tower, a VIA route. Trace a building from a photo if it helps; keep its real shape.
- **The cast**: DEVSA FM's plush agents (`drawPlush` in `plush.js`), the pixel penguin, the PySanAntonio
  mascot. Agents walk, sit, play, build; they don't need labels to read.
- **One thing happening**, readable at stream size, with a rhythm to it. Not a dashboard, not a wall of text.

### What can't go in a scene

- **Other organizations' logos or marks**, or a real business's name. DEVSA's own marks are fine (see `ASSETS.md`).
- **Real people's photos or likenesses.**
- **Copies of someone else's art**: characters, games, film stills, a traditional lotería deck. Make it original.
- **Anything that sells**: no ads, sponsors or calls to buy.

## Open a pull request

1. One scene (or one fix) per pull request.
2. Credit yourself: put `window.SCENE_BY = "Your Name"` (or your @handle) near the top of your scene's
   script. It shows in the footer when the scene airs.
3. Say in a sentence what happens in the loop. The **Scene check** on your pull request attaches stills of
   your scene; add your own from `npm run still` if a moment matters.
4. Fill in the checklist in the pull request template.

## What happens next

A maintainer reviews it: how it looks, whether it loops, and the rules above. We may suggest changes;
that's normal, and most scenes on the stream went through several rounds.

**Merging a scene doesn't put it on air.** The stream represents DEVSA, so maintainers choose which scenes
join the night mix and when. A scene that airs carries your credit in its footer.

By contributing, you agree your code is released under the MIT license in `LICENSE`.

## Questions

Ask in the [DEVSA Discord](https://devsa.community/discord) or open an issue. Running a build night?
[`docs/workshop.md`](docs/workshop.md) is a two-hour session plan.
