# Kudumbam · Family Register

A private address book for an extended family across Tamil Nadu and Kerala. Names, homes, phone numbers and how everyone is related — kept current by the people themselves.

Live directory searchable by name, area, pincode and relation, a map of homes, a family tree derived from one canonical set of relations, and a **Kinship Circle** that places every relative at their real bearing and distance from a chosen person.

## What it does

- **Realtime register** — search by name, Tamil name, spouse, phone, area or pincode; filter by state, district, area, pincode, relation and claim status; sortable columns.
- **Kinship Circle** (`/circle`) — rings at 5 / 10 / 25 / 50 km, relatives placed by bearing and distance, nearest-first list, relation filter.
- **Family tree** (`/tree`) — generations, couple grouping, sibling branches, cycle warnings.
- **Map** (`/map`) — every pinned home, restyled markers, popups linking to records and the circle.
- **Member portal** (`/me`) — a claimed member edits their own address and contacts; pincode lookup fills district/state/area; Google Maps URL or browser location sets coordinates.
- **WhatsApp** — one-tap click-to-chat from every record; saved changes build a ready-to-send message. No Cloud API, no server.
- **History and notifications** — every address change is appended to a per-member log and announced in-app to the family and the admin.
- **Admin desk** (`/admin`) — invite links, claim status, announcements, review queue for ambiguous legacy relations, change log. One-time migration tool at `/admin/migrate`.

## Roles

| Role | How | Can do |
|---|---|---|
| Admin | Google sign-in, plus an `admins/{uid}` document | Everything |
| Member | Anonymous sign-in, then claims one record through a single-use invite | Read the directory; edit only their own address and contacts |
| Visitor | No auth | Sees `/login` and `/join` only |

Invite codes are 128-bit random values, valid for 7 days, usable once. A claim is one atomic transaction: update the invite, create the access document, create the user document. The rules validate every write, so a partial claim cannot happen.

## Setup

Requires Node 20+ and a Firebase project (Spark plan is enough).

1. **Install**

   ```bash
   npm install
   cp .env.example .env.local
   ```

2. **Firebase console → Authentication**
   - Enable **Anonymous** and **Google**.
   - Authentication → Settings → Authorized domains: add `localhost` and your production domain.

3. **Environment** — fill the six `NEXT_PUBLIC_FIREBASE_*` values in `.env.local` from Project settings → Your apps. These are public; access is controlled entirely by `firestore.rules`.

4. **Deploy rules and indexes**

   ```bash
   npx firebase-tools login
   npm run deploy:rules
   ```

   The project id is already set in `.firebaserc`.

5. **Bootstrap the first admin**
   - `npm run dev`, open `http://localhost:3000/login`, sign in with Google.
   - You will see "not an admin" — that is expected.
   - In Firebase console → Authentication → Users, copy your UID.
   - In Firestore, create `admins/{uid}` with any field (for example `{ createdBy: "console" }`).
   - Reload `/login`. You are now the admin.

6. **First records** — add members from `/address-book`. Invite each person from `/admin`: copy the join link or send it through WhatsApp. They open `/join?code=…`, confirm "This is me", land on `/me`, and can keep their address current.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm test` | Unit tests (vitest, pure functions only) |
| `npm run deploy:rules` | Deploy Firestore rules and indexes |
| `npm run emulate` | Firestore + Auth emulators with UI (needs a Java runtime) |

## Data model

```
familyMembers/{id}          identity — admin writes only
addresses/{id}              mutable contact data — admin, or the member who owns the record
familyMembers/{id}/access/{uid}   created only by a valid claim
familyMembers/{id}/history/{id}   append-only address log
invites/{code}              128-bit code, open → used, 7-day expiry
users/{uid}                 { memberId, role: "member" } — the claimed gate
notifications/{id}          toMemberId: member id, "admin" or "family"
relations/{id}              { a, b, kind: parent | spouse | sibling }
```

`relations` is the single source of truth for the tree. Deterministic ids (`a_parent_b`, and sorted `a_b_kind` for symmetric kinds) make duplicate edges impossible. Legacy `children[]` arrays and the old `relations` documents are converted once by `/admin/migrate`, which shows a dry-run preview before writing.

## Tests

```bash
npm test
```

Covers tree derivation and cycle detection, legacy relation mapping, circle placement and ring boundaries, register search/filters, phone normalization, distance/bearing, Google Maps link parsing, WhatsApp link encoding, birthday/anniversary reminders, address/relative-time formatting, address/identity schema validation, and pincode validation/lookup. Rules are not unit-tested; they are the security boundary and should be exercised in the emulator or a staging project after changes.

## Deliberate limits

- **No server.** Spark plan only: no push notifications, email or SMS. Reminders and notifications appear when someone opens the app.
- **Claimed members see all phone numbers.** This is a private family register; the alternative (separate projection document with admin-only phone numbers) was rejected as complexity without a real benefit here.
- **Clearing browser storage spends the invite.** Anonymous sign-in has no recovery. The admin re-issues a link from `/admin`.
- **Pincode data** is an extract of all 3,436 Tamil Nadu and Kerala pincodes in `public/data/pincodes.json`, sourced from the India Post directory via [India-Pincode-Lookup](https://github.com/mithunsasidharan/India-Pincode-Lookup) and lazy-loaded on first use. Some Tamil Nadu districts use pre-2019 boundaries (for example Kanchipuram instead of Chengalpattu); the district field can always be changed by hand. Unknown pincodes are accepted as free text.
- **Light theme only.** The paper-and-ink identity is the design, not a setting.
- **In-app browsers** (WhatsApp, Instagram) may block Google sign-in. Only the member claim runs there, and it uses anonymous sign-in, which works. Admins should use a full browser.

## Stack

Next.js 15 (App Router) · React 19 · Tailwind CSS · Firebase Auth + Firestore (client SDK) · Leaflet · zod + react-hook-form · vitest · Bricolage Grotesque, Hanken Grotesk, IBM Plex Mono, Noto Sans Tamil.
