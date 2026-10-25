
/* ─── v5.0 — say which filters are on, beside the results ───

   The count read "81 of 2,084 funds match" without saying what the match was
   against. Every active filter lived in the sidebar, which is collapsed on a
   phone and off to the side on a laptop, so a narrowed list could look like
   the whole market. Each filter now appears as a removable chip above the
   results, with one control to clear them all. */

function activeFilters(){
  const out=[];
  state.types.forEach(k=>{
    const label=k.charAt(1)===":"?k.slice(2):tname(k);
    out.push({k:"type:"+k,label:label});
  });
  state.themes.forEach(t=>out.push({k:"theme:"+t,label:t}));
  if(state.houseKey)out.push({k:"house",label:state.houseKey});
  else if(state.prov)out.push({k:"prov",label:'Manager "'+state.prov+'"'});
  if(state.min>-10)out.push({k:"min",label:PER[state.period]+" at least "+state.min+"%"});
  if(state.beat)out.push({k:"beat",label:"Beat its benchmark"});
  if(state.data)out.push({k:"data",label:"Has "+PER[state.period]+" data"});
  if(state.aum)out.push({k:"aum",label:"₹"+Number(state.aum).toLocaleString("en-IN")+" Cr or larger"});
  if(state.onlyShort)out.push({k:"short",label:"My shortlist"});
  return out;
}

function clearFilter(k){
  const [kind,...rest]=k.split(":");const val=rest.join(":");
  if(kind==="type")state.types.delete(val);
  else if(kind==="theme")state.themes.delete(val);
  else if(kind==="house"){state.houseKey="";state.prov=""}
  else if(kind==="prov"){state.prov="";state.houseKey=""}
  else if(kind==="min")state.min=-10;
  else if(kind==="beat")state.beat=false;
  else if(kind==="data")state.data=false;
  else if(kind==="aum")state.aum=0;
  else if(kind==="short")state.onlyShort=false;
  state.q=[];
  apply();
}

function activeFilterBar(){
  const f=activeFilters();
  let host=$("#activeFilters");
  if(!f.length){if(host)host.remove();return}
  if(!host){
    const head=$(".rhead");if(!head)return;
    head.insertAdjacentHTML("afterend",'<div id="activeFilters" class="activef"></div>');
    host=$("#activeFilters");
  }
  host.innerHTML=`<span class="k">Filtered by</span>`+
    f.map(x=>`<span class="chip">${esc(x.label)}<button type="button" data-clearf="${esc(x.k)}" aria-label="Remove ${esc(x.label)}">×</button></span>`).join("")+
    `<button type="button" class="linkbtn" data-clearall>Clear all</button>`;
}

var _rlActive=renderList;
renderList=function(){
  const r=_rlActive.apply(this,arguments);
  activeFilterBar();
  return r;
};

document.addEventListener("click",function(e){
  const t=e.target.closest("[data-clearf],[data-clearall]");
  if(!t)return;
  if(t.hasAttribute("data-clearall")){state=defaultState();apply();return}
  clearFilter(t.dataset.clearf);
},true);
