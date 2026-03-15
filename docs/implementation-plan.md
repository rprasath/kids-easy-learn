# Implementation Plan: Kids Easy Learn V1

## Summary

Build a Next.js + React + TypeScript web app using the App Router, Tailwind CSS, and a typed repository layer that reads from local JSON now and can later be swapped to a backend without changing UI code. V1 ships three geography skills: U.S. States, Continents, and Countries of the World. Users first select one or more skills, then start either a Flashcards session or a Quiz session generated from that selection. Progress is local-only and stored in the browser.

Chosen defaults:

- Platform: web app
- Audience: ages 6-9
- Scope: flashcards + quiz across three geography skills with multi-skill session selection
- Data source: local JSON behind repository interface
- Assets: local repo assets
- Testing: unit + e2e smoke
- Plan doc target: `docs/implementation-plan.md`

## Implementation Changes

### 1. Project foundation

- Initialize a new Next.js app with TypeScript and App Router.
- Add Tailwind CSS and define a small theme system for kids UI:
  - bright but readable palette
  - large spacing scale
  - rounded cards/buttons
  - playful display font plus readable body font
- Establish top-level app structure:
  - `app/` for routes
  - `components/` for shared UI
  - `features/skills/` for skill-specific logic
  - `lib/` for repositories, storage, validation, and quiz generation
  - `data/` for JSON content
  - `public/` for state flags and other static assets
  - `types/` for shared app contracts

### 2. Platform shell

- Build a reusable platform shell that supports multiple skills, with three active geography skills in v1.
- Home page should show:
  - app title/hero
  - a skill selection section with three active choices for `U.S. States`, `Continents`, and `Countries`
  - a clear multi-select interaction using large checkbox cards or toggle cards
  - two primary actions: `Start Flashcards` and `Start Quiz`
  - optional placeholder cards for future skills marked "Coming Soon"
  - summary of local progress for each active skill
- Create reusable shell components:
  - header/navigation
  - skill card
  - skill selector card
  - selected skills summary
  - progress badge/summary
  - primary button/card primitives
- Keep routing simple:
  - `/`
  - `/learn`
  - `/quiz`
  - `/results`
- Route behavior:
  - `/` is the session setup screen where the user picks one or more skills
  - `/learn` renders flashcards using only the selected skills
  - `/quiz` renders quiz questions using only the selected skills
  - `/results` shows the outcome for the last quiz session
- Selection handling:
  - selected skill ids should be encoded in the URL query string so sessions are shareable and reload-safe
  - if no skill is selected, Flashcards and Quiz start actions remain disabled
  - if exactly one skill is selected, the experience still uses the same shared flow rather than a special-case route
- Exact URL shape:
  - `/` with no required query params
  - `/learn?skills=states,continents`
  - `/quiz?skills=states,countries&count=10`
  - `/results?skills=states,countries&score=8&total=10`
  - `skills` is a comma-separated ordered list of skill ids
  - `count` defaults to `10` when omitted
  - unsupported or unknown skill ids are ignored; if no valid skills remain, redirect to `/`
  - `results` can read summary data from in-memory state or storage, but query params should still include `skills`, `score`, and `total` for reload safety

### 3. Data model and backend-ready abstraction

- Store all skill content in JSON files under `data/skills/`.
- Split content into stable files:
  - `states/states.json` for U.S. States facts
  - `continents/continents.json` for continent facts
  - `countries/countries.json` for country facts
  - `skills.json` or registry JSON for skill metadata
- Create a typed repository interface so UI never imports JSON directly.
- Initial implementation uses `JsonSkillRepository`.
- Future backend migration path:
  - keep repository interface unchanged
  - add `ApiSkillRepository`
  - switch implementation through a factory/config layer
- Add runtime validation for loaded JSON so malformed content fails early in development.

Required types:

- `SkillDefinition`
- `SkillMode = 'flashcards' | 'quiz'`
- `SkillProgress`
- `LearningSessionConfig`
- `LearningCardItem`
- `StateCardItem`
- `ContinentCardItem`
- `CountryCardItem`
- `QuizQuestion`
- `QuizRoundResult`
- `SkillRepository` interface with methods such as:
  - `listSkills()`
  - `getSkill(skillId)`
  - `getItems(skillId)`
  - `getItemsForSkills(skillIds)`
  - `getQuizQuestions(skillIds, options)`

Session-specific fields:

- `selectedSkillIds`
- `mode`
- `questionCount`
- `shuffle`
- optional future-safe fields like `difficulty`, `includeFavoritesOnly`

Shared content fields:

