# Bloom demo video: script (v2)

**Length:** 2:55 at most. The rules allow **1 to 3 minutes**. Anything past 3:00 can be cut off or marked down, so 2:55 leaves a safety margin.
**Voice:** one calm, warm narrator. Nourin is the natural choice because she leads the team.
**Pace:** about 145 words per minute. The narration is about 380 words, which leaves room for the screen to breathe.
**Captions:** burn them in. Many judges watch with the sound off.

| Part | Time | Length | Job | Rubric it scores |
|---|---|---|---|---|
| 1. Cold open and pitch | 0:00 to 0:10 | 10 s | What Bloom is, in one breath | Idea |
| 2. The problem | 0:10 to 0:32 | 22 s | A real story, real numbers, and the retail gap | Impact |
| 3. Product walkthrough | 0:32 to 2:17 | 105 s | The whole journey, live, on a real phone | Technology, Design |
| 4. Why Bloom should win | 2:17 to 2:55 | 38 s | Four criteria in four lines, the team, the ending | All four, plus the two special prizes |

How to read each scene:
- **VO** is what the narrator says.
- **On screen** is text we add in the edit.
- **Visual** is what the viewer sees.

---

## Rules this video must not break

These come from the official rules, saved in `planBloom.md` §2 and §13.6. Breaking one can disqualify us.

1. **1 to 3 minutes long.** Our target is 2:55.
2. **Show the product running on the device it was built for.** Record on a **real phone**, with at least one shot of a hand holding it. Don't use a phone mockup around a desktop recording.
3. **Explain which YouCam APIs are used.** Each one is named on screen at the moment it's used, and all six are recapped in Part 4.
4. **No third-party trademarks or copyrighted material without permission:**
   - No news-site screenshots or logos. Their article pages are copyrighted and their names are trademarks. We make our own cards instead and cite the source in small text.
   - **Blur retailer names and logos** wherever they appear in the app (the product panel, the "View at …" button, product photos with labels).
   - Only licensed stock footage (Pexels, Pixabay, Mixkit) and licensed music (YouTube Audio Library, Pixabay Music).
   - Don't show other companies' names or logos (frameworks, model providers). Those go in the Devpost text, not the video. YouCam and Perfect Corp are the sponsor and may be shown.
5. **Upload as public** on YouTube (preferred) or Vimeo.

---

## Parts 1 and 2. The opening: Renita's story (0:00 to 0:42)

> **Changed in v3.** The opening is now one emotional story instead of a pitch followed by facts. It follows Renita's real account (shared with Macmillan Cancer Support, credited on screen), told over illustrative footage that's labelled as illustrative. The elevator pitch comes at the end of the story, when the viewer is ready for it. It's built in Remotion (`video/src/opening/`).

| Time | Beat | Visual | VO |
|---|---|---|---|
| 0:00 to 0:07.6 | Loss | A hairless woman against deep blue, eyes lowered, then she looks into the camera on "her lashes". Cold grade. A small note: *Renita's story, shared with Macmillan Cancer Support. Illustrative footage.* | After chemotherapy, Renita lost her hair. Her eyebrows. Her lashes. |
| 0:07.6 to 0:11.5 | A stranger | A woman in a headscarf at the mirror stops and looks down. The camera drifts toward her reflection. | When she looked in the mirror, she saw a stranger. |
| 0:11.5 to 0:14.6 | Getting ready | The same woman puts on lipstick, then gives a first small smile. The grade begins to warm. | Then, on Christmas Day, she put on a wig, drew on her brows, |
| 0:14.6 to 0:19.1 | Christmas | A family dinner with fairy lights and laughter, in a golden grade. | and sat down with her family. |
| 0:19.1 to 0:23.6 | Herself | A woman holding white flowers turns to the camera, serene. The music swells. | For a few hours, she felt like herself again. |
| 0:23.6 to 0:30.5 | The turn | The warmth drains. The same headscarf woman rests in bed. **18 days** counts up on a 4-week timeline, with the study cited. | But hair loss comes fast. In one study, it began just eighteen days after treatment started. |
| 0:30.5 to 0:35 | The question | She looks at her phone. The camera pushes into the screen, and its light opens into Bloom's ivory. | What if every woman could find that feeling, before her hair is gone? |
| 0:35 to 0:42.5 | Bloom | Bloom's arched mirror: real YouCam renders bloom open one after another, then **"Bloom. Choose your hair before treatment does."** with *Every look shown is a real YouCam try-on render.* | Bloom lets you try real wigs, wraps, brows and lashes on your own face, before treatment begins. |

