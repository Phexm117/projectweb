# Copilot / AI Agent Instructions for projectweb

A compact, actionable guide for AI agents working on this repository.

## Quick summary
- Simple Express (v5) server rendering EJS templates. Start with `node app.js`.
- Views live in `views/` (EJS files); static files in `public/` (CSS, images).
- Routes are defined inline in `app.js` and render templates directly.

## How the app is structured (big picture)
- `app.js`: single-file routing and server bootstrap. Example routes: `/`, `/home`, `/recommended`, `/favorites`, `/login`, `/signup`, `/admin` which call `res.render('<template>')` for templates in `views/`.
- `views/*.ejs`: server-side templates (EJS). Edit these to change UI markup.
- `public/`: static assets; `public/style.css` is the main stylesheet.
- `package.json`: lists `express` and `ejs` as direct dependencies; project uses CommonJS (`"type": "commonjs"`).

## Developer workflows & commands
- Install dependencies: `npm install`.
- Run locally: `node app.js` (server listens on port 3000).
- There are no tests or build steps in `package.json`.

## Project-specific conventions and patterns
- Routing done inline in `app.js` — to add a page, add an `app.get('/path', (req,res)=>res.render('template'))` and create `views/template.ejs`.
- Keep view filenames lowercase and match the names used in `res.render(...)` (e.g., `user_home.ejs`).
- Static assets must be placed in `public/` and referenced from templates by relative paths (server uses `express.static('public')`).
- No database, sessions, or external services are present in the codebase — assume ephemeral server state unless new integrations are added.

## Integration points & external deps
- Direct deps: `express`, `ejs` (see `package.json`). No other external integrations in source.

## Examples (actionable edits)
- Add a new page:
  1. Add route to `app.js`: `app.get('/about', (req,res)=>res.render('about'));`
  2. Create `views/about.ejs`.
- Change CSS: edit `public/style.css` and reload the page.

## Things AI agents should watch for
- Do not assume routers/controllers exist elsewhere — `app.js` is authoritative for routes.
- Preserve `app.set('views', './views')` and `app.use(express.static('public'))` unless intentionally refactoring.
- Be conservative modifying `package.json->type` (CommonJS) — changing module type affects require/import semantics.

## When to ask the human
- If a change needs persistent storage, request guidance about preferred DB or session strategy.
- If adding automated tests or build scripts, confirm preferred test runner and CI conventions.

Please review and tell me which parts should be expanded or clarified.
