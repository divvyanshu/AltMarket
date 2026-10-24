
/* ─── v4.6 — keep undisclosed schemes out of the comparison ───

   A third of the listing (1,033 of 3,076) publishes neither a return nor an
   AUM. The only field those rows carry is "minimum investment", and even that
   is the regulatory floor for the wrapper rather than anything the manager
   disclosed. On a site whose whole claim is that figures can be compared, a
   row of dashes is worse than no row.

   They are filtered out of the listing, the manager pages and the headline
   counts — not deleted. The schemes are real, so a direct link still resolves
   and a switch in the filters brings them back. */

var DATA_ALL=[];
/* The rule is product-aware on purpose. SEBI's monthly report covers portfolio
   managers, so a PMS with neither a return nor an AUM is one that should have
   disclosed and did not — a genuine gap, and 642 of them. An AIF, SIF or GIFT
   City scheme files no such report at all, so its blankness says nothing about
   the fund. Hiding those would delete the products rather than the noise:
   GIFT City would drop from 232 schemes to 1 and AIF from 186 to 35. */
function fundDisclosed(f){
  const hasRet=!!(f.r&&f.r.some(v=>v!=null&&v!==0));
  const hasAum=f.aum!=null&&f.aum>0;
  if(hasRet||hasAum)return true;
  return f.t!=="PMS";
}
function undisclosedCount(){return DATA_ALL.filter(f=>!fundDisclosed(f)).length}

/* rebuild everything that is derived from DATA */
function applyDisclosure(){
  const showAll=!!store.get("showUndisclosed",0);
  DATA=showAll?DATA_ALL.slice():DATA_ALL.filter(fundDisclosed);
  DATA.forEach(f=>{delete f.__sc});          // consistency score cache
  buildFilters();buildMgr();
  const n=DATA.length.toLocaleString("en-IN");
  const hs=$("#heroStats");if(hs)hs.innerHTML=statsHTML();
  const ac=$("#annCount");if(ac)ac.textContent=n+" funds";
  const b=$("#exploreBtn");if(b)b.textContent="Explore "+n+" funds";
  const cs=$("#chatSub");if(cs)cs.textContent="Searches "+n+" schemes · books a callback";
}

/* a direct link to a hidden scheme must still open it */
var _rfAll=renderFund;
renderFund=function(s){
  if(!DATA.some(f=>f.s===s)){
    const f=DATA_ALL.find(x=>x.s===s);
    if(f){DATA.push(f);buildMgr()}               // surface it for this visit
  }
  return _rfAll(s);
};

/* the switch, added under the existing data filter */
function disclosureToggle(){
  const n=undisclosedCount();
  if(!n||$("#fUndisclosed"))return;
  const host=$("#fData")&&$("#fData").closest(".fgroup");
  if(!host)return;
  const on=!!store.get("showUndisclosed",0);
  host.insertAdjacentHTML("beforeend",
    `<label class="tog" style="margin-top:6px"><input type="checkbox" id="fUndisclosed"${on?" checked":""}> `+
    `Include ${n.toLocaleString("en-IN")} PMS with nothing published</label>`+
    `<p class="src" style="margin-top:6px">These file neither a return nor an AUM with SEBI, so there is nothing to compare them on. AIF, SIF and GIFT City schemes are never hidden — they file no monthly report, so a blank row there is the norm rather than a gap.</p>`);
  $("#fUndisclosed").addEventListener("change",e=>{
    store.set("showUndisclosed",e.target.checked?1:0);
    applyDisclosure();apply();
  });
}

/* hook the load: app.js assigns DATA then builds everything from it */
var _bfOnce=buildFilters;
buildFilters=function(){
  if(!DATA_ALL.length&&DATA.length){
    DATA_ALL=DATA.slice();
    DATA=store.get("showUndisclosed",0)?DATA_ALL.slice():DATA_ALL.filter(fundDisclosed);
  }
  const r=_bfOnce.apply(this,arguments);
  setTimeout(disclosureToggle,0);
  return r;
};
