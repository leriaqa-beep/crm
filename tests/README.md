# CRM functional tests

End-to-end tests for `../index.html` powered by [Playwright](https://playwright.dev).
Everything runs against a headless Chromium; no login, no external network,
no data ever touches the user's real browser or GitHub Pages deployment.

## Layout

```
tests/
├── package.json           # deps + npm scripts
├── playwright.config.js   # test runner + local static server config
├── e2e/                   # test specs (one file per feature area)
│   ├── helpers.js         # shared utilities: seed data, open client, etc.
│   ├── 00-smoke.spec.js
│   ├── 01-clients-crud.spec.js
│   ├── 02-contacts-notes.spec.js       # regression: "не добавляется контакт/заметка"
│   ├── 03-jtbd.spec.js                 # JTBD tab autosave + no-stale-data
│   ├── 04-search.spec.js               # debounced search filter
│   ├── 05-columns.spec.js              # add / reorder kanban columns
│   ├── 06-stage-chips.spec.js          # auto-chip on stage move
│   ├── 07-storage-safety.spec.js       # quota-safe writes (lsSet())
│   ├── 08-backups.spec.js              # version restore
│   └── 09-files.spec.js                # file attachments
├── playwright-report/     # HTML report (generated after run)
└── test-results/          # traces / screenshots on failure (generated)
```

## Quick start

```bash
cd tests
npm install
npm run install-browsers   # first time only — pulls Chromium (~170MB)
npm test
```

To debug interactively:

```bash
npm run test:headed        # visible browser
npm run test:ui            # Playwright UI mode with time-travel debugging
```

Open the HTML report after a run:

```bash
npm run test:report
```

## How it works

- **`playwright.config.js`** starts `python3 -m http.server 8123` in the repo root
  (parent directory) before the suite runs, and stops it after. The tests hit
  `http://localhost:8123/index.html`.
- **`helpers.js → openCRM(page, {seed})`** clears localStorage on every test and
  optionally seeds `crm_v4` (clients), `crm_stages`, `crm_backups`, etc. before
  the page loads. This makes every test hermetic and independent.
- Tests run **serial** (`workers: 1`) because the app assumes one browser tab.

## Running on a future backend server

When the CRM moves off localStorage to a proper backend, the *shape* of these
tests won't need to change — only the seed layer:

- Replace `helpers.js → openCRM({seed})` implementation with API calls that
  set the same state on the server (`POST /clients`, etc.), or a per-test test
  database and `truncate` between tests.
- Everything else — the DOM assertions, click flows, reload checks — stays
  identical.

Set `CRM_TEST_PORT=8080` (or any port) to change the local server port used
by the static-file variant.

## What is covered

| Area | Spec |
|---|---|
| App boots, default stages, header counters | 00-smoke |
| Add a client, edit name persists | 01-clients-crud |
| Add / edit / delete contact person, add note, survive reload | 02-contacts-notes |
| JTBD tab autosaves; no stale data across client switch | 03-jtbd |
| Search filters by name/company; debounce; clear button | 04-search |
| Add new stage; arrow-button reorder remaps client stage indexes | 05-columns |
| Auto-chip appended on stage move; no duplicate chip | 06-stage-chips |
| Quota-exceeded writes never abort the caller; one-shot alert | 07-storage-safety |
| Backup modal opens; restore replaces clients | 08-backups |
| Upload file → stored + rendered; delete file removes it | 09-files |

## What is NOT covered (yet)

- Telegram send-to-colleague (needs network stub for `api.telegram.org`).
- Voice recordings (IndexedDB blob store + audio metadata).
- Print / export flows.
- Drag-and-drop card between columns (Playwright's synthetic drag is flaky
  for HTML5 native drag; the arrow-button reorder is tested instead).

Add specs to `e2e/` and they're picked up automatically.