- `id`
- `skillId`
- `name`
- `facts`
- optional future-safe fields like `mapImage`, `difficulty`, `tags`

State-specific fields:

- `abbreviation`
- `capital`
- `region`
- `nickname`
- `flagImage`

Continent-specific fields:

- `hemisphere`
- `countryCount`
- `largestCountry`
- `largestCity`
- `landmarkImage`

Country-specific fields:

- `capital`
- `continent`
- `flagImage`
- `officialLanguage`
- `currency`
- `landmarkImage`

JSON contract:

- `data/skills/skills.json` should be an array of skill definitions using this shape:

```json
[
  {
    "id": "states",
    "title": "U.S. States",
    "description": "Learn states, capitals, flags, and fun facts.",
    "theme": {
      "accent": "blue",
      "surface": "sky"
    },
    "supportedModes": ["flashcards", "quiz"],
    "contentKey": "states",
    "status": "active"
  }
]
```

- `data/skills/states/states.json`, `data/skills/continents/continents.json`, and `data/skills/countries/countries.json` should each use an object wrapper so metadata can be extended later without breaking consumers:

```json
{
  "skillId": "states",
  "version": 1,
  "items": [
    {
      "id": "alabama",
      "skillId": "states",
      "name": "Alabama",
      "abbreviation": "AL",
      "capital": "Montgomery",
      "region": "South",
      "nickname": "Yellowhammer State",
      "flagImage": "/flags/us/alabama.png",
      "facts": [
        "Alabama was the 22nd state to join the United States.",
        "The state bird is the yellowhammer."
      ],
      "tags": ["capital", "flag", "south"]
    }
  ]
}
```

- Continent and country files should use the same wrapper shape and include their skill-specific fields inside each item.
- All item files must include:
  - `skillId` matching the file's owning skill
  - numeric `version`
  - non-empty `items` array
- All items must include:
  - unique `id` within the skill
  - `skillId`
  - `name`
  - non-empty `facts`
- Asset paths in JSON must be app-relative paths under `public/`.

### 4. Geography skill implementations

- Register `states`, `continents`, and `countries` as active skills in the skill registry.
- The user can select any one skill or any combination of the three skills before starting a session.
- U.S. States skill:
  - Add all 50 states; do not include territories in v1.
  - Each state gets a flag asset, short kid-friendly facts, capital, and nickname.
  - Flashcard front shows state name, flag, and abbreviation.
  - Flashcard back shows capital, region, nickname, and facts.
  - Quiz types include state -> capital, capital -> state, flag -> state, and fact -> state.
- Continents skill:
  - Add all 7 continents.
  - Each continent gets a simple visual, short facts, approximate country count, largest country, and largest city or notable place.
  - Flashcard front shows continent name and illustration or map visual.
  - Flashcard back shows hemisphere, country count, notable geography, and facts.
  - Quiz types include continent -> fact, fact -> continent, landmark/map -> continent, and continent -> largest country.
- Countries skill:
  - Add a curated world countries set for v1. Default target is all sovereign countries if content volume is manageable; otherwise phase the content so architecture supports the full set and seed an initial large subset.
  - Each country gets a flag asset, capital, continent, language, currency, and short facts.
  - Flashcard front shows country name and flag.
  - Flashcard back shows capital, continent, language, currency, and facts.
  - Quiz types include country -> capital, flag -> country, fact -> country, and country -> continent.
- Shared session behavior across all skills:
  - flashcards and quizzes should be generated from the union of items in the selected skills
  - if multiple skills are selected, the session should mix items from those skills rather than forcing separate rounds
  - flashcards should display a visible skill label so the child knows whether the current card is a state, continent, or country
  - quiz questions should include enough context to avoid ambiguity when mixed skills are active
  - 10 questions per round
  - 4-option multiple choice
  - immediate correctness feedback
  - results page with score, review summary, and replay using the same selected skills
  - flashcard controls for flip, next, previous, shuffle, and favorite
  - optional progress indicator such as `12 / 50`
- Quiz generator rules:
  - no duplicate target items in one round
  - no duplicate options
  - distractors must be valid for the question's source skill
  - mixed-skill sessions should preserve question type compatibility per item type
  - question wording should stay explicit in mixed sessions, for example "Which country has this flag?" versus "Which state has this capital?"
  - deterministic mode for tests

### 5. Local progress and favorites

- Implement a storage service over `localStorage`.
- Persist by skill id:
  - cards viewed
  - favorite item ids
  - quizzes completed
  - best score
  - current streak
  - last played timestamp
- Persist session setup state:
  - last selected skill ids
  - last chosen mode
