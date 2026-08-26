<div align="center">

<img src="public/tibid-logo.png" alt="TIBID Community" width="360" />

### Inspired by waves 🌊

**The TIBID Community website** — a portfolio for the community, a calendar of weekly activities,
a registration system with Google Sheets sync, and an organiser dashboard.

</div>

---

## What this is

A single Next.js application that does five things:

| | |
|---|---|
| 🌊 **Portfolio** | Animated one-page story of who TIBID is, what the community does, and moments from past sessions. |
| 📅 **Activity calendar** | Running, volleyball, yoga, hiking and horse riding — each with location, an embedded Google Map, timing, price and difficulty. |
| ✍️ **Registration** | The full TIBID sign-up form, modelled on the existing JotForm, with waitlists and duplicate protection. |
| 👤 **Member profiles** | Sign up once; every future registration pre-fills itself. Sessions last 30 days via an httpOnly cookie. |
| 🛠️ **Admin dashboard** | Create, publish and duplicate activities; see and export everyone who opted in; check people in on the day. |

Registrations are written to Postgres **and** appended to your Google Sheet in the same request.

---

## Stack

Everything here is on a free tier.

- **[Next.js 16](https://nextjs.org)** (App Router, React 19, TypeScript) — deployed on Vercel
- **[Neon Postgres](https://neon.tech)** via the Vercel Marketplace — free tier
- **[Drizzle ORM](https://orm.drizzle.team)** — typed queries and migrations
- **[Tailwind CSS v4](https://tailwindcss.com)** — design tokens live in one file
- **[Motion](https://motion.dev)** — the animations
- **[jose](https://github.com/panva/jose)** — JWT sessions and Google service-account signing
- Passwords hashed with Node's built-in `scrypt` — no native modules, no extra dependency

No paid services. No Google Maps API key required (there's an optional upgrade path).

---

## Deploy it (about 10 minutes)

### 1. Import the repo into Vercel

Go to [vercel.com/new](https://vercel.com/new), pick **`shaikho/Tibid`**, and click **Import**.
Don't deploy yet — add the database first.

### 2. Add the database

In your new Vercel project: **Storage → Create Database → Neon → Continue**, pick the free plan,
and **Connect** it to the project.

Vercel injects `DATABASE_URL` automatically. You never copy a connection string.

### 3. Set the environment variables

**Settings → Environment Variables.** Two are required:

| Variable | Value |
|---|---|
| `AUTH_SECRET` | A long random string. Generate one: `openssl rand -base64 32` |
| `ADMIN_EMAILS` | Your email. Anyone signing up with an address in this comma-separated list becomes an admin automatically. |

Recommended:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your final URL, e.g. `https://tibid.vercel.app` — used for social share cards |
| `NEXT_PUBLIC_TIKTOK_URL` | Your TikTok profile URL (the footer icon only appears once this is set) |

### 4. Deploy, then create the tables

Hit **Deploy**. Once it's live, create the schema by running this once from your own machine:

```bash
git clone https://github.com/shaikho/Tibid.git && cd Tibid
npm install
cp .env.example .env.local          # paste your Neon connection string into DATABASE_URL
npm run db:push                     # creates every table
```

> Prefer not to run anything locally? Open the **Neon dashboard → SQL Editor**, paste the contents
> of [`drizzle/0000_init.sql`](drizzle/0000_init.sql), and run it. Same result.

### 5. Create your admin account

Visit `https://your-site.vercel.app/signup` and sign up with the email you put in `ADMIN_EMAILS`.
You'll land on your profile with an **Admin dashboard** link in the menu.

That's it — you're live. Google Sheets is optional and can be added any time.

---

## Google Sheets sync

Every registration is appended to a sheet of your choosing, as it happens. Until you set this up
the site works completely normally — rows are just kept in the database only, and can be
back-filled later with one click.

**1. Create a service account**

- Open [Google Cloud Console](https://console.cloud.google.com/) and create a project (or reuse one)
- **APIs & Services → Library →** search *Google Sheets API* → **Enable**
- **APIs & Services → Credentials → Create credentials → Service account** — any name will do
- Open the new service account → **Keys → Add key → Create new key → JSON** → download it

**2. Share your sheet with it**

Open the JSON file and find `client_email` (it looks like `tibid-sheets@your-project.iam.gserviceaccount.com`).
Open your registrations spreadsheet, click **Share**, paste that email, and give it **Editor**.

> This step is the one people miss. The service account is a separate identity — it cannot see
> your sheet until you share it, and you'll get a `403` if you skip it.

**3. Add four environment variables in Vercel**

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="tibid-sheets@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="1AbC...the long id in your sheet's URL..."
GOOGLE_SHEET_TAB="Registrations"
```

For `GOOGLE_PRIVATE_KEY`, copy the `private_key` value out of the JSON **exactly as it appears**,
including the `\n` escape sequences, wrapped in double quotes.

The sheet ID is the part between `/d/` and `/edit`:

```
https://docs.google.com/spreadsheets/d/1AbC...THIS PART...xyz/edit
                                        └────────────────┘
```

Make sure the tab is actually named `Registrations` (or change `GOOGLE_SHEET_TAB` to match).

**4. Redeploy and check**

Go to **/admin/settings**. You'll see a green *Connected* light and the name of the sheet it
found. The header row is written automatically. Hit **Sync pending rows** to back-fill anything
that came in before you switched it on.

### How failures are handled

A sign-up never fails because Google is slow or misconfigured. If the append errors, the
registration is still saved, the row is flagged *not synced*, and the error is stored so you can
see it in the admin. **Sync pending rows** is safe to run as many times as you like.

---

## Making someone else an admin

Add their email to `ADMIN_EMAILS` in Vercel *before* they sign up. To promote an account that
already exists, run this in the Neon SQL editor:

```sql
UPDATE users SET role = 'admin' WHERE lower(email) = 'their@email.com';
```

---

## Running it locally

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET
npm run db:push                # create the tables
npm run db:seed                # optional: an admin + 5 sample activities + gallery
npm run dev                    # http://localhost:3000
```

`npm run db:seed` prints the admin credentials it created. Change that password from `/profile`
straight away if the database isn't purely local.

The database layer picks its driver from `DATABASE_URL`: a `*.neon.tech` host uses Neon's
serverless HTTP driver, anything else uses `node-postgres`. So a local Postgres, Docker, Supabase
or a self-hosted instance all work with no config change.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:push` | Push the schema to the database |
| `npm run db:generate` | Generate a new SQL migration after editing the schema |
| `npm run db:seed` | Seed an admin, sample activities and gallery items |

---

## Using the admin dashboard

**Creating an activity** — `/admin/activities/new`. Pick one of the five categories and the
sign-up question pre-fills with sensible defaults for that sport (running offers
*Running / Walking / A bit of both*, yoga offers experience levels, and so on). You can change
them, or clear the answer options to drop the question entirely.

**The map pin** — open Google Maps, drop or tap the pin, press **Share**, and paste the link.
Short `maps.app.goo.gl` links work. A live preview appears under the field as soon as you paste,
so you can confirm you've got the right spot before publishing.

**Publishing** — activities start as drafts. Nobody can see or register for a draft; you can still
preview it yourself. Toggle **Publish** when it's ready.

**Weekly repeats** — **Duplicate for next week** copies everything, moves it forward seven days,
and saves it as a draft. Adjust and publish.

**Capacity** — leave it blank for unlimited. Once a capacity is reached, further sign-ups
automatically go to a waitlist rather than being rejected; you can promote people from the
registrations table.

**On the day** — open the activity and tick people off in the leftmost column to check them in.
The table is searchable by name, email and phone.

**Exports** — every registrations view has an **Export CSV** button. Files are UTF-8 with a BOM so
Arabic names and emoji open correctly in Excel, and cells beginning with `=` are neutralised
against spreadsheet formula injection.

**Privacy** — the public attendee list shows first names and a last initial only
(*"Layla H."*). Phone numbers, email addresses, emergency contacts and health notes are visible to
admins only, always. You can also hide the attendee list entirely per activity.

---

## Changing the look

Every colour, font and radius is a token at the top of
[`src/app/globals.css`](src/app/globals.css):

```css
@theme {
  --color-brand: #006bd4;   /* sampled from the TIBID logo */
  --color-deep:  #041e3a;
  --color-foam:  #b9e5fb;
  /* … */
}
```

Change those values and the whole site re-skins — nothing hardcodes a hex outside this block
except the per-category accent colours in
[`src/lib/constants.ts`](src/lib/constants.ts), which is also where the category names, blurbs and
default sign-up questions live.

Text on the homepage (the statement, the four values, section headings) is in
`src/lib/constants.ts` and `src/components/home/sections.tsx`.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx                    Homepage — hero, story, categories, stats, gallery
│   ├── activities/                 Public calendar + activity detail & registration
│   ├── admin/                      Organiser dashboard (guarded by middleware + server checks)
│   ├── login/  signup/  profile/   Member accounts
│   └── api/
│       ├── admin/export/           CSV exports
│       └── auth/logout/
├── components/
│   ├── activities/                 Cards, map panel, registration form, attendee list
│   ├── admin/                      Activity form, registrations table, Sheets panel
│   ├── home/                       Hero and homepage sections
│   ├── site/                       Nav, footer, logo
│   └── ui/                         Form primitives, reveal animations, waves
├── db/
│   ├── schema.ts                   Drizzle schema — users, activities, registrations, gallery
│   └── index.ts                    Driver selection + lazy connection
├── lib/
│   ├── actions/                    Server actions (auth, activities, registrations)
│   ├── auth.ts  session.ts  password.ts
│   ├── google-sheets.ts            Service-account JWT → Sheets API v4 append
│   ├── maps.ts                     Google Maps link → embeddable URL
│   ├── queries.ts                  Read queries
│   ├── validation.ts               Zod schemas
│   └── constants.ts                Categories, difficulties, site copy
└── middleware.ts                   Edge guard for /admin and /profile
```

---

## Security notes

- Passwords use `scrypt` with a per-user random salt and constant-time comparison.
- Sessions are signed JWTs in an `httpOnly`, `sameSite=lax`, `secure` cookie. `AUTH_SECRET` must be
  at least 32 characters; rotating it signs everyone out.
- `/admin` is protected twice: in edge middleware (so nobody sees a flash of the layout) and again
  inside every admin page and server action via `requireAdmin()`. The middleware alone is never
  the only check.
- Health notes and contact details are never sent to the client on public pages — the public
  attendee query selects a narrow set of columns rather than filtering after the fact.
- CSV exports are admin-only and return `403` otherwise.
- All user input is validated server-side with Zod; client-side `required` attributes are
  convenience only.

---

<div align="center">

Built for **[@tibidcommunity](https://www.instagram.com/tibidcommunity/)** · Dubai 🌊

*All levels welcome — always.*

</div>
