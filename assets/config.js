// Public settings — safe to commit. Secrets (Asana token) live only in Apps Script.
window.APP_CONFIG = {
  // Same Internal OAuth client as the Merlin Engage dashboard. Add this site's origin to its
  // "Authorized JavaScript origins": https://justinshephard-sudo.github.io
  CLIENT_ID: "1056458394718-fk8r113mqg2f55a9il4d4kg2a745d3ns.apps.googleusercontent.com",
  ALLOWED_DOMAIN: "lawmatics.com",
  // Apps Script web app URL (Deploy → Manage deployments → Web app URL, ends in /exec)
  API_URL: "",
};
