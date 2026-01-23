# AI Agent Instructions for ProjectWeb

## Project Overview
ProjectWeb is a simple Express.js web application serving multiple pages via EJS templates. It's a server-side rendered application with no database or backend complexity—just routing and view rendering.

**Key Stack:** Express 5.2.1, EJS 4.0.1, CommonJS, static CSS.

## Architecture & Key Concepts

### Route Structure
- **Single entry point:** [app.js](app.js) defines all routes (/, /home, /recommended, /favorites, /login, /signup, /admin)
- **Routes are simple:** Each GET route renders a corresponding EJS template via `res.render()`
- **No middleware complexity:** Static files served from `public/`; view engine is EJS pointing to `views/` directory
- **View-controller mapping:** Route path → template file (e.g., `/login` → `login.ejs`)

### Directory Layout
- **[app.js](app.js)** — Main Express server; all routing logic lives here
- **[views/](views/)** — EJS templates; each file corresponds to a route
- **[public/](public/)** — Static assets; currently only `style.css` (shared styles across all pages)
- **[package.json](package.json)** — Dependencies and CommonJS configuration

## Development Conventions

### When Adding Routes
1. Add route handler in [app.js](app.js) following existing pattern: `app.get("/path", (req, res) => { res.render("template"); });`
2. Create corresponding EJS template in `views/{template}.ejs`
3. Link stylesheets in the EJS template or use global `style.css`

### When Modifying Views
- All view files are in [views/](views/) as `.ejs` files
- Shared branding colors: `#2f6f62` (navbar brand color used in [style.css](public/style.css))
- Navbar structure is consistent—reference existing templates for structure
- No template inheritance framework; manually include navigation in each page if needed

### Static Assets
- Global styles in [public/style.css](public/style.css)
- No CSS preprocessing; vanilla CSS only
- Static files served from `public/` automatically via Express

## Running & Debugging
- **Start server:** `npm start` (uses `app.js` as entry point)
- **Server port:** 3000 (hardcoded in [app.js](app.js) line 29)
- **Test route:** Visit `http://localhost:3000` to verify app is running
- **No test suite:** `test` script in [package.json](package.json) is a placeholder

## Critical Implementation Details
- **Views directory path:** Hardcoded as `./views` in [app.js](app.js); do not change relative paths
- **CommonJS required:** Project uses `require()`, not ES modules
- **No request validation:** Routes don't validate input; add validation before expanding features
- **No session/auth logic:** Login/signup routes are static pages only—no actual authentication implemented

## Patterns to Follow
- Keep route logic simple; complex logic belongs in separate modules (not yet needed)
- EJS templates should be self-contained; avoid complex business logic in views
- CSS classes follow BEM-like naming: `.navbar`, `.navbar-brand`, etc.
- All routes currently read-only (GET only); POST handling would require middleware setup

## Common Tasks
- **Add a new page:** Create template in `views/{name}.ejs`, add route in [app.js](app.js)
- **Update styles:** Modify [style.css](public/style.css) or create component-specific CSS file in `public/`
- **Debug routing:** Check [app.js](app.js) for correct template name spelling; EJS errors appear in server console
