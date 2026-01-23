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
