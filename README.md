Version 1 (2026.1.18 22:50)
1) Core entities & data model

Implement these tables:

User (guest allowed via local storage; optional auth later)

Course (IGCSE / IB / IELTS / TOEFL / GRE)

WordEntry (lemma, POS optional, phonetics optional)

WordSense (language, short definition, example sentence optional)

CourseWord (course_id, word_id, difficulty_rank, tags)

UserWordState (user_id, word_id, course_id, status: unseen/seen/interacted/learned, mastery_score 0-100, last_seen_at)

ReadingPassage (course_id, title, source_label, license_label, text, difficulty_rank)

BasketItem (user_id, word_id, created_at)

PracticeItem (user_id, word_id, type: mcq/spelling, prompt, options, answer, created_at)

PracticeResult (user_id, practice_item_id, is_correct, time_spent)

2) App IA (pages & routing)

Home page has 3 main modules (rename for clarity):

“Flashcard Drill”

“Guided Reading”

“Practice Tests”
Also show: current course, today progress, estimated vocab size.

Pages:

/onboarding: choose course + initial placement test (optional MVP-lite)

/flashcards

/reading

/practice

/notes (saved words)

/mistakes (words answered wrong)

/settings (definition language, words-per-session)

3) Flashcards requirements

Default session: 5 words; user can set 5–20.

Flip animation: front=word, back=definition (EN default) + optional ZH toggle.

Buttons per card: “I know this” and “I don’t know this”.

If “I know this”: mark state=learned for this session and skip forward.

If “I don’t know this”: keep in rotation; do not skip.

Must support “Previous” to return to earlier words and undo skip decisions.

A word becomes “interacted” when flipped; becomes “learned” when user explicitly chooses “I know this” OR finishes session with correct practice later (MVP choose one rule and document it).

4) Guided Reading requirements

Show a passage matched to user ability and selected course.

Passage must display source_label + license_label.

Each word should be selectable; also support drag-to-basket.

Basket fixed at bottom; user can click:

Translate (EN / ZH / both)

Add to Notes

Add to Mistakes

A word becomes “interacted” when user translates it from basket.

5) Practice Tests (MCQ + Spelling)

Generate questions from words tagged as interacted/learned.

MCQ: 4 options definition-based (avoid duplicates, include plausible distractors).

Spelling: show definition, user types the word; allow minor typos? (MVP: exact match, case-insensitive).

Record results; wrong answers add to Mistakes automatically.

6) Dynamic level analysis (MVP algorithm)

Maintain user ability_rank per course (0–1000).

Word difficulty_rank also 0–1000 (seed from frequency bands or imported list).

Selection rules:

Flashcards: pick unseen/interacted words near ability_rank ± 80.

Reading: pick passage difficulty_rank near ability_rank ± 120.

Practice: 70% from recent words (last 7 days), 30% from older words.

Update ability_rank after each practice session:

ability_rank = 0.8ability_rank + 0.2(avg difficulty of correctly answered items)

Display “Estimated vocabulary size” as a simple mapping from ability_rank (document assumptions).

7) UI/UX style

Forest theme: muted greens, warm neutrals, high contrast for text, accessible.

Smooth animations: card flip, module transitions, basket interactions.

Emphasize the 3 core modules visually; keep navigation minimal.

8) Seed data & content policy

Provide sample word lists and passages using redistributable sources only.

If exam-specific official content is not redistributable, DO NOT include it. Instead:

include “sample passages” with open licenses and tag them by difficulty/course.

9) Acceptance criteria

npm install && npm run dev runs with seeded data.

User can complete one full loop in one course:
flashcards → reading → practice, and see progress + ability update.

Learned/interacted words persist across sessions.

Notes and Mistakes pages show correct words.

Return the full project structure, key files, and README instructions.

