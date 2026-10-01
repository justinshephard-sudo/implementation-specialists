/* Starts the app: tabs, config load, then the Builds board. */
(function () {
  "use strict";
  const IS = window.IS;
  const { $ } = IS;
  const TABS = ["builds", "quote"];

  IS.showTab = function (name) {
    TABS.forEach((t) => {
      $("tab-" + t).setAttribute("aria-selected", String(t === name));
      $("view-" + t).hidden = t !== name;
    });
    const isBuilds = name === "builds";
    $("pageTitle").textContent = isBuilds ? "Current builds" : "New quote";
    $("pageSub").textContent = isBuilds
      ? "Every Additional Services request, by stage. Click a card to update it."
      : "Pick the services, send the quote email, then create the card. It lands in Quote Sent.";
    $("summary").hidden = !isBuilds;
    if (isBuilds && IS.board.stale && IS.config) IS.board.load(true);
    try { history.replaceState(null, "", location.pathname + location.search + (name === "quote" ? "#quote" : "")); } catch (e) { /* ignore */ }
  };

  IS.start = async function () {
    $("gate").hidden = true; $("app").hidden = false;
    $("whoName").textContent = IS.user.name;
    $("avatar").textContent = IS.initials(IS.user.name);
    $("board").innerHTML = '<div class="state">Loading builds…</div>';
    try {
      IS.config = (await IS.api("getConfig")).config;
    } catch (e) {
      $("board").innerHTML = `<div class="state"><span class="err">Couldn't load settings: ${IS.esc(e.message)}</span></div>`;
      return;
    }
    IS.quote.init();
    IS.showTab(location.hash === "#quote" ? "quote" : "builds");
    if (location.hash === "#quote") IS.board.load(false);
  };

  TABS.forEach((t) => $("tab-" + t).addEventListener("click", () => IS.showTab(t)));
  $("signOut").addEventListener("click", () => IS.signOut());
  IS.quote.wire();
  IS.board.wire();

  if (IS.MOCK) {
    $("mockBar").hidden = false;
    IS.user = { name: "Test User", email: "test@lawmatics.com" };
    IS.start();
  } else {
    IS.resumeOrSignIn();
  }
})();
