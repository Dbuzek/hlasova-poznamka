# CLAUDE.md – hlasova-poznamka

## Project Overview

**hlasova-poznamka** (Czech for "Voice Note") is a single-page Progressive Web App (PWA) for voice-to-text transcription with AI-powered text editing. The entire application lives in a single `index.html` file with embedded CSS and JavaScript.

**Language:** Czech – all UI text, comments, and variable names follow Czech conventions.

---

## Repository Structure

```
hlasova-poznamka/
├── index.html       # Entire app: HTML markup + embedded CSS + embedded JavaScript (~1,100 lines)
├── sw.js            # Service Worker for offline support and static asset caching
├── manifest.json    # PWA manifest (app name, icons, display mode, theme colours)
├── icon-192.png     # PWA launcher icon (192×192)
├── icon-512.png     # PWA launcher icon (512×512)
└── LICENSE          # Mozilla Public License 2.0
```

There is no build tool, bundler, or package manager. Deployment is serving these static files directly.

---

## Technology Stack

| Layer | Technology |
|---|---|
| UI | Vanilla HTML5 / CSS3 / JavaScript (no frameworks) |
| Audio capture | Web Audio API (`MediaRecorder`, `AudioContext`, `AnalyserNode`) |
| Transcription | OpenAI Whisper API (`whisper-1`) |
| Text editing | OpenAI Chat Completions API (`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`) |
| Persistence | Browser `localStorage` |
| Offline support | Service Worker (cache-first for static assets) |

No npm/yarn/pip dependencies exist. The app uses only browser-native APIs and the OpenAI REST API.

---

## Application Architecture

The application is self-contained in `index.html`. The JavaScript is organised with section comments (`// ── Section Name ──`) in this order:

| Section | Purpose |
|---|---|
| State | Global mutable variables (`mediaRecorder`, `audioChunks`, `isRecording`, etc.) |
| Waveform bars | 28 animated `<div>` bars for real-time audio visualisation |
| Settings | `openSettings()` / `saveSettings()` – localStorage-backed config modal |
| UI helpers | Step indicator, status messages, error display |
| Waveform animation | `drawWave()` loop using `AnalyserNode` frequency data |
| Record toggle | `toggleRecord()` / `startRecording()` / `stopRecording()` |
| Process audio | Orchestrates transcription → edit → display pipeline |
| OpenAI Whisper | `transcribe(blob)` – sends audio to Whisper, returns raw text |
| OpenAI GPT-4o | `editText(raw)` – sends raw transcript to chat completions, returns polished text |
| Cost calculation | `calcCost()` – computes USD cost from token/minute usage |
| History storage | `saveToHistory(entry)` / `loadHistory()` – localStorage JSON array (max 50) |
| History UI | `renderHistory()` – renders history panel with copy/delete actions |
| Tabs | Switches between "Upravený text" (edited) and "Přepis" (raw transcript) tabs |
| Clipboard | `copyToClipboard()` / `copyHistoryEntry()` |
| Reset | Clears current result and returns to idle state |
| Init | Event listeners and initial render on `DOMContentLoaded` |
| Service Worker | Registers `sw.js` |

---

## Core User Workflow

1. **Record** – User clicks the microphone button; `startRecording()` captures audio via `MediaRecorder` with a live waveform visualisation and running timer.
2. **Transcribe** – `stopRecording()` triggers `transcribe(blob)` which POSTs the audio blob to `https://api.openai.com/v1/audio/transcriptions` (Whisper, language `cs`).
3. **Edit** – Raw transcript is sent to `editText(raw)` which calls `gpt-4o` (or the user-selected model) with a configurable system prompt to polish the text.
4. **Display** – The result card shows both the edited and raw text in tabs, auto-copies to clipboard, updates cost, and saves to history.

---

## State Management

All state is managed as plain global JavaScript variables scoped to the `<script>` block:

- **In-memory:** `mediaRecorder`, `audioChunks`, `isRecording`, `timerInterval`, `animFrameId`, `stream`, `audioCtx`, `analyser`
- **Persistent (localStorage keys):**

