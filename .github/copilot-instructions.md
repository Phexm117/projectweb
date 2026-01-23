<<<<<<< HEAD
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
=======
# AI Copilot Instructions for ProjectWeb

## Architecture Overview

This is a **server-rendered Express.js web application** using EJS templating. The architecture is deliberately simple with no database or external APIs—all routes serve pre-rendered EJS templates from the `views/` directory.

### Key Structure
- **Backend**: [app.js](../app.js) - Single entry point with 7 GET routes (no POST/database logic yet)
- **Frontend**: [views/](../views/) - EJS templates rendered server-side (landing, user_home, recommended, favorites, login, signup, admin)
- **Styling**: [public/style.css](../public/style.css) - Shared CSS with navbar, cards, and utility classes (note: uses `#2f6f62` green theme)
- **Dependencies**: Express 5.2.1, EJS 4.0.1 only (minimal stack)

### Critical Detail
The app assumes:
- `app.set("views", "./views")` and `app.use(express.static("public"))` are already configured
- All routes are stateless GET handlers with no session/auth logic implemented
- EJS templates should NOT assume any passed data objects (they're rendered with `res.render("name")` with no params)

## Development Workflow

**Start the app:**
```
node app.js
```
Server runs on `http://localhost:3000`

**Common tasks:**
- Adding a route: Add `app.get("/path", (req, res) => { res.render("template_name"); });` to [app.js](../app.js)
- Creating a new page: Create a `.ejs` file in `views/` matching the route name
- Styling pages: Add CSS classes to [public/style.css](../public/style.css) (uses semantic class names like `.navbar`, `.card`, `.btn`)
- Testing routes: Navigate in browser or use curl (no automated tests yet)

## Project Conventions

### View Structure
- Each route maps to a single EJS file: `/home` → `views/user_home.ejs`
- Views share navbar styles via `public/style.css`
- No layout inheritance (no parent templates yet)—copy navbar structure across views as needed

### CSS Patterns
- Color scheme: Primary green `#2f6f62`, neutral grays `#333`, `#ddd`, white `#ffffff`
- Responsive: Uses flexbox for navbar/layouts, padding follows `6px 24px` pattern
- Class naming: `.navbar`, `.navbar-brand`, `.nav-link`, `.card`, `.btn`, `.active`, `.disabled`
- No CSS preprocessor (plain CSS only)

### Naming Conventions
- Route names match view file names: `/recommended` → `recommended.ejs`
- CSS class names are lowercase with hyphens: `.nav-link`, `.navbar-brand`
- No underscore-to-hyphen conversions needed in this codebase

## Integration Points & Known Limitations

**No external integrations yet:**
- No database (all routes render static templates)
- No authentication/authorization logic
- No form handling or POST routes
- No API calls or third-party services

**Next logical additions when expanding:**
1. Form handling: Add POST routes with `express.urlencoded()` middleware
2. Session management: Integrate session middleware before routing
3. Database: Add connection pool and models (would need new `models/` directory)
4. Auth flows: `/login` and `/signup` currently only render templates—no actual auth logic

## Common Modifications

- **Change port**: Modify the `3000` in `app.listen(3000, ...)` [app.js](../app.js#L31)
- **Add middleware**: Insert `app.use(...)` calls before route definitions [app.js](../app.js#L6-L7)
- **Update navbar across all views**: Edit the navbar HTML in one template, then copy to others (or refactor to EJS includes if DRY needed)
- **Adjust colors**: Search `#2f6f62` in [public/style.css](../public/style.css) for theme updates

## Code Style Notes

- Thai language comments appear in [app.js](../app.js#L4-L5) (hints about view location and static files)
- No linting rules configured (package.json has no ESLint/Prettier)
- CommonJS modules only (no ES6 imports—`require()` pattern)
- Template literals and arrow functions are safe for Node 14+
>>>>>>> 62f51cd566a38004b11077cd7234f176d359537b