Version 2(2026.1.18 23:00)
Some errors found during the using the webiste, if these errors indeed exist due to lack of specific function, add new functions. if some functions are there but I didn't found it, tell me where to found/use it.
1. cannot choose courses, the default is IGCSE and cannot choose others. Include IELTS, GRE, IB, and TOEFL as well, make it selectable.
2. NO ending session for flash cards, once all words are learnt, there are no way to exit the flash cards mode, and there is no posive feed back(e.g. congragulations). User need to exit and get positive feed back
3. Not every single word in the paragraph can be dragged, only the learnt word, and the paragraph does not have a clear source, the paragraph does not necesarily include the learnt words. And match the source of paragraph with the course the user is learning (e.g. if he is learning IELTS, find a paragrpah from past year papers)
4. After adding the words into basket, the translator does not work, no meaning shows up.
5. No feedback after finishing one MCQ/Spelling practise, and no ending and positive feed back after finishing all, add some
6. The UI is too simple, and animation is not attractive and fluent enough.

Version 3 (2026.1.18 23:30)
Updates based on Version 2 feedback:
1. Added course selector in the header and in Settings so you can switch between IGCSE/IELTS/GRE/IB/TOEFL.
2. Flashcards now show a completion screen with congratulations, plus “Start new session” and “Exit to Home”.
3. Reading: all word tokens are clickable/draggable; passages are provided per course with open-license labels.
   - Official past-year papers are not included to respect redistribution limits.
4. Basket translation now displays meanings; for unseeded words it shows a fallback “Definition not seeded yet.”
5. Practice now gives per-question feedback and a final score summary with exit option.
6. Added smoother animations and hover transitions for cards/modules/basket/buttons.
Feedbacks:
- translators in paragraph reading is still not working, no results displayed
- At spelling and MCQ tasks, set two buttons: check and next, do not auto check, wait for the user to click check, before that, users can make changes. Avoid the error: user only input one letter, and judged as wrong and give out the right answer. 
- Add process bars with percentages for all tasks

Version 4 (2026.1.19 21:48)
- Add "Pro" mode, can be switch on and off manually. 
- Pro mode offers more advanced word, more professional meanings, and more intelegent dynamic analysis of user's habit, and english level
- UI and background are black/grey, make the overall style professional and advanced.
- Add an animation switching between normal mode and pro mode

Updates for Version 3 feedback + Version 4 tasks:
- Reading translation fixed: basket now renders definitions reliably; unseeded words show a fallback message.
- Practice flow updated: separate Check / Next buttons, no auto-check before user confirms.
- Progress bars added for Flashcards, Reading, and Practice with percentages.
- Pro mode added with toggle (header + Settings), advanced words, pro definitions, and smarter ability update.
- Pro mode styling uses black/grey theme with smooth mode-switch animation.
Feedback:
- At normal mode, the button used to switch to pro mode can not be seen, no letter displayed on the button
- UI of the Pro mode is too simple, make every button shines with a flow of energy, make it more energizing and cool. Energy color can be green. Give a metallic texture and carbon-fibre texure. Sci-fiction style
- Make the animation more fancy, make the people who "spend money" on the pro mode feel worth of it. 
Feedback
- make note and mistake session only avaliable in pro-mode, in normal mode, user cannot access to these two functions
- translation in paragraph reading is still not avaliable, it appears "no definition seemed" fix it. 
- remove carbon-fibre texture from the pro-mode UI, it is disturbing, make the UI dark-gray instead of pure black
Version 4.1 (debug & improvements)
- Users may require the function of adding individual words into notes and mistakes seperately. 
- Eventhough the words in basket are paired with their definitions, after adding them into mistakes and notes, the definitions are gone, keep the definition, or even make more detailed definitions in notes and mistaks, as there are more spaces.
- Make normal mode animations(flipping of flash cards, adding of words into the basket...) slightly slower, but keep the fluence. Keep the pace of animations in pro mode, to show the pro mode is faster and more efficient in contrast with normal mode.
Version 4.2 (improvements)
- Still show definitions of words in normal mode, just don't allow it to be added into notes and mistakes
- If each single word can be added into notes and mistakes individually, then change the add into notes and mistakes on the right corner into "add all into notes/mistakes", keep two functions: 1. add indidual 2. add all in once
- make normal mode animation more slower, keep it fluent
- show possesses of words(n.,adj.v.adv. ...) in all places (flash cards, definitions , notes, mistakes)
- in pro mode, make the selection of choices more observable and obvious in MCQ questions, not just slightly brighter than others, maybe change all button into green
- only dislplay "check" before the user checked his answer, then display "next"

