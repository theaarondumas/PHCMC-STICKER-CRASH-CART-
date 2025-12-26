const $ = id => document.getElementById(id);
const KEY = "crash_cart_dual_v1";

function save(data){
  localStorage.setItem(KEY, JSON.stringify(data));
}

function load(){
  return JSON.parse(localStorage.getItem(KEY) || "{}");
}

function fmt(d){
  if(!d) return "—";
  return new Date(d+"T00:00").toLocaleDateString();
}

function update(){
  const data = {
    firstSupply: $("firstSupply").value,
    expireDate: $("expireDate").value,
    checkDate: $("checkDate").value,
    tech: $("tech").value,

    medExpire: $("medExpire").value,
    medDrug: $("medDrug").value,
    medLock: $("medLock").value,
    medDate: $("medDate").value,
    medInit: $("medInit").value
  };

  $("sFirstSupply").textContent = data.firstSupply || "—";
  $("sExpireDate").textContent = fmt(data.expireDate);
  $("sCheckDate").textContent = fmt(data.checkDate);
  $("sTech").textContent = data.tech || "—";

  $("mExpire").textContent = data.medExpire || "—";
  $("mDrug").textContent = data.medDrug || "—";
  $("mLock").textContent = data.medLock || "—";
  $("mDate").textContent = fmt(data.medDate);
  $("mInit").textContent = data.medInit || "—";

  save(data);
}

function init(){
  const d = load();
  Object.keys(d).forEach(k => $(k) && ($(k).value = d[k]));
  update();
  document.querySelectorAll("input").forEach(i=>{
    i.addEventListener("input", update);
    i.addEventListener("change", update);
  });
}

$("btnPrint").onclick = ()=>window.print();
$("btnReset").onclick = ()=>{
  localStorage.removeItem(KEY);
  location.reload();
};

init();