Because the opening is longer, the walkthrough must stay within about 100 seconds and the closing within about 35, to keep the film under 3:00. The "first try is the only try" retail point moves to the fitting-room scene (3.2).

---

## Part 3. Product walkthrough (0:32 to 2:17)

Record everything on the live site, **bloom-nourinrichi2026-9069.vercel.app**:
- Record **on a real phone** with its built-in screen recorder.
- Open with one over-the-shoulder camera shot of her hand holding the phone (Scene 3.1). That shot proves "running on the device it was built for".
- Use a **real photo** (Nourin, with her consent) for the passport and the first try-on. That shows the YouCam APIs working live on a real face, not as a mockup. Everything after that can use saved looks, which costs no API units.

### Scene 3.1 (0:32 to 0:52): the Hair Passport

**Visual:**
1. Over-the-shoulder shot: her hand holds the phone and opens Bloom.
2. Cut to the screen recording. The camera guide is open, and the frame turns green when her face is in place. She takes the front photo and skips the optional side photos.
3. The **Hair Passport** card appears. Zoom in on each reading and its source label: natural colour, face shape, brows, length.

**VO:**
> This is Bloom, on her phone. She takes one photo, and Bloom makes her Hair Passport. Her hair colour is measured right on the phone. YouCam's AI reads her face shape and brows, and her hair's length, type and density.
> Her hair is saved, even after it's gone.

**On screen (lower third, one line at a time as each reading appears):**
- **Colour:** measured on the phone
- **YouCam AI Face Analyzer:** face shape and brows
- **YouCam AI Hair Length, Type and Density Detection**

### Scene 3.2 (0:52 to 1:15): the fitting room

**Visual:**
1. Fitting room, **Wigs** tab, **Match my hair** selected. The row of real wigs, closest colour first. Blur the retailer names.
2. She taps a wig. "Trying on…" appears in the mirror. The render appears on **her own face**.
3. She presses and holds the mirror to show her original photo, then lets go to show the wig again.
4. Slow zoom on the fit card: the colour reading and the overall score.

**VO:**
> Bloom finds real wigs that match her hair. One tap, and YouCam's AI Hairstyle puts the wig on her own face. A live render, not a filter.
> Hold to compare it with her real hair. Bloom checks the colour on the finished image, so she knows how close it really is.

**On screen:**
- Lower third: **YouCam AI Hairstyle (Hair Transfer): live render on her photo**
- Small tag on the fit card: **Colour measured on the render**

### Scene 3.3 (1:15 to 1:30): wraps, brows and lashes

**Visual:**
1. Quick cut: **Wraps** tab, and she taps the sage bamboo turban.
2. Back to her wig look. **Brows & lashes** tab. She taps the suggested brow, then lashes. They are drawn on **top of the wig**.
3. The **"Wearing"** chips under the mirror show the wig, brows and lashes together.

**VO:**
> Wraps and turbans are here too. And because chemo can take brows and lashes, she can layer them on top of her wig.

**On screen:** Lower third: **YouCam AI Makeup VTO: brows and lashes, layered on the wig**

### Scene 3.4 (1:30 to 1:45): the Bloom guide

**Visual:**
1. She opens the guide on her phone and types: *"I like long blonde hair."*
2. The steps appear live, one by one: Checked your passport, Searched wigs, Checked fit.
3. Three long blonde wigs appear, each with a short reason and a **Try it on** button.

**VO:**
> Not sure where to start? She asks the Bloom guide, an AI agent. It searches real products, checks the fit, and shows every step.

**On screen:** **AI agent: every number comes from Bloom's own measurements**

> **Recording tip:** record this scene on its own, at least a minute after any other guide question, so the AI model isn't rate-limited. Crop out the small "Planned by …" line, which names a model provider.

### Scene 3.5 (1:45 to 2:03): choose together