Updates for Version 4.2:
- Normal mode shows definitions but disables adding to Notes/Mistakes.
- Basket controls renamed to “Add all to Notes/Mistakes” while per-word “Add this” remains.
- Normal mode animations slowed; Pro mode remains faster.
- POS is shown in flashcards, basket definitions, notes, and mistakes.
- Pro mode MCQ selection highlights are more obvious (green high contrast).
- Practice flow shows only “Check” before validation, then “Next/Finish”.

Updates for Version 5:
- Added placement test gate before Home with skip-to-2000 default vocab.
- Placement test can be retaken anytime; mini test prompts after 10 days.
- Ranking system implemented with rank tiers and a local friends leaderboard.
- Rank + vocab estimate displayed in header and Home.

Updates for Version 5
1. Let the user choose a cource(IG/IB/IELTS/TOFEL), before the user enters the home page, give the user a test, and output the estimated english level of his, in terms of vocabulary number. The user can cancel it, then his default level is around 2000. The test can be done at anytimes, by clicking on a button, for unlimited times. And after every 10 days of using, there will be a mini-test to update the user's vocabulary level. 
2. Add ranking system
| Rank            | Mastery Words (MW) estimated range |
| --------------- | ---------------------------------: |
| **Rookie**      |                              0–200 |
| **Bronze I**    |                            200–400 |
| **Bronze II**   |                            400–650 |
| **Silver I**    |                            650–900 |
| **Silver II**   |                          900–1,200 |
| **Gold I**      |                        1,200–1,600 |
| **Gold II**     |                        1,600–2,100 |
| **Platinum I**  |                        2,100–2,800 |
| **Platinum II** |                        2,800–3,600 |
| **Diamond I**   |                        3,600–4,800 |
| **Diamond II**  |                        4,800–6,200 |
| **Master**      |                        6,200–8,000 |
| **Grandmaster** |                       8,000–10,500 |
| **Legend**      |                     10,500–14,000+ |
3. Add ranking lists among related users, they are connnect by sign up/in and add friend

Version 5.1 (2026.2.26)
- Expanded word bank from 20 to 70 words; each course now has 25+ words (was 6), enough for 5+ unique sessions.
- Flashcards selection rewritten: reads fresh state from localStorage (not stale React state), strictly prioritizes unseen words, and immediately marks selected words as "interacted" upon session generation so they are never repeated in the next session.
- Removed the duplicate "New Session" button at the top of the Flashcards page; only the "Start new session" button after completing a session remains.
- Added new pro-mode words distributed across all courses.
- Removed difficulty window filter from flashcard selection; all course words are now eligible.
- Added "Reset All Progress" button to Settings page.

Version 5.2 (2026.3.1)
- Integrated ECDICT open-source English-Chinese dictionary (MIT license, 770k entries) as word data source.
- Wrote Python extraction script (scripts/extract_words.py) to filter and generate seed data from ECDICT CSV.
- Word bank expanded to 1022 unique words: each course now has 200 base + 40 pro = 240 words.
- Every word includes: English definition, Chinese definition, phonetics, and POS — all sourced from ECDICT.
- Course assignment: IGCSE/IB use Oxford core + Collins + CET tags; IELTS/TOEFL/GRE use ECDICT exam tags directly.
- Difficulty 150-900 spread evenly per course based on BNC/COCA corpus frequency ranking.
- Added ecdict.csv to .gitignore (63MB data source, not needed at runtime).
