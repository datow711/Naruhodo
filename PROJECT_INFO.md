# Naruhodo Project Info

Last updated: 2026-06-20

This file records the current repository baseline for future development. Treat it as the first stop before changing product behavior, API usage, UI conventions, or deployment settings.

## 1. Project Summary

Naruhodo is a React + Vite single-page web app for Japanese sentence understanding.

The current app lets a user enter a Japanese sentence, or text in another language. If the input is not detected as Japanese, the app first asks Gemini to translate it into Japanese, then asks Gemini to analyze the Japanese sentence linguistically.

The UI displays:

- Whole-sentence Traditional Chinese translation
- Tokenized Japanese sentence
- Furigana-style readings for kanji tokens
- Token tooltip details on hover
- Part-of-speech color coding
- JLPT level badges
- Short Traditional Chinese grammar explanations
- Conjugation forms when Gemini returns them

## 2. Current Tech Stack

- Runtime: browser-only frontend app
- Framework: React 19
- Build tool: Vite
- Language: JavaScript with JSX
- Styling: plain CSS using design tokens in `src/index.css`
- AI SDK: `@google/genai`
- Deployment target: GitHub Pages
- Package manager: npm, with `package-lock.json`

Important package scripts:

```bash
npm ci
npm run dev
npm run build
npm run lint
npm run preview
```

Current local note: dependencies were not installed at the time this document was created, so `npm run build` failed because `vite` was unavailable. Run `npm ci` before validating build or lint.

## 3. Repository Structure

```text
.
+-- .github/workflows/deploy.yml
+-- public/
+-- src/
|   +-- assets/
|   |   +-- hero.png
|   |   +-- react.svg
|   |   +-- vite.svg
|   +-- App.css
|   +-- App.jsx
|   +-- gemini.js
|   +-- index.css
|   +-- main.jsx
+-- DESIGN.md
+-- README.md
+-- eslint.config.js
+-- index.html
+-- logotemp.png
+-- package-lock.json
+-- package.json
+-- vite.config.js
```

Key files:

- `src/main.jsx`: React entry point. Mounts `<App />` into `#root`.
- `src/App.jsx`: Main UI, state management, input handling, settings modal, token viewer, tooltip rendering.
- `src/gemini.js`: Gemini API integration, response schema, compressed response key mapping, translation and analysis functions.
- `src/index.css`: Active design tokens and app-level CSS utility/component classes.
- `src/App.css`: Mostly leftover Vite/template styles. It is not imported by the current app.
- `DESIGN.md`: Design-token reference inspired by Mistral AI visual language.
- `vite.config.js`: Sets GitHub Pages base path to `/Naruhodo/`.
- `.github/workflows/deploy.yml`: Builds and deploys `dist` to GitHub Pages on pushes to `master`.

## 4. Product Flow

Primary user flow:

1. User enters text in the input field.
2. User clicks `Analyze` or presses Enter.
3. If no Gemini API key exists in local settings, the settings modal opens.
4. App checks whether the input contains Japanese kana.
5. If the input is not Japanese, `translateToJapanese()` converts it to Japanese.
6. `analyzeSentence()` sends the Japanese sentence to Gemini with a structured JSON schema.
7. The app renders the sentence translation and token viewer.
8. Hovering each token opens a tooltip with detailed token information.

Japanese detection currently checks only kana:

```js
/[\u3040-\u309f\u30a0-\u30ff\uff65-\uff9f]/
```

This means a kanji-only Japanese phrase may be treated as non-Japanese and sent through translation first.

## 5. Gemini Integration

`src/gemini.js` exports:

- `POS_MAP`: Numeric part-of-speech labels.
- `CONJ_MAP`: Numeric conjugation-form labels.
- `translateToJapanese(text, apiKey, modelName)`: Converts non-Japanese input into Japanese.
- `analyzeSentence(sentence, apiKey, modelName)`: Requests structured linguistic analysis.

The analysis response uses compressed keys to reduce output size:

| Key | Meaning |
|---|---|
| `st` | Whole sentence Traditional Chinese translation |
| `ts` | Token array |
| `t` | Japanese token |
| `p` | Part-of-speech code |
| `jl` | JLPT level code, `0` for none, `1` to `5` for N1 to N5 |
| `r` | Hiragana reading |
| `tr` | Short Traditional Chinese meaning |
| `ex` | Brief Traditional Chinese grammar explanation |
| `c` | Optional conjugation object |
| `c.cf` | Current conjugation form code |
| `c.f` | Map of conjugation code to word form |

