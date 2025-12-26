/* Crash Cart Digital Sticker (single-sticker MVP)
   - Live preview updates
   - LocalStorage persistence
   - Print-to-PDF export
*/

const STORAGE_KEY = "crash_cart_sticker_v1";

const els = {
  facility: document.getElementById("facility"),
  hospital: document.getElementById("hospital"),
  department: document.getElementById("department"),
  phone: document.getElementById("phone"),
  firstSupply: document.getElementById("firstSupply"),
  expireDate: document.getElementById("expireDate"),
  checkDate: document.getElementById("checkDate"),
  tech: document.getElementById("tech"),

  sFacility: document.getElementById("sFacility"),
  sHospital: document.getElementById("sHospital"),
  sDept: document.getElementById("sDept"),
  sPhone: document.getElementById("sPhone"),
  sFirstSupply: document.getElementById("sFirstSupply"),
  sExpireDate: document.getElementById("sExpireDate"),
  sCheckDate: document.getElementById("sCheckDate"),
  sTech: document.getElementById("sTech"),

  btnPrint: document.getElementById("btnPrint"),
  btnReset: document.getElementById("btnReset"),
  btnToday: document.getElementById("btnToday"),
  status: document.getElementById("status"),
};

function fmtDate(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return "—";
  // show as "Feb 28, 2026" like a real label vibe
  const d = new Date(yyyy_mm_dd + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function sanitizeText(s) {
  if (!s) return "";
  return String(s).replace(/\s+/g, " ").trim();
}

function readForm() {
  return {
    facility: sanitizeText(els.facility.value),
    hospital: sanitizeText(els.hospital.value),
    department: sanitizeText(els.department.value),
    phone: sanitizeText(els.phone.value),

    firstSupply: sanitizeText(els.firstSupply.value),
    expireDate: els.expireDate.value || "",
    checkDate: els.checkDate.value || "",
    tech: sanitizeText(els.tech.value),
  };
}

function writeForm(data) {
  els.facility.value = data.facility || "Providence";
  els.hospital.value = data.hospital || "Holy Cross Hospital";
  els.department.value = data.department || "Central Department";
  els.phone.value = data.phone || "818-496-1190";

  els.firstSupply.value = data.firstSupply || "";
  els.expireDate.value = data.expireDate || "";
  els.checkDate.value = data.checkDate || "";
  els.tech.value = data.tech || "";
}

function renderSticker(data) {
  els.sFacility.textContent = data.facility || "Providence";
  els.sHospital.textContent = data.hospital || "Holy Cross Hospital";
  els.sDept.textContent = data.department || "Central Department";
  els.sPhone.textContent = data.phone || "818-496-1190";

  els.sFirstSupply.textContent = data.firstSupply || "—";
  els.sExpireDate.textContent = fmtDate(data.expireDate);
  els.sCheckDate.textContent = fmtDate(data.checkDate);
  els.sTech.textContent = data.tech || "—";
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashStatus("Saved");
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let statusTimer = null;
function flashStatus(text) {
  els.status.textContent = text;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (els.status.textContent = "Saved"), 900);
}

function updateAll() {
  const data = readForm();
  renderSticker(data);
  save(data);
}

function setCheckDateToday() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  els.checkDate.value = `${yyyy}-${mm}-${dd}`;
  updateAll();
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  writeForm({
    facility: "Providence",
    hospital: "Holy Cross Hospital",
    department: "Central Department",
    phone: "818-496-1190",
    firstSupply: "",
    expireDate: "",
    checkDate: "",
    tech: "",
  });
  renderSticker(readForm());
  flashStatus("Cleared");
}

function wire() {
  const inputs = [
    els.facility, els.hospital, els.department, els.phone,
    els.firstSupply, els.expireDate, els.checkDate, els.tech
  ];

  inputs.forEach(el => {
    el.addEventListener("input", updateAll);
    el.addEventListener("change", updateAll);
  });

  els.btnPrint.addEventListener("click", () => window.print());
  els.btnToday.addEventListener("click", setCheckDateToday);
  els.btnReset.addEventListener("click", resetAll);
}

(function init() {
  const saved = load();
  if (saved) writeForm(saved);
  // ensure defaults even if empty
  if (!els.phone.value) els.phone.value = "818-496-1190";

  renderSticker(readForm());
  wire();
})();
