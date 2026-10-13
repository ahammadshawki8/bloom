# Demo video: media sources and licences

Every third-party file in the video, where it came from, and the licence it's used under. The competition rules forbid copyrighted material without permission, so nothing goes in the video unless it's listed here.

## Stock footage

All clips are illustrative, and the video says so on screen. No actor is presented as Renita.

| File | Source | Licence |
|---|---|---|
| `public/stock/loss-portrait.mp4` | Pexels video 6984715, "A woman battling against cancer" | Pexels License (free for commercial use, no attribution required) |
| `public/stock/mirror-headscarf.mp4` | Pexels video 6207548, "Woman applying makeup in front of a mirror" | Pexels License |
| `public/stock/lipstick-mirror.mp4` | Pexels video 6225064, "Cancer patient applying lipstick" | Pexels License |
| `public/stock/christmas-dinner.mp4` | Pexels video 5747589, "A family dining together on Christmas" | Pexels License |
| `public/stock/flowers-serene.mp4` | Pexels video 6984730, "A woman holding a flower" | Pexels License |
| `public/stock/resting-iv.mp4` | Pexels video 6207642, "A female cancer patient with an IV in her arm" | Pexels License |
| `public/stock/phone-resting.mp4` | Pexels video 6207670, "Woman using a smartphone" | Pexels License |
| `public/stock/arched-mirror.mp4` | Mixkit video 42733, "Woman getting ready in front of a mirror" (kept for later parts) | Mixkit Stock Video Free License |

## Music and sound effects

| File | Source | Licence |
|---|---|---|
| `public/audio/music-discover.mp3` | Mixkit track 657, "Discover" by Eugenio Mininni | Mixkit Stock Music Free License |
| `public/audio/music-possible-dreams.mp3` | Mixkit track 148, "Possible Dreams" by Eugenio Mininni (closing) | Mixkit Stock Music Free License |
| `public/audio/sfx-air-woosh.mp3` | Mixkit sound 1492, "Air woosh" | Mixkit Sound Effects Free License |
| `public/audio/sfx-heartbeat.mp3` | Mixkit sound 784, "Deep heartbeat impact" | Mixkit Sound Effects Free License |
| `public/audio/sfx-riser.mp3` | Mixkit sound 2353, "Cinematic drama riser" | Mixkit Sound Effects Free License |
| `public/audio/sfx-logo-impact.mp3` | Mixkit sound 1469, "Movie logo intro impact" | Mixkit Sound Effects Free License |

## Our own material

- **Product walkthrough** footage in `public/walkthrough-desktop/` is recorded from the live Bloom site by `tools/capture-walkthrough.mjs`. Retailer and charity names are blurred in the page while recording.
- **Try-on images** in `public/renders/` are real YouCam API renders on YouCam's sample face, from `frontend/public/fixtures/`. The layered look was rendered live through Bloom's `/stack` route.
- **Team photos** (`public/renders/nourin.jpg`, `public/renders/shawki.jpg`) are the team's own portraits, provided by them.
- **Fonts:** Fraunces and Figtree, under the SIL Open Font License, taken from the website's own build.
- **Renita's story** is paraphrased from her account shared with Macmillan Cancer Support, which is credited on screen. No publisher screenshots or logos are used.

## Voice

- `public/audio/s*.mp3`, `w*.mp3` and `c*.mp3` are a **temporary scratch track** made with Microsoft Edge text-to-speech, used only to time the edit.
- Replace it with Nourin's recorded narration before publishing.
