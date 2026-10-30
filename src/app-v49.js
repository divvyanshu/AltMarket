
/* ─── v4.9 — the product list carries only what can be compared ───

   Two groups leave the screener and the product filter:

   International / GIFT City — 233 schemes, of which exactly one publishes a
   return or an AUM. They are the same "nothing to compare" rows already hidden
   for PMS, and they only survived because non-PMS products were exempted.

   AIF with no published category — 117 schemes. Every AIF is legally Category
   I, II or III, so there is no fourth class to list them under, and assigning
   one is not available to us: Category II and Category III are taxed
   differently and no source supports the choice.

   Scoped to the screener on purpose. An earlier attempt filtered DATA itself,
   which emptied the GIFT City page to "0 funds tracked" — every content page
   reads from DATA. The live sections call filterWith() with their own state,
   so hooking filtered(), which only the screener uses, leaves them whole. */

var HIDDEN_PRODUCTS=["International","AIF (category not published)"];
function screenerListed(f){return HIDDEN_PRODUCTS.indexOf(prodTab(f))<0}

/* the screener's universe only */
var _filteredProd=filtered;
filtered=function(){return _filteredProd.apply(this,arguments).filter(screenerListed)};

TAB_ORDER=["PMS","AIF (Cat I)","AIF (Cat II)","AIF (Cat III)","SIF"];

/* buildFilters appends any product it finds that TAB_ORDER does not list, so
   the hidden ones have to be taken back out of the pill row */
var _bfProd=buildFilters;
buildFilters=function(){
  const r=_bfProd.apply(this,arguments);
  const host=$("#fType");
  if(host)$$("#fType .pill").forEach(b=>{
    const k=(b.dataset.k||"").replace(/^p:/,"");
    if(HIDDEN_PRODUCTS.indexOf(k)>=0)b.remove();
  });
  return r;
};

/* the count reads "N of M": M has to be the screener's universe, not every
   record the site holds, or an unfiltered list looks filtered */
function screenerUniverse(){return DATA.filter(screenerListed).length}
var _rlProd=renderList;
renderList=function(){
  const r=_rlProd.apply(this,arguments);
  const c=$("#count");
  if(c){
    const m=c.innerHTML.match(/^<b>([\d,]+)<\/b>/);
    if(m)c.innerHTML=`<b>${m[1]}</b> of ${screenerUniverse().toLocaleString("en-IN")} funds`+
      (/match/.test(c.textContent)?" match":"");
  }
  return r;
};

/* The hero figure counts every strategy AltMarket tracks, including the GIFT
   City and International schemes the screener holds back — so "strategies
   tracked" is what it is. An earlier relabel to "in the screener" put a wrong
   caption on a right number: it read 2,434 while the screener showed 2,084. */

/* ─── the disclosure toggle comes off the screener ───
   The switch and its explanation were a maintainer's note on a visitor's page.
   What the screener holds back is explained where it belongs — the methodology
   and the product pages — not in the filter rail.

   Anyone who had switched it on while it existed keeps the setting in local
   storage, and with no control left they would be stuck seeing the hidden rows
   for good, so it is cleared on load. */
try{store.set("showUndisclosed",0)}catch(e){}
disclosureToggle=function(){
  const el=$("#fUndisclosed");
  if(el){const w=el.closest(".tog");if(w){const n=w.nextElementSibling;if(n&&n.classList.contains("src"))n.remove();w.remove()}}
};
