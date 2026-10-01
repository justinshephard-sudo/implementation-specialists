/* Quote builder view: pick services → live price, quote card, quote email → create the Asana card in Quote Sent. */
(function () {
  "use strict";
  const IS = window.IS;
  const { $, esc, money, fmtDate } = IS;
  let busy = false;

  const Q = (IS.quote = {});

  Q.init = function () {
    buildCsms(); buildCatalog(); render();
  };

  function buildCsms() {
    const sel = $("csm");
    const csms = IS.config.csms || [];
    sel.innerHTML = '<option value="">Select CSM…</option>' + csms.map((c) => `<option value="${esc(c.email)}">${esc(c.name)}</option>`).join("");
    const me = csms.find((c) => c.email === (IS.user.email || "").toLowerCase());
    if (me) sel.value = me.email;
  }

  function buildCatalog() {
    const catEl = $("catalog");
    catEl.innerHTML = "";
    IS.config.catalog.forEach((c) => {
      const box = document.createElement("div");
      box.className = "cat";
      box.innerHTML = `<div class="cat-head"><h3>${esc(c.cat)}</h3><span class="cat-sum" id="sum_${c.key}"></span></div>` +
        c.items.map((it) => `
          <div class="item" id="row_${it.id}">
            <div><div class="name">${esc(it.name)}</div><div class="unit">${money(it.price)} ${esc(it.unit)}</div></div>
            <div class="stepper">
              <button type="button" aria-label="Fewer ${esc(it.name)}" data-step="-1" data-id="${it.id}">−</button>
              <input type="number" min="0" step="1" value="0" id="q_${it.id}" aria-label="${esc(it.name)} quantity">
              <button type="button" aria-label="More ${esc(it.name)}" data-step="1" data-id="${it.id}">+</button>
            </div>
            <div class="amt" id="a_${it.id}">—</div>
          </div>`).join("") +
        `<div class="details" id="det_${c.key}" hidden>
          <div class="dlabel">${esc(c.cat)} details</div>
          <div class="fields">
            <label class="f full">What it does (shown on the quote)<input type="text" id="s_${c.key}" placeholder="One line for the quote email"></label>
            ${c.details.map((d) => d.type === "check"
              ? `<label class="check full"><input type="checkbox" id="d_${c.key}_${d.id}"> ${esc(d.label)}</label>`
              : `<label class="f">${esc(d.label)}<input type="text" id="d_${c.key}_${d.id}"></label>`).join("")}
          </div>
          ${c.key === "train" ? `<div class="note warn" id="trainWarn" hidden>Training calls are a last resort. Offer one only after the customer has watched the walkthrough video.</div>` : ""}
        </div>`;
      catEl.appendChild(box);
    });
  }

  function readState() {
    const lines = [];
    IS.config.catalog.forEach((c) => c.items.forEach((it) => {
      const q = Math.max(0, parseInt($("q_" + it.id).value, 10) || 0);
      if (q > 0) lines.push(Object.assign({}, it, { key: c.key, qty: q, amount: q * it.price, what: $("s_" + c.key).value.trim() }));
    }));
    const list = lines.reduce((s, l) => s + l.amount, 0);
    const waived = $("waived").checked;
    return { lines, list, waived, total: waived ? 0 : list,
      firm: $("firm").value.trim(), firmId: $("firmId").value.trim(), dmName: $("dmName").value.trim(), dmEmail: $("dmEmail").value.trim(),
      csmEmail: $("csm").value, pa: $("pa").value, notes: $("notes").value.trim(), needBy: $("needBy").value, files: $("files").value.trim() };
  }

  const validUntil = () => new Date(Date.now() + (IS.config.quoteValidDays || 30) * 864e5);

  function render() {
    if (!IS.config) return;
    const s = readState();
    const today = new Date();
    IS.config.catalog.forEach((c) => {
      let catTotal = 0, any = false;
      c.items.forEach((it) => {
        const q = Math.max(0, parseInt($("q_" + it.id).value, 10) || 0);
        $("row_" + it.id).classList.toggle("on", q > 0);
        $("a_" + it.id).textContent = q > 0 ? money(q * it.price) : "—";
        catTotal += q * it.price; if (q > 0) any = true;
      });
      $("sum_" + c.key).textContent = any ? money(catTotal) : "";
      $("det_" + c.key).hidden = !any;
    });
    const watched = $("d_train_watched");
    if ($("trainWarn")) $("trainWarn").hidden = watched.checked;

    $("tItems").textContent = s.lines.reduce((n, l) => n + l.qty, 0);
    $("tList").textContent = money(s.list);
    $("tTotal").textContent = money(s.total);

    const min = IS.config.minOrder || 0;
    const flags = [];
    if (s.waived && s.list > 0) flags.push(`<span class="pill info">Waived · ${money(s.list)} list value recorded</span>`);
    if (!s.waived && s.list > 0 && s.list < min) flags.push(`<span class="pill warn">Below the proposed ${money(min)} minimum order</span>`);
    if (!s.waived && s.list >= min && s.list > 0) flags.push(`<span class="pill ok">Meets ${money(min)} minimum</span>`);
    if (s.lines.some((l) => l.key === "train") && watched && !watched.checked) flags.push(`<span class="pill warn">Training call before video watched</span>`);
    $("flags").innerHTML = flags.join("");
    $("validCap").textContent = "Valid until " + fmtDate(validUntil());

    const rows = s.lines.map((l) => `<tr>
        <td><div>${esc(l.name)}${l.qty > 1 ? ` × ${l.qty}` : ""}</div>${l.what ? `<div class="what">${esc(l.what)}</div>` : ""}</td>
        <td class="r mono">${money(l.amount)}</td></tr>`).join("");
    $("paper").innerHTML = `
      <div class="ph">
        <div><img class="brand-logo" src="assets/lawmatics-logo.svg" alt="Lawmatics" width="132" height="22"><div class="doc">Services quote</div></div>
        <div class="qno">${s.firmId ? "Q-" + today.toISOString().slice(2, 10).replace(/-/g, "") + "-" + esc(s.firmId) : "Quote"}<br>${fmtDate(today)}</div>
      </div>
      <div class="meta">
        <div><div class="k">Prepared for</div><div class="v">${esc(s.firm || "Firm name")}${s.firmId ? ` <span style="color:var(--paper-muted)">#${esc(s.firmId)}</span>` : ""}</div></div>
        <div><div class="k">Attention</div><div class="v">${esc(s.dmName || "Decision-maker")}</div></div>
        <div><div class="k">Valid until</div><div class="v">${fmtDate(validUntil())}</div></div>
        <div><div class="k">Delivery</div><div class="v">14+ days after payment</div></div>
      </div>
      ${s.lines.length ? `<table><thead><tr><th>Item</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="tot"><span class="lab">Total</span><span class="val">${money(s.total)}</span></div>
        ${s.waived ? `<div class="waived">Waived by your Customer Success Manager (list value ${money(s.list)})</div>` : ""}`
        : `<div class="empty">Add a service to build the quote.</div>`}
      <ul class="terms">
        <li>${s.waived ? "No charge for this request." : "Billed in full once you approve."} Payments are non-refundable once work has begun.</li>
        <li>Includes a short walkthrough video and one round of revisions.</li>
        <li>Anything not listed is quoted separately.</li>
        <li>To approve, reply "Approved" to the quote email.</li>
      </ul>`;
    if (!$("emailPanel").hidden) $("emailText").textContent = buildEmail(s);
  }

  function buildEmail(s) {
    const items = s.lines.map((l) => `• ${l.name}${l.qty > 1 ? ` (×${l.qty})` : ""}: ${l.what || "[what it does]"}: ${money(l.amount)}`).join("\n");
    const totalLine = s.waived
      ? `Total: $0. This work has been waived (list value ${money(s.list)}).`
      : `Total: ${money(s.total)}, billed in full once you approve.`;
    return `Subject: Your Lawmatics services quote: ${s.firm || "[Firm name]"}

Hi ${s.dmName ? s.dmName.split(" ")[0] : "[Name]"},

Here's the quote for the work you requested:

${items || "• [Item]: [what it does]: $[price]"}

${totalLine}

Your build will be delivered at least 14 days after payment, along with a short video showing how to use it. One round of revisions is included. Anything not listed above would be quoted separately. Payments are non-refundable once work has begun.

To approve, reply "Approved" to this email. This quote is valid for ${IS.config.quoteValidDays || 30} days (until ${fmtDate(validUntil())}).`;
  }

  function toast(msg) { const t = $("toast"); t.textContent = msg; clearTimeout(toast._t); if (msg) toast._t = setTimeout(() => (t.textContent = ""), 5000); }
  function toastErr(msg) { clearTimeout(toast._t); $("toast").innerHTML = `<span class="err">${esc(msg)}</span>`; }

  function validate(s) {
    const problems = [];
    const mark = (id, bad) => $(id).classList.toggle("invalid", bad);
    mark("firm", !s.firm); if (!s.firm) problems.push("firm name");
    const idOk = /^\d+$/.test(s.firmId); mark("firmId", !idOk); if (!idOk) problems.push("a numeric Firm ID");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.dmEmail); mark("dmEmail", !emailOk); if (!emailOk) problems.push("the decision-maker's email");
    if (!s.lines.length) problems.push("at least one service");
    return problems;
  }

  function payload(s) {
    const summaries = {}, details = {};
    IS.config.catalog.forEach((c) => {
      if (!s.lines.some((l) => l.key === c.key)) return;
      summaries[c.key] = $("s_" + c.key).value.trim();
      details[c.key] = {};
      c.details.forEach((d) => {
        const el = $(`d_${c.key}_${d.id}`);
        details[c.key][d.id] = d.type === "check" ? el.checked : el.value.trim();
      });
    });
    return { firm: s.firm, firmId: s.firmId, dmName: s.dmName, dmEmail: s.dmEmail, csmEmail: s.csmEmail,
      practiceArea: s.pa, notes: s.notes, needBy: s.needBy, files: s.files, waived: s.waived,
      lines: s.lines.map((l) => ({ id: l.id, qty: l.qty })), summaries, details };
  }

  function resetForm() {
    $("qform").reset();
    document.querySelectorAll("#qform .invalid").forEach((el) => el.classList.remove("invalid"));
    $("success").hidden = true; $("emailPanel").hidden = true; toast("");
    buildCsms(); render();
    window.scrollTo({ top: 0 });
  }

  Q.wire = function () {
    $("catalog").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-step]");
      if (!b) return;
      const inp = $("q_" + b.dataset.id);
      inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + parseInt(b.dataset.step, 10));
      render();
    });
    $("qform").addEventListener("input", render);
    $("hideEmail").addEventListener("click", () => { $("emailPanel").hidden = true; });

    $("copyBtn").addEventListener("click", () => {
      const text = buildEmail(readState());
      $("emailPanel").hidden = false; $("emailText").textContent = text;
      const fallback = () => {
        const r = document.createRange(); r.selectNodeContents($("emailText"));
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        toast("Couldn't copy automatically. The email text is selected below; press Ctrl/⌘ + C.");
      };
      try { navigator.clipboard.writeText(text).then(() => toast("Quote email copied. Paste it into your email and cc the CSM."), fallback); }
      catch (e) { fallback(); }
    });

    $("qform").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const s = readState();
      const problems = validate(s);
      if (problems.length) { toastErr("Add " + problems.join(", ") + " before creating the card."); return; }
      busy = true; $("createBtn").disabled = true; toast("Creating the Asana card…");
      try {
        const res = await IS.api("createRequest", { request: payload(s) });
        toast("");
        $("success").hidden = false;
        $("success").innerHTML = `<strong>Card created in Quote Sent.</strong>
          <span>${esc(res.task.name)} · ${esc(res.quoteId)}</span>
          ${res.task.url && res.task.url !== "#" ? `<a href="${esc(res.task.url)}" target="_blank" rel="noopener">Open in Asana ↗</a>` : "<span>(Test mode: nothing was written to Asana.)</span>"}
          <span><button class="linkbtn" type="button" id="viewOnBoard">See it on the Builds board</button> · <button class="linkbtn" type="button" id="newQuote">Start a new quote</button></span>`;
        $("newQuote").addEventListener("click", resetForm);
        $("viewOnBoard").addEventListener("click", () => { resetForm(); IS.showTab("builds"); IS.board.load(true); });
        IS.board.markStale();
      } catch (err) {
        toastErr("The card wasn't created: " + err.message);
      } finally {
        busy = false; $("createBtn").disabled = false;
      }
    });
  };
})();