The app stores user settings in browser `localStorage`:

- `gemini_api_key`
- `gemini_model_name`

Security implication: the Gemini API key is stored client-side and used directly from the browser. This is suitable for local/personal use, but should be reconsidered before broader public deployment.

## 6. UI And Design Baseline

The active visual system is implemented in `src/index.css`.

Current design direction:

- Warm cream background
- Orange primary action color
- White/cream cards
- Dark settings button
- Thin sunset-gradient footer stripe on desktop
- Compact mobile header
- Token colors by part-of-speech code
- Tooltips styled as feature cards

Important CSS tokens:

- `--color-primary: #fa520f`
- `--color-cream: #fff8e0`
- `--color-canvas: #ffffff`
- `--color-ink: #1f1f1f`
- `--rounded-md: 8px`
- `--rounded-lg: 12px`

`DESIGN.md` documents a broader Mistral-inspired token system. The implemented app uses only a subset of it.

## 7. Deployment

GitHub Pages is configured through `.github/workflows/deploy.yml`.

Deployment behavior:

- Trigger: push to `master`
- Runner: Ubuntu latest
- Node: 20
- Install: `npm ci`
- Build: `npm run build`
- Artifact path: `./dist`
- Deployment action: `actions/deploy-pages@v4`

Vite base path:

```js
base: '/Naruhodo/'
```

Keep this base path unless the GitHub Pages URL or repository name changes.

## 8. Development Checks

Recommended before code changes:

```bash
git status --short --branch
npm ci
npm run lint
npm run build
```

Useful focused checks:

```bash
node --check src/gemini.js
```

`src/App.jsx` contains JSX, so `node --check` is not enough for that file. Use Vite build or ESLint after dependencies are installed.

## 9. Known Issues And Risks

Current notable issues:

- `README.md` is still the default React + Vite template README and does not describe Naruhodo.
- Dependencies were not installed locally when this file was created.
- Several Traditional Chinese labels, comments, prompts, and map values appear as mojibake in `src/App.jsx`, `src/gemini.js`, and `DESIGN.md`.
- API key storage is client-side only.
- The model selector contains hard-coded model names in the UI. Validate availability before relying on them.
- The app uses inline styles heavily in `App.jsx`, which may make future UI work harder to maintain.
- `src/App.css` appears to be unused template CSS.
- `logotemp.png` is used directly from the repo root by `App.jsx`.
- No automated tests currently exist.
- There is no environment-variable based configuration for the Gemini API key.
- There is no backend or proxy layer, so rate limiting, API key protection, and request logging are not centralized.

Potential product behavior issue:

- Japanese detection only checks kana. Kanji-only input may incorrectly be treated as non-Japanese.

## 10. Suggested Next Development Priorities

Recommended near-term order:

1. Install dependencies and confirm `npm run lint` / `npm run build`.
2. Fix or restore mojibake Traditional Chinese/Japanese labels and prompts.
3. Replace template `README.md` with Naruhodo-specific setup and product notes.
4. Decide whether the app is personal-use only or public-facing.
5. If public-facing, move Gemini calls behind a backend or serverless proxy.
6. Clean unused template files and assets.
7. Refactor inline style-heavy UI into reusable components only where it reduces repeated complexity.
8. Improve Japanese detection to include kanji and punctuation-aware heuristics.
9. Add basic tests around response parsing, Japanese detection, and fallback handling.

## 11. Working Conventions For Future Agents

Before making changes:

- Read this file.
- Check `git status --short --branch`.
- Inspect the relevant source file before editing.
- Do not assume `README.md` is accurate until it is rewritten.
- Preserve the GitHub Pages base path unless deployment target changes.
- Be careful with Traditional Chinese and Japanese text encoding.

When changing Gemini behavior:

- Keep the compressed response-key contract synchronized between `gemini.js` and `App.jsx`.
- Update this file if response keys, schema, storage keys, or model choices change.
- Test with at least one Japanese input and one non-Japanese input.

When changing UI:

- Prefer existing tokens in `src/index.css`.
- Keep buttons at 8px radius and cards at 12px radius unless the design direction is intentionally changed.
- Check mobile layout, especially the header and settings button.