| Key | Type | Purpose |
|---|---|---|
| `oa_key` | string | OpenAI API key |
| `oa_model` | string | Selected GPT model |
| `oa_prompt` | string | System prompt for text editing |
| `oa_history` | JSON array | Past transcription entries (max 50) |

---

## Design Tokens (CSS Custom Properties)

All colours and sizing use CSS variables defined in `:root`:

```css
--bg: #0f1117          /* Page background */
--surface: #181c27     /* Card/modal surface */
--border: #262c3d      /* Border colour */
--accent: #c8a96e      /* Primary accent (tan/gold) */
--accent2: #7eb8f7     /* Secondary accent (light blue) */
--text: #e8e4dc        /* Body text */
--danger: #e06c75      /* Error / destructive actions */
--radius: 14px         /* Default border radius */
--font-serif: 'DM Serif Display'
--font-mono: 'DM Mono'
```

Always use these variables for new styles rather than hardcoded values.

---

## Naming Conventions

- **HTML IDs:** camelCase (e.g., `recordBtn`, `historyPanel`, `resultCard`)
- **CSS classes:** kebab-case (e.g., `record-area`, `result-card`, `history-entry`)
- **JavaScript:** camelCase for variables and functions (e.g., `audioChunks`, `saveToHistory`)
- **Section delimiters:** `// ── Section Name ──` (em-dash style)

---

## API Cost Model

Token/minute costs are hardcoded in `calcCost()`:

| Service | Rate |
|---|---|
| Whisper | $0.006 / minute |
| GPT-4o input | $2.50 / 1M tokens |
| GPT-4o output | $10.00 / 1M tokens |
| GPT-4o mini input | $0.15 / 1M tokens |
| GPT-4o mini output | $0.60 / 1M tokens |
| GPT-4 Turbo input | $10.00 / 1M tokens |
| GPT-4 Turbo output | $30.00 / 1M tokens |

These rates should be updated when OpenAI pricing changes.

---

## Service Worker

`sw.js` caches static assets under the key `hlasova-poznamka-v2`:

- **Cache-first** for: `index.html`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`
- **Network-only** for: all `https://api.openai.com/` requests
- Old cache versions are deleted automatically on `activate`

When adding new static assets, add them to the `STATIC_ASSETS` array in `sw.js`. When making breaking changes, bump the cache version.

---

## Development Workflow

### Running locally

No build step required. Serve the files with any static HTTP server, for example:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in a browser that supports `getUserMedia` (requires HTTPS or localhost).

### Making changes

All application code lives in `index.html`. Edit it directly. The sections are clearly delimited by `// ── … ──` comments, so navigate to the relevant section before making changes.

### Testing

There is no automated test suite. Manual testing steps:

1. Open the app in a browser with a valid OpenAI API key configured.
2. Record a short voice note (10–30 seconds).
3. Verify the transcription and edited text appear correctly.
4. Verify cost is calculated and the entry appears in history.
5. Confirm the PWA can be installed and works offline (for static assets).

### Committing

Follow conventional, descriptive commit messages. The existing history uses Czech for feature descriptions (e.g., `Přidat historii přepisů a sledování nákladů na tokeny`). English is also acceptable.

---

## Security Notes

- The OpenAI API key is stored in **plain-text in `localStorage`** – this is intentional for a personal-use tool but means it must not be deployed publicly.
- Audio is processed entirely in the browser before being sent to OpenAI; no audio is stored server-side by this app.
- There is no authentication layer – the app is designed for local or single-user deployment only.

---

## Key Constraints for AI Assistants

1. **Do not introduce a build tool or bundler** unless explicitly requested – the zero-dependency, single-file approach is intentional.
2. **Do not split `index.html` into separate JS/CSS files** without explicit instruction.
3. **Preserve the `// ── Section ──` delimiter style** when adding new code sections.
4. **Use CSS custom properties** for all new colours and sizing.
5. **Czech UI text** – any new user-facing strings should be in Czech.
6. **No server-side code** – this is a fully static, client-side application.
7. **Keep history cap at 50 entries** when modifying history logic unless asked to change it.
8. **Bump `sw.js` cache version** (`hlasova-poznamka-vN`) whenever static assets change.
