# Implementation Specialists

Internal web app for the Lawmatics implementation specialist team. **Additional Services**: the Builds board (every request by stage, revenue totals, edits, subtasks and comments that write to Asana) plus the quote builder (New quote tab).

```
index.html + assets/  →  GitHub Pages (static, Google sign-in, no secrets, no prices)
API (private repo implementation-specialists-api) → Apps Script web app: verifies the Google ID token,
                      holds the Asana token, serves the price list after sign-in
                      →  Asana "Additional Services" project (1219076839641531)
```

## Local testing
`python3 -m http.server 8141` then open `http://localhost:8141/?mock=1` (sample prices and data, no sign-in, no Asana writes).

## API
The Apps Script backend lives in the private repo `implementation-specialists-api` (setup steps in its README). Put its `/exec` URL in `assets/config.js` → `API_URL`.

## Google sign-in
Uses the Merlin Engage OAuth client (Internal). Add the site origin to its Authorized JavaScript origins.

## Stages
Quote Sent → Paid / Ready to assign → In Build → Review Video Sent → In Revisions → Signed Off / Closed
