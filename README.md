# verify.clubs.hackclub.com

identity verification for hack club club leaders. after a leader submits the
"apply - leader profile" fillout form, they're redirected here with their
fillout submission id. this app runs them through hack club auth (oidc),
reads their `verification_status`, and upserts the result into an airtable
`idv_results` table — or lets them opt out.

## flow

| route | purpose |
| --- | --- |
| `/` | landing. two choices: i'm new here, or i already have an account. plus an opt-out link. |
| `/new-account` | for new leaders. sends them to hack club auth signup (opens in a new tab), then back here to finish. |
| `/auth/redirect` | builds a signed hmac state and redirects to the oidc authorize endpoint. |
| `/auth/callback` | verifies state (hmac + freshness), exchanges the code, reads `verification_status`, discards all tokens, upserts `verified` into `idv_results` (keyed on `submission_id`), redirects to `/done`. |
| `/opt-out` | confirmation page. confirming marks `opted_out`, deletes the linked clubs record, and redirects to `/removed`. |
| `/done` | verified. auto-redirects to the application form after 3s. |
| `/removed` | opt-out confirmed. the application was deleted, so there's no redirect back to the form. |
| `/error?reason=not_verified` | "not verified yet" with a try again button. |
| `/error` | generic error with a correlation id. |

## security model

- **no token persistence.** access / refresh / id tokens are read once for the
  `verification_status` claim and dropped when the handler returns. nothing is
  stored or logged.
- **`verification_status` comes straight from the validated id token claims** —
  no separate `/api/v1/me` call.
- **`id` is validated on every route** against `^[A-Za-z0-9-]{10,100}$`.
  `middleware.ts` rejects bad ids on page routes with `400`.
- **the state param** is hmac-sha256 signed with `STATE_SECRET` and carries
  `{ submissionId, nonce, timestamp }`. the callback verifies the signature
  (constant-time) and rejects anything older than 10 minutes before any work.
- **all airtable calls are server-side only.** no secret reaches the client.
- **rate limiting** on `/auth/callback` and `/api/opt-out` via
  `rate-limiter-flexible` (in-memory, per instance).

## setup

1. `cp .env.example .env.local` and fill in every value. generate the state
   secret with `openssl rand -hex 32`.
2. **airtable — manual one-time step:** in the Clubs base:
   - create a table named **`idv_results`** with a single-line-text field
     **`submission_id`** and a single-select field **`idv_status`** with the
     options `verified` and `opted_out`. `/auth/callback` upserts into this
     table, keyed on `submission_id`.
   - on the **leaders** table, add a single-select field named **`idv_status`**
     with the options `pending`, `verified`, and `opted_out`. the opt-out flow
     still writes `opted_out` here.
3. register `HACKCLUB_OAUTH_REDIRECT_URI`
   (e.g. `https://verify.clubs.hackclub.com/auth/callback`) with hack club auth.
4. `npm install`
5. `npm run dev` (or `npm run build && npm start`)

## environment variables

| var | description |
| --- | --- |
| `HACKCLUB_OAUTH_CLIENT_ID` | oidc client id |
| `HACKCLUB_OAUTH_CLIENT_SECRET` | oidc client secret |
| `HACKCLUB_OAUTH_REDIRECT_URI` | must exactly match the registered callback url |
| `STATE_SECRET` | high-entropy secret for hmac state signing |
| `AIRTABLE_API_KEY` | airtable pat with read+write on the base |
| `CLUB_APPLICATION_FORM_URL` | fillout form url leaders return to from `/done` |

## notes

- light css animations live in `app/globals.css`: a fade-and-rise on page load,
  soft hover lifts on the buttons, and a small tilt on the hero emoji on hover.
  all of it backs off under `prefers-reduced-motion`.
- phantom sans is loaded in `app/globals.css` via hack club's canonical cdn
  `@font-face` blocks. swap them if you have specific font files to ship.
- emoji are real svgs from [mutant standard](https://mutant.tech), in
  `public/emojis/`.
# clubs-verify
