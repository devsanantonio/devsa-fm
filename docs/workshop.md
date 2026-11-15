# Build a DEVSA FM scene: a session plan

A two-hour session (an Agentic Nights night fits it) where everyone leaves having made a scene of a place in
San Antonio, and one of them goes on the stream. It works for people who have never drawn on a canvas,
because each person pairs with a coding agent and the starter explains itself.

## Before the night

- Pick five or six places from the [`good first scene` issues](https://github.com/devsanantonio/devsa-fm/labels/good%20first%20scene),
  and bring a photo of each. Tracing a real shape is what makes a scene read as San Antonio.
- Check that [devsa.community/fm](https://www.devsa.community/fm) loads on the room's Wi-Fi: it's the
  fallback for anyone whose laptop won't install Node.
- Have the night mix playing on the screen as people arrive.

## The night

| Time | What happens |
|---|---|
| 0:00 | **Watch.** Five minutes of the stream. Then open `scene/starter.html` on the screen and walk its three layers: greys, characters, colour. |
| 0:15 | **Set up.** Clone, `npm install`, `npm run preview`. Pair up anyone who gets stuck. |
| 0:25 | **Pick a place.** One per person or pair. `cp scene/starter.html scene/<place>.html`. |
| 0:30 | **Build.** Pair with a coding agent (Claude Code, or whichever you use). Give it `CONTRIBUTING.md` and the starter first, so it works inside the scene contract. Start with the building's silhouette in greys, then one light, then one thing that moves. |
| 1:30 | **Check.** `npm run check -- <place>`, fix what it flags, then `npm run still`. |
| 1:40 | **Show.** Each scene on the big screen for thirty seconds. |
| 1:55 | **Ship.** Open pull requests. Maintainers pick one to join the night mix that week, credited in its footer. |

## Tips for the room

- One thing happening. The first draft always has too much; ask what the eye should land on.
- Colour only where there's light. Most of the scene is grey characters.
- If a scene doesn't loop cleanly, the fix is nearly always a `Math.sin(t * k)` that should be
  `Math.sin(TAU * n * t / T)`.

The music isn't in the repo, so scenes are built in silence and synced to a song by a maintainer before they air.