- Build storage behind an interface so it can later be replaced by API persistence if accounts are introduced.
- Graceful fallback:
  - if browser storage is unavailable, app still runs and shows session-only behavior

### 6. UI and accessibility rules

- Design for tablet-first, but fully responsive on mobile and desktop.
- Use large tap targets, simple copy, and clear button labeling.
- Avoid long paragraphs; facts should be short and scannable.
- Ensure keyboard accessibility and visible focus states.
- Add alt text and descriptive labels for flags and interactive controls.
- Keep animations light and purposeful:
  - card flip
  - score reveal
  - page/section transitions
- No audio, narration, leaderboard, login, or parent dashboard in v1.

## Public Interfaces / Contracts

- `SkillDefinition` must be the only way the shell knows about a skill.
- `SkillRepository` must be the only way feature UI gets content.
- `ProgressStore` must isolate browser persistence from feature code.
- `LearningSessionConfig` must be the only session input contract used by flashcard and quiz flows.
- UI components receive typed domain objects, not raw JSON.
- JSON schema and TS types must remain aligned so future backend responses can match the same contract.
- Shared flashcard and quiz components should work against generic item contracts so new geography skills can reuse them with minimal custom UI.
- Flashcard and quiz engines should accept arrays of mixed item types plus skill metadata, not hard-coded skill-specific inputs.
- `LearningSessionConfig` should use this concrete shape:

```ts
type SkillId = 'states' | 'continents' | 'countries';
type SkillMode = 'flashcards' | 'quiz';

type LearningSessionConfig = {
  selectedSkillIds: SkillId[];
  mode: SkillMode;
  questionCount: number;
  shuffle: boolean;
};
```

- `QuizRoundResult` should include at minimum:

```ts
type QuizRoundResult = {
  selectedSkillIds: SkillId[];
  score: number;
  total: number;
  answers: {
    questionId: string;
    itemId: string;
    skillId: SkillId;
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
  }[];
};
```

- Query parsing rules:
  - preserve skill order from the URL for deterministic session setup
  - de-duplicate repeated skill ids
  - clamp `count` to a safe v1 range such as `5` to `20`
  - default `shuffle` to `true` for flashcards and quiz sessions

## Test Plan

- Unit tests:
  - JSON validation passes for valid states, continents, and countries data and fails for missing required fields
  - repository returns typed data correctly
  - repository correctly aggregates items for one skill and multiple selected skills
  - quiz generator creates 10 unique questions with 4 unique options for each skill and for mixed-skill selections
  - progress store reads/writes correctly
- Component or integration-level tests:
  - skill selector allows multi-select and disables start actions when no skill is selected
  - flashcard flip and navigation behavior for single-skill and mixed-skill sessions
  - quiz answer flow updates score and feedback state
  - results page renders expected totals
- E2E smoke tests:
  - user opens app, selects one skill, starts flashcards, and sees only items from that skill
  - user opens app, selects multiple skills, starts flashcards, and sees a mixed session with visible skill labels
  - user opens app, selects multiple skills, starts quiz, completes round, and sees results based on that selection
  - progress persists after refresh on same device
  - mobile viewport remains usable
- Acceptance checks:
  - child can learn without login
  - content is readable and visually guided
  - all three geography skills share the same platform shell and local progress system
  - the selected skills fully control which flashcards and quiz questions appear
  - adding a fourth skill requires only new registry entry, content, and feature module wiring

## Delivery Sequence

1. Bootstrap Next.js app, Tailwind, theme tokens, and folder structure.
2. Define core types, repository interfaces, and progress store contracts.
3. Add shared JSON content format, validation, and local JSON repository implementation.
4. Build platform shell, skill registry, and home page with multi-skill session selection.
5. Add session config handling and route/query parsing for shared flashcard and quiz flows.
6. Add U.S. States content and shared flashcard/quiz rendering.
7. Add Continents content and wire it into the shared flashcard/quiz rendering.
8. Add Countries content and wire it into the shared flashcard/quiz rendering.
9. Add local progress, favorites, and last-session persistence across all skills.
10. Add tests and final polish for responsiveness/accessibility.

## Assumptions and Defaults

- Use Next.js App Router rather than Pages Router.
- Use manual in-repo JSON content rather than a CMS or external API.
- Keep flags and other visuals as local static assets.
- English only.
- No backend, auth, analytics dashboard, or monetization in v1.
- Countries content should be curated to stay age-appropriate and concise even if the full world country list is included.
- Mixed-skill sessions are the default interaction model; dedicated per-skill pages are not required in v1.
- The first saved planning document should be created at `docs/implementation-plan.md`.