**Visual:**
1. **Your looks** page with the **Loved** and **Maybe** shelves. She selects two looks and taps **Help me choose**. They appear side by side.
2. **Ask someone you love**, then **Create a private link**: "Your link is ready."
3. Cut to a second phone (her sister). The page says "Someone you love would like your help." She taps **Love it** on one look.
4. Back on her phone, the vote appears on that look.

**VO:**
> Choosing is easier together. She compares her favourites and sends a private link. Her family votes for the looks they love.

### Scene 3.6 (2:03 to 2:17): the decision

**Visual:**
1. She taps **"This is the one."** The decision page opens with **"You chose"**, showing the look and its price. Blur the retailer name.
2. Her thumb taps the store button (blurred).
3. Scroll to **"Insurance may cover it"** and the summary for her insurer.

**VO:**
> When she's ready, Bloom opens that exact product at the store, with notes to help her ask her insurer to cover it.

---

## Part 4. Why Bloom should win (2:17 to 2:55)

### Scene 4.1 (2:17 to 2:20): transition question

**Visual:** The decision page shrinks back into the arched mirror. Soft music lift.

**VO:**
> So why should Bloom win?

### Scene 4.2 (2:20 to 2:40): four criteria, four lines

**Visual:** Four cards, one per line, in the order the narrator speaks. Each shows a criterion name with one proof shot from the walkthrough behind it.

| Card | Proof shot behind it |
|---|---|
| **Technology:** 6 YouCam APIs, live | The six API names light up around the mirror |
| **Impact:** a short window, solved at home | The 18-day number |
| **Design:** one complete journey | Quick montage: passport, mirror, vote, decision |
| **Idea:** save your hair before you lose it | The Hair Passport card |

**VO:**
> Six YouCam APIs, working live, in one complete journey. A real problem, with an 18-day window, solved at home. Real products, with colour checked on every render. And a new use of try-on: saving your hair before you lose it.

**On screen (recap list, held for the whole scene):**
**Powered by Perfect Corp's YouCam APIs**
1. AI Hairstyle (Hair Transfer)
2. AI Face Attributes & Ratio Analyzer
3. AI Hair Length Detection
4. AI Hair Type Detection
5. AI Hair Density Detection
6. AI Makeup VTO

### Scene 4.3 (2:40 to 2:48): the team

**Visual:** Both teammates on camera, or their photos side by side with name cards. If Nourin is on camera, she can say this line herself.

**VO:**
> Bloom is led by Nourin Richi, with Ahammad Shawki. Two students, from BRAC University and BUET.

**On screen:**
- **Nourin Richi:** team lead, research and design, BRAC University (badge: **Women in Tech**)
- **Ahammad Shawki:** full-stack and AI engineer, BUET (badge: **Rising Star**)

### Scene 4.4 (2:48 to 2:55): the ending

**Visual:** Back to the arched mirror. Nourin's face from the walkthrough, in her chosen wig, smiling. The card from Part 2 returns, and the words "a stranger" dissolve into "still me". The music resolves. End card with the logo and the link.

**VO:**
> Bloom helps her look in the mirror and say: this is still me.

**On screen (end card, hold 3 seconds):**
**Bloom.** Choose your hair before treatment does.
bloom-nourinrichi2026-9069.vercel.app
Try it with our sample face. No photo needed.

---

## Full narration (for recording)

Read this straight through. Each paragraph is one part.

> Chemotherapy can take your hair in a few weeks. Bloom lets women choose their next hair before that happens. Real wigs, wraps, brows and lashes, tried on their own face.

> Renita said that after chemo, a stranger looked back at her from the mirror. In one study of 1,478 patients, hair loss began after about 18 days. 84 percent used a wig. 90 percent lost their eyebrows. And many wigs can't be returned once they're opened. So the first try is often the only try. So what if you could meet your new hair before you lose your own?

> This is Bloom, on her phone. She takes one photo, and Bloom makes her Hair Passport. Her hair colour is measured right on the phone. YouCam's AI reads her face shape and brows, and her hair's length, type and density. Her hair is saved, even after it's gone.
>
> Bloom finds real wigs that match her hair. One tap, and YouCam's AI Hairstyle puts the wig on her own face. A live render, not a filter. Hold to compare it with her real hair. Bloom checks the colour on the finished image, so she knows how close it really is.
>
> Wraps and turbans are here too. And because chemo can take brows and lashes, she can layer them on top of her wig.
>
> Not sure where to start? She asks the Bloom guide, an AI agent. It searches real products, checks the fit, and shows every step.
>
> Choosing is easier together. She compares her favourites and sends a private link. Her family votes for the looks they love. When she's ready, Bloom opens that exact product at the store, with notes to help her ask her insurer to cover it.

