# CCC181 Week 10: CampusConnect Mobile-First Login Page

React + TypeScript starter for the Week 10 group activity. The page is already
built. Your group's job is the **mobile-first CSS** and the **GitHub teamwork**.

## Run it

```bash
npm install
npm run dev          # open the local URL it prints
npm run dev:phone    # same, but your phone (same Wi-Fi) can open the Network URL
npm run build        # must finish with no errors before you submit
```

## Rules

- Edit only the CSS files in `src/styles/` (one member = one file). Do not edit `reset.css`.
- Plain CSS only. No Tailwind, Bootstrap, Material UI, styled-components, or any UI library.
- Phone styles first (no media query), then `min-width` queries only. Never `max-width`.
- Do not edit the `.tsx` files or rename classes. If you must, tell the group first.

## Group information (fill in)

| Item | Your answer |
| --- | --- |
| Group number | 4 |
| Section | IT3-B |
| Repository URL | https://github.com/tangapagyandave-sudo/ccc181-week10-group4 |

## Members (each member fills in their own row in their own commit)

| Member | Name | GitHub username | CSS file | What I did |
| --- | --- | --- | --- | --- |
| 1 (leader) | Tangapa, Gyan Dave B. | tangapagyandave-sudo | `base.css` | Wrote `src/styles/base.css` using a mobile-first approach, in 3 breakpoints: basic mobile layout with Flexbox and a 1-column login layout, adjusted spacing and padding from 768px, a 2-column layout with visible brand perks from 1024px, and a centered 1200px container from 1280px. Also reviewed the `nav.css` pull request. |
| 2 | Kent T. Baloyos | Itsken-the-average | `nav.css` | Wrote src/styles/nav.css (Flexbox + Grid) using a mobile-first approach, in 3 commits: phone layout with a stacked navbar, 48px (3rem) links and a 1-column footer grid, brand left with links in one row from 768px, and a 3-column footer from 1024px. Reviewed the base.css pull request. |
| 3 | Gervy J. Rosario | gervy121404 | `form.css` | Wrote src/styles/form.css (Flexbox) using a mobile-first approach, in 4 commits: phone layout with stacked 48px (3rem) fields and buttons, side-by-side checkbox row and buttons from 768px, and roomier card from 1024px. Reviewed the nav.css pull request. |

## Experiment 0: the page without the viewport tag

What did the page look like in DevTools phone mode **before** adding the viewport meta tag?
What changed **after** adding it?

> Before adding the viewport tag: The page looked zoomed out and appeared smaller in DevTools phone mode, making the text and elements difficult to read.

After adding the viewport tag: The page adjusted to the phone's actual screen width, making the content properly sized and easier to view.

## DevTools test results

| Width | What must be true | Pass? |
| --- | --- | --- |
| 360 px | 1 column. Nav links stacked and 48px tall. Options and buttons stacked. Footer in 1 column. No sideways scrollbar. | Pass |
| 768 px | Nav in one row (brand left, links right). Checkbox and link in one row. Two buttons side by side. | Pass |
| 1024 px | Brand panel and login card side by side. Footer in 3 columns. Heading is larger. | Pass |
| 1280 px | Content centered and stops at 1200px. | Pass |

### Breakpoints I observed

Using **Show media queries** and dragging slowly from 360 px to 1280 px, the layout changed at these exact widths:


nav.css
>The layout changed at 768 px, 1024 px, and 1280 px. At 768 px, the navigation became horizontal with the brand on the left and the links in one row, the container side padding grew to 2rem, the checkbox and “Forgot password?” appeared side by side, and the two bottom buttons formed a row. The login card also became centered with a maximum width of 32rem. At 1024 px, the brand panel and login card formed two columns, the footer changed to three columns, and the welcome heading became larger (2.5rem) with the extra list visible. The login card also got roomier padding (2.5rem). At 1280 px, the content became centered with a maximum width of 1200 px. No broken layouts or horizontal scrolling appeared at the tested widths between 360 px and 1280 px.

form.css
> The layout changed at 768 px, 1024 px, and 1280 px. At 768 px, the navigation became horizontal, the checkbox and “Forgot password?” appeared side by side, and the two bottom buttons formed a row. At 1024 px, the brand panel and login card formed two columns, the footer changed to three columns, and the welcome heading became larger with the extra list visible. At 1280 px, the content became centered with a maximum width of 1200 px. No broken layouts or horizontal scrolling appeared at the tested widths between 360 px and 1280 px.

base.css
> The layout changed at 768px, 1024px, and 1280px. At 768px, the container side padding increased to 2rem, and the brand panel gained more padding. At 1024px, the login layout changed into two columns, the brand panel became left-aligned, the welcome heading increased to 2.5rem, and the perks section became visible. At 1280px, the container was limited to 1200px and centered. No broken layouts or horizontal scrolling were observed between 360px and 1280px.

Screenshots are in `screenshots/` as `360.png`, `768.png`, `1024.png`, `1280.png`.

## What our group learned (leader writes this last)

> Our group learned how to create a responsive, mobile-first website using CSS Flexbox, Grid, and media queries. We also learned the importance of testing different screen sizes, using GitHub for collaboration, and making sure the layout works properly on mobile phones, tablets, and desktops.


## How to run?

backend
> # Part 2: Express backend login

## How to run

You need two terminals open at the same time.

**Terminal 1: backend (folder `server`)**

```bash
cd server
npm install
copy .env.example .env
npm start
```

You should see `API running on http://localhost:3000`.

**Terminal 2: front end (project root)**

```bash
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. The health check is http://localhost:3000/api/v1/health and must return `{"status":"ok"}`.

The real `.env` files are never committed. Only the two `.env.example` files (with fake values) are in the repo.

## API summary

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/v1/health` | 200 `{"status":"ok"}` | none |
| POST | `/api/v1/sessions` | 200 `{token, user}` | 400 missing fields, 401 `Invalid email or password.` |
| GET | `/api/v1/users/me` | 200 user (needs `Authorization: Bearer <token>`) | 401 `Not logged in.` |

Other answers: unknown route is 404 `{"error":"Not found."}`, a crash is 500 `{"error":"Something went wrong."}`. Full details are in `docs/API-SPEC.md`. The Postman collection is in `docs/postman/CampusConnect.postman_collection.json`.

**Demo account:** `student@campusconnect.test` / `Campus26` (name: Demo Student)

## Who did what (Part 2)

| Member | Name | GitHub | What I did in Part 2 |
|---|---|---|---|
| 1 | Gyan Dave B. Tangapa | tangapagyandave-sudo | Set up `server/` (Express, dotenv, CORS, JSON). Built `POST /api/v1/sessions` with validation, bcryptjs password check, 1-hour JWT and the hashed demo user. |
| 2 | Kent T. Baloyos | Built `GET /api/v1/users/me` with the token middleware, the 404 and 500 handlers, `docs/API-SPEC.md` (with the events design), the Postman collection and the Postman screenshots. Reviewed the Member 1 pull request. |
