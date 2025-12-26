const $ = (id) => document.getElementById(id);

const STATE_KEY = "crash_cart_state_v2";
const HISTORY_KEY = "crash_cart_history_v2";
const MAX_HISTORY = 50;

// ---------- utils ----------
function safeText(v){ return (v ?? "").toString().replace(/\s+/g," ").trim(); }

function fmtISOToLocal(d){
  if(!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if(Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}

function nowStamp(){
  const dt = new Date();
  return dt.toISOString();
}

function prettyStamp(iso){
  try{
    const dt = new Date(iso);
    return dt.toLocaleString();
  }catch{
    return iso;
  }
}

function getBaseUrl(){
  // GitHub Pages-safe. Keeps current path.
  const u = new URL(window.location.href);
  u.hash = "";
  // keep existing search, we overwrite later
  return u.origin + u.pathname;
}

function encodeParams(obj){
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k,v]) => {
    const val = safeText(v);
    if(val) p.set(k, val);
  });
  return p.toString();
}

function downloadFile(filename, text){
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------- state ----------
function readStateFromInputs(){
  return {
    cartId: safeText($("cartId").value),
    location: safeText($("location").value),

    firstSupply: safeText($("firstSupply").value),
    expireDate: $("expireDate").value || "",
    checkDate: $("checkDate").value || "",
    tech: safeText($("tech").value),

    medExpire: safeText($("medExpire").value),
    medDrug: safeText($("medDrug").value),
    medLock: safeText($("medLock").value),
    medDate: $("medDate").value || "",
    medInit: safeText($("medInit").value),
  };
}

function writeStateToInputs(s){
  if(!s) return;
  if($("cartId")) $("cartId").value = s.cartId || "";
  if($("location")) $("location").value = s.location || "";

  $("firstSupply").value = s.firstSupply || "";
  $("expireDate").value = s.expireDate || "";
  $("checkDate").value = s.checkDate || "";
  $("tech").value = s.tech || "";

  $("medExpire").value = s.medExpire || "";
  $("medDrug").value = s.medDrug || "";
  $("medLock").value = s.medLock || "";
  $("medDate").value = s.medDate || "";
  $("medInit").value = s.medInit || "";
}

function saveState(s){
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
  flashStatus("Saved");
}

function loadState(){
  try{
    return JSON.parse(localStorage.getItem(STATE_KEY) || "null");
  }catch{
    return null;
  }
}

// ---------- render stickers ----------
function render(s){
  // Yellow
  $("sFirstSupply").textContent = s.firstSupply || "—";
  $("sExpireDate").textContent = fmtISOToLocal(s.expireDate);
  $("sCheckDate").textContent = fmtISOToLocal(s.checkDate);
  $("sTech").textContent = s.tech || "—";

  $("sCartId").textContent = s.cartId || "—";
  $("sLocation").textContent = s.location || "—";

  // Orange
  $("mExpire").textContent = s.medExpire || "—";
  $("mDrug").textContent = s.medDrug || "—";
  $("mLock").textContent = s.medLock || "—";
  $("mDate").textContent = fmtISOToLocal(s.medDate);
  $("mInit").textContent = s.medInit || "—";

  $("mCartId").textContent = s.cartId || "—";
  $("mLocation").textContent = s.location || "—";

  // QR
  renderQR(s);
}

let statusTimer = null;
function flashStatus(t){
  $("status").textContent = t;
  if(statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(()=> $("status").textContent = "Saved", 900);
}

// ---------- QR ----------
function buildShareLink(s){
  const base = getBaseUrl();
  const params = encodeParams({
    cartId: s.cartId,
    location: s.location,
    firstSupply: s.firstSupply,
    expireDate: s.expireDate,
    checkDate: s.checkDate,
    tech: s.tech,
    medExpire: s.medExpire,
    medDrug: s.medDrug,
    medLock: s.medLock,
    medDate: s.medDate,
    medInit: s.medInit,
  });
  return params ? `${base}?${params}` : base;
}

function renderQR(s){
  const link = buildShareLink(s);
  $("qrUrl").textContent = link;

  // Uses Google Chart QR endpoint (simple + works on GitHub Pages).
  // If you want fully offline QR later, we can embed a tiny QR library.
  const qr = `https://chart.googleapis.com/chart?cht=qr&chs=360x360&chld=M|0&chl=${encodeURIComponent(link)}`;
  $("qrImg").src = qr;
}

async function copyLink(){
  const link = $("qrUrl").textContent || "";
  if(!link || link === "—") return;
  try{
    await navigator.clipboard.writeText(link);
    $("logStatus").textContent = "Link copied ✅";
  }catch{
    $("logStatus").textContent = "Copy blocked (iOS) — press & hold link to copy";
  }
  setTimeout(()=> $("logStatus").textContent = "—", 1500);
}

// ---------- history ----------
function loadHistory(){
  try{
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }catch{
    return [];
  }
}

function saveHistory(arr){
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
}

function addHistoryEntry(state){
  const entry = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    ts: nowStamp(),
    state: {...state},
  };

  const hist = loadHistory();
  hist.unshift(entry);
  const trimmed = hist.slice(0, MAX_HISTORY);
  saveHistory(trimmed);

  $("logStatus").textContent = `Logged ✅ (${prettyStamp(entry.ts)})`;
  setTimeout(()=> $("logStatus").textContent = "—", 2000);

  renderHistory();
}

function renderHistory(){
  const hist = loadHistory();
  const wrap = $("historyList");
  wrap.innerHTML = "";

  if(!hist.length){
    wrap.innerHTML = `<div class="hint">No history yet. Tap “Log Update (Audit)” when you complete a cart check.</div>`;
    return;
  }

  hist.forEach(entry => {
    const s = entry.state || {};
    const title = `${s.cartId || "Cart"} • ${s.location || "Location"}`;
    const tech = s.tech ? `Tech: ${s.tech}` : (s.medInit ? `Initials: ${s.medInit}` : "—");
    const meta =
      `Supply: ${s.firstSupply || "—"} | Supply Exp: ${s.expireDate ? fmtISOToLocal(s.expireDate) : "—"} | ` +
      `Drug: ${s.medDrug || "—"} | Drug Exp: ${s.medExpire || "—"} | Lock: ${s.medLock || "—"} | ${tech}`;

    const div = document.createElement("div");
    div.className = "hist-item";
    div.innerHTML = `
      <div class="hist-top">
        <div class="hist-title">${escapeHtml(title)}</div>
        <div class="hist-time">${escapeHtml(prettyStamp(entry.ts))}</div>
      </div>
      <div class="hist-meta">${escapeHtml(meta)}</div>
    `;

    div.addEventListener("click", () => {
      writeStateToInputs(s);
      update(true);
      $("logStatus").textContent = "Snapshot restored ✅";
      setTimeout(()=> $("logStatus").textContent = "—", 1500);
      window.scrollTo({top:0, behavior:"smooth"});
    });

    wrap.appendChild(div);
  });
}

function exportHistoryCSV(){
  const hist = loadHistory();
  if(!hist.length){
    $("logStatus").textContent = "No history to export";
    setTimeout(()=> $("logStatus").textContent = "—", 1500);
    return;
  }

  const header = [
    "timestamp",
    "cartId",
    "location",
    "firstSupply",
    "expireDate",
    "checkDate",
    "tech",
    "medExpire",
    "medDrug",
    "medLock",
    "medDate",
    "medInit"
  ];

  const rows = hist.map(e => {
    const s = e.state || {};
    return [
      e.ts,
      s.cartId || "",
      s.location || "",
      s.firstSupply || "",
      s.expireDate || "",
      s.checkDate || "",
      s.tech || "",
      s.medExpire || "",
      s.medDrug || "",
      s.medLock || "",
      s.medDate || "",
      s.medInit || ""
    ].map(csvCell).join(",");
  });

  const csv = header.join(",") + "\n" + rows.join("\n");
  const file = `crash_cart_history_${new Date().toISOString().slice(0,10)}.csv`;
  downloadFile(file, csv);

  $("logStatus").textContent = "CSV exported ✅";
  setTimeout(()=> $("logStatus").textContent = "—", 1500);
}

function csvCell(v){
  const s = (v ?? "").toString();
  if(/[",\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---------- query param load (QR opens prefilled) ----------
function applyQueryParams(){
  const params = new URLSearchParams(window.location.search);
  if(!params || [...params.keys()].length === 0) return false;

  const s = loadState() || {};
  const keys = [
    "cartId","location","firstSupply","expireDate","checkDate","tech",
    "medExpire","medDrug","medLock","medDate","medInit"
  ];
  keys.forEach(k => {
    if(params.has(k)) s[k] = params.get(k);
  });

  writeStateToInputs(s);
  saveState(s);
  // optional: remove params after load so the URL cleans up (commented out)
  // history.replaceState({}, document.title, getBaseUrl());

  return true;
}

// ---------- main update loop ----------
function update(skipSave=false){
  const s = readStateFromInputs();
  render(s);
  if(!skipSave) saveState(s);
}

function wire(){
  // update on edits (state + QR + sticker)
  document.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", () => update(false));
    inp.addEventListener("change", () => update(false));
  });

  $("btnPrint").addEventListener("click", () => window.print());

  $("btnReset").addEventListener("click", () => {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    window.location.href = getBaseUrl(); // clears query params too
  });

  $("btnCopyLink").addEventListener("click", copyLink);

  $("btnLog").addEventListener("click", () => {
    const s = readStateFromInputs();
    // simple guardrail: require Cart ID and either tech or initials
    if(!s.cartId){
      $("logStatus").textContent = "Add Cart ID first";
      setTimeout(()=> $("logStatus").textContent="—", 1500);
      return;
    }
    if(!s.tech && !s.medInit){
      $("logStatus").textContent = "Add CS Tech or Initials";
      setTimeout(()=> $("logStatus").textContent="—", 1500);
      return;
    }
    addHistoryEntry(s);
  });

  $("btnExportCSV").addEventListener("click", exportHistoryCSV);
}

// ---------- init ----------
(function init(){
  // 1) Load from QR params if present
  const usedParams = applyQueryParams();

  // 2) Load saved state if any
  const saved = loadState();
  if(saved && !usedParams) writeStateToInputs(saved);

  // 3) Render + persist
  update(false);

  // 4) Render history
  renderHistory();

  // 5) Wire events
  wire();
})();