> So why should Bloom win? Six YouCam APIs, working live, in one complete journey. A real problem, with an 18-day window, solved at home. Real products, with colour checked on every render. And a new use of try-on: saving your hair before you lose it.
>
> Bloom is led by Nourin Richi, with Ahammad Shawki. Two students, from BRAC University and BUET.
>
> Bloom helps her look in the mirror and say: this is still me.

Approximate word counts: Part 1, 29 words. Part 2, 70 words. Part 3, 186 words. Part 4, 85 words. That's about 370 words, or 2:33 of speech, which leaves about 20 seconds for pauses and on-screen moments.

---

## Transitions

| From to | Spoken bridge | Visual bridge |
|---|---|---|
| Hook to pitch | "...in a few weeks." then "Bloom lets women choose..." | The hairbrush cuts hard to the bright mirror |
| Pitch to problem | (the music drops) | The mirror cuts to our stack of cards |
| Problem to product | "So what if you could meet your new hair before you lose your own?" | A real mirror dissolves into Bloom's arch |
| Within the walkthrough | "Wraps and turbans are here too." / "Not sure where to start?" / "Choosing is easier together." | The arch carries over between screens |
| Product to pitch | "So why should Bloom win?" | The decision page shrinks back into the arch |
| Pitch to ending | "...this is still me." | "a stranger" dissolves into "still me" on the returning card |

---

## How each judging criterion is shown

The four criteria are weighted equally. Each one has a specific moment in the video:

- **Technological Implementation.** Six APIs, each named when used. A live render on a real photo. Colour measured on the finished render. The AI agent's steps shown on screen. Retail value: it opens the exact product at the store.
- **Design.** One unbroken journey on a real phone: passport, mirror, layers, guide, family vote, decision. The arch carries over between every part.
- **Potential Impact.** A real woman's story, the 18-day number, and the no-returns problem. The walkthrough then solves each one: she can try at home, before hair loss, and with family.
- **Quality of Idea.** The non-obvious part is said out loud: save your hair before you lose it, then use it to choose.

Stage 1 asks, pass or fail, whether we fit the theme and use YouCam functionally. Scenes 3.1 and 3.2 answer that with a live render on a real face, on a real phone.

---

## Footage and music sources

- **Stock video:** Pexels, Pixabay and Mixkit, which are free for commercial use. Search terms: "hairbrush hair", "woman mirror reflection", "wig on stand", "woman headscarf window". Save each clip's licence page link in the video description notes.
- **Story cards:** designed by us, with paraphrased words and a small source line. The full links go in the Devpost text, not the video.
- **Real interview footage:** don't use it unless we have written permission.
- **Music:** a soft piano or strings track from the YouTube Audio Library or Pixabay Music. Gentle at the start, a small lift at 0:32 and again at 2:17, and it resolves at the end.

**About the child-patient angle:** leave it out. Bloom's catalogue, sizing and copy are made for adult women. A child's story would promise something the product doesn't do yet.

---

## Recording checklist

- [ ] Open the live site a minute before recording, so the Render server is awake. The first request can take about 50 seconds.
- [ ] Record on a real phone with its screen recorder, plus one over-the-shoulder camera shot of her hand holding it.
- [ ] Use the real photo only for the Hair Passport and one or two try-ons. Each new live render uses YouCam units. Repeating a look already rendered is free.
- [ ] Before recording, save two or three wig looks and render one layered look (wig with brows and lashes).
- [ ] Record the guide scene on its own, with a minute's gap before it.
- [ ] Use a second phone or a private window as the family member for the voting scene.
- [ ] In the edit, blur every retailer name, logo and product label. Crop out the guide's "Planned by …" line.
- [ ] Keep each burned-in caption to one short line, at most about 40 characters.
- [ ] Final length between 2:45 and 2:58.
- [ ] Upload to YouTube as **Public** (not Unlisted), and paste the link into Devpost.
