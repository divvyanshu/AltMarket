
/* ─── v4.2 — like-for-like compare + scheme type-ahead ───
   A PMS and a Cat II AIF do not report against the same benchmark and do not
   charge on the same structure, so putting them in adjacent columns invites a
   false reading. The first fund chosen sets the bucket; everything after it is
   held to that bucket. Within the bucket, a type-ahead finds a scheme by name. */

var AC={q:"",i:-1,open:false};

function cmpLock(){
  const first=cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean)[0];
  return first?prodTab(first):"";
}
/* a selection saved before this rule existed can still straddle two buckets */
function cmpMixed(){
  const fs=cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean);
  return [...new Set(fs.map(prodTab))].length>1;
}

/* every product filter now runs through the lock */
/* a scheme already chosen is out, and so is any other filing of the same
   approach — otherwise one fund can occupy two columns under two registrations */
function cmpKeys(){
  return new Set(cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean).map(dedupeKey));
}
pickPool=function(){
  const q=PICK.q.trim().toLowerCase(),lock=cmpLock(),taken=cmpKeys();
  return DATA.filter(f=>{
    if(cmp.includes(f.s)||taken.has(dedupeKey(f)))return false;
    if(lock&&prodTab(f)!==lock)return false;
    if(!lock&&PICK.tab&&prodTab(f)!==PICK.tab)return false;
    if(PICK.style&&!styleKeys(f).has(PICK.style))return false;
    if(q&&!tokenHits(f.n+" "+(houseName(f.p)||"")+" "+(f.m||""),tokens(q)))return false;
    return true;
  });
};

/* ── type-ahead ──
   Matching is by token, not by one unbroken run of characters. "icici
   prudential pipe" has to find "ICICI Prudential PMS PIPE Strategy", so every
   word you type must appear somewhere — in any order, with other words allowed
   in between. A tight contiguous match still ranks first. */
function tokens(q){
  return String(q).toLowerCase().split(/[^a-z0-9&]+/i).filter(Boolean);
}
/* where each token lands in a string, or null if any token is missing */
function tokenHits(hay,toks){
  const h=hay.toLowerCase(),out=[];
  for(const t of toks){
    const at=h.indexOf(t);
    if(at<0)return null;
    out.push([at,t.length]);
  }
  return out;
}
function wordStart(h,at){return at===0||/[^a-z0-9]/i.test(h[at-1])}

function acRank(f,toks,joined){
  const n=f.n,nl=n.toLowerCase();
  const house=(houseName(f.p)||f.m||"");
  const nameHits=tokenHits(n,toks);
  if(nameHits){
    const at=nl.indexOf(joined);
    if(at===0)return {rank:0,hits:[[at,joined.length]]};            // types the name
    if(at>0&&wordStart(nl,at))return {rank:1,hits:[[at,joined.length]]};
    if(at>0)return {rank:2,hits:[[at,joined.length]]};
    const ordered=nameHits.every((h,i)=>i===0||h[0]>nameHits[i-1][0]);
    const allWordStart=nameHits.every(h=>wordStart(nl,h[0]));
    return {rank:ordered?(allWordStart?3:4):5,hits:nameHits};        // words, gaps allowed
  }
  /* fall back to the house or manager carrying some of the words */
  const both=tokenHits(n+" "+house,toks);
  if(!both)return null;
  return {rank:6,hits:tokenHits(n,toks.filter(t=>nl.includes(t)))||[]};
}

/* ── one row per approach ──
   The same approach is sometimes filed under more than one registration, so the
   listing carries two or three records for it with different returns. Explore
   still shows them all; a chooser must not, because picking one at random means
   comparing against a figure that may be the stale one. We keep the most
   complete filing and say how many there were. */
var DUPES=new Map();
function dedupeKey(f){
  const n=String(f.n).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const h=(houseName(f.p)||f.m||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(" ")[0]||"";
  return n+"|"+h;
}
function filedCount(f){
  let n=0;for(let i=0;i<9;i++)if(f.r&&f.r[i]!=null)n++;
  if(f.br&&f.br.some(v=>v!=null))n+=0.5;      // a benchmark makes a filing more useful
  return n;
}
function dedupe(list){
  const byName={},groups=new Map();
  for(const f of list){
    const k=dedupeKey(f);
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(f);
    const n=k.split("|")[0];(byName[n]=byName[n]||new Set()).add(k);
  }
  /* a record with no house joins the only other group of the same name */
  for(const [k,arr] of [...groups]){
    const [n,h]=k.split("|");
    if(h)continue;
    const sibs=[...byName[n]].filter(x=>x!==k);
    if(sibs.length===1){groups.get(sibs[0]).push(...arr);groups.delete(k)}
  }
  const out=[];
  for(const arr of groups.values()){
    const best=arr.slice().sort((a,b)=>filedCount(b)-filedCount(a)||(b.aum||0)-(a.aum||0))[0];
    if(arr.length>1)DUPES.set(best.s,arr.length);else DUPES.delete(best.s);
    out.push(best);
  }
  return out;
}

function acMatches(){
  const toks=tokens(AC.q),joined=toks.join(" ");
  const lock=cmpLock();
  const taken=cmpKeys();
  const pool=DATA.filter(f=>!cmp.includes(f.s)&&!taken.has(dedupeKey(f))&&(!lock||prodTab(f)===lock));
  if(!toks.length){
    return pool.filter(f=>f.aum!=null).sort((a,b)=>b.aum-a.aum).slice(0,8).map(f=>({f,hits:[]}));
  }
  const out=[];
  for(const f of pool){
    const r=acRank(f,toks,joined);
    if(!r)continue;
    out.push({f,rank:r.rank,hits:r.hits,at:r.hits.length?r.hits[0][0]:1e6});
  }
  out.sort((a,b)=>a.rank-b.rank||a.at-b.at||(b.f.aum||0)-(a.f.aum||0));
  const order=new Map();out.forEach((x,i)=>{if(!order.has(x.f.s))order.set(x.f.s,i)});
  const ded=dedupe(out.map(x=>x.f)).sort((a,b)=>order.get(a.s)-order.get(b.s)).slice(0,10);
  return ded.map(f=>{
    const r=acRank(f,toks,joined);
    return {f,hits:r?r.hits:[],dupes:DUPES.get(f.s)||0};
  });
}
/* highlight every matched word, merging any that overlap */
function hiliteAll(name,hits){
  if(!hits||!hits.length)return esc(name);
  const r=[...hits].map(h=>[h[0],h[0]+h[1]]).sort((a,b)=>a[0]-b[0]);
  const merged=[];
  for(const x of r){
    const last=merged[merged.length-1];
    if(last&&x[0]<=last[1])last[1]=Math.max(last[1],x[1]);
    else merged.push([x[0],x[1]]);
  }
  let out="",pos=0;
  for(const [a,b] of merged){
    out+=esc(name.slice(pos,a))+"<mark>"+esc(name.slice(a,b))+"</mark>";
    pos=b;
  }
  return out+esc(name.slice(pos));
}
function acHTML(){
  const rows=acMatches(),q=AC.q.trim();
  if(!AC.open)return "";
  if(!rows.length)return `<div class="aclist"><div class="acempty">No scheme matches “${esc(q)}”${cmpLock()?` in ${esc(cmpLock())}`:""}.</div></div>`;
  return `<div class="aclist" role="listbox">${rows.map((r,k)=>{
    const f=r.f;
    return `<button type="button" class="acrow${k===AC.i?" on":""}" role="option" aria-selected="${k===AC.i}" data-acadd="${f.s}" data-aci="${k}">
     <span class="acname">${hiliteAll(deCaps(f.n),r.hits)}</span>
     <span class="achouse">${esc(houseName(f.p)||f.m||"Manager not listed")}</span>
     <span class="acmeta"><span class="tag t-${f.t}">${esc(prodTab(f))}</span>${(f.th&&f.th[0])?`<span class="tag sty" style="--bh:${styleHue(f.th[0])}">${esc(f.th[0])}</span>`:""}${r.dupes>1?`<span class="dupetag" title="This approach is filed under ${r.dupes} registrations with different figures. We show the most complete one; the others are in Explore.">${r.dupes} filings</span>`:""}</span>
     <span class="acret num">${ret(f,5)==null?'<span class="na">NA</span>':pctT(ret(f,5))}<small>3Y</small></span>
    </button>`}).join("")}${!q?`<div class="acfoot">Largest by AUM${cmpLock()?" in "+esc(cmpLock()):""} — start typing to search all ${DATA.length.toLocaleString("en-IN")} schemes.</div>`:""}</div>`;
}

var art=w=>/^[aeiou]/i.test(String(w))?"an":"a";
function lockBanner(){
  const lock=cmpLock();if(!lock)return "";
  const n=DATA.filter(f=>prodTab(f)===lock&&!cmp.includes(f.s)).length;
  return `<div class="locknote"><b>Comparing ${esc(lock)}.</b> ${n.toLocaleString("en-IN")} other ${esc(lock)} scheme${n===1?"":"s"} can be added — ${art(lock)} ${esc(lock)} and another product are reported against different benchmarks and charged on different structures, so they would not line up. <button type="button" class="linkbtn" data-cmpclear>Clear and start with a different product</button></div>`;
}

pickerHTML=function(){
  if(!PICK.open)return "";
  const lock=cmpLock();
  const counts={};DATA.forEach(f=>{const t=prodTab(f);counts[t]=(counts[t]||0)+1});
  const tabs=TAB_ORDER.filter(t=>counts[t]);
  const L=pickSorted(),rows=L.slice(0,40);
  const full=cmp.length>=CMP_MAX;
  return `<div class="pickpanel" id="pickPanel">
   <div class="pickhead">
    <div><b>${cmp.length?"Add a fund to compare":"Find a fund"}</b><span class="src">${cmp.length} of ${CMP_MAX} chosen${full?" · remove one to add another":""}</span></div>
    ${cmp.length?`<button class="iconbtn" type="button" data-pickclose aria-label="Close">×</button>`:""}
   </div>
   ${lockBanner()}
   <div class="acwrap">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
    <input type="text" id="acInput" autocomplete="off" role="combobox" aria-expanded="${AC.open}" aria-controls="acHost"
      placeholder="${lock?`Start typing a ${esc(lock)} scheme or house…`:"Start typing a scheme or house…"}" value="${esc(AC.q)}">
    ${AC.q?`<button type="button" class="acclear" data-acclear aria-label="Clear">×</button>`:""}
    <div id="acHost">${acHTML()}</div>
   </div>
   ${lock?"":`<div class="prodtabs" role="tablist">
    <button type="button" role="tab" data-picktab="" aria-selected="${PICK.tab===""}">All products<span>${DATA.length}</span></button>
    ${tabs.map(t=>`<button type="button" role="tab" data-picktab="${esc(t)}" aria-selected="${PICK.tab===t}">${esc(t)}<span>${counts[t]}</span></button>`).join("")}
   </div>`}
   <div class="pickstyles">
    <button type="button" class="pill" data-pickstyle="" aria-pressed="${PICK.style===""}">Any style</button>
    ${PICK_STYLES.map(st=>{
      const n=DATA.filter(f=>(lock?prodTab(f)===lock:(!PICK.tab||prodTab(f)===PICK.tab))&&styleKeys(f).has(st)).length;
      return n?`<button type="button" class="pill" data-pickstyle="${esc(st)}" aria-pressed="${PICK.style===st}">${esc(st)}<span class="n">${n}</span></button>`:""}).join("")}
   </div>
   <div class="pickbar">
    <input type="text" id="pickQ" placeholder="Filter the list below" value="${esc(PICK.q)}" autocomplete="off">
    <select id="pickSort" aria-label="Sort">
     ${[["m1","1 month"],["m3","3 months"],["m6","6 months"],["y1","1 year"],["y2","2 years"],["y3","3 years"],["y5","5 years"],["si","since inception"]].map(o=>
       `<option value="${o[0]}"${PICK.sort===o[0]?" selected":""}>Best ${o[1]}</option>`).join("")}
     <option value="aum"${PICK.sort==="aum"?" selected":""}>Largest AUM</option>
    </select>
   </div>
   <div class="picklist">${rows.length?`<div class="pickrow pickcols" aria-hidden="true">
     <div class="pickname"></div>
     <div class="pickrets"><span class="pr aum${PICK.sort==="aum"?" on":""}"><i>AUM (₹)</i></span>${PICK_PERIODS.map(i=>{
       const on=PICK_SORTK[PICK.sort]===i;
       return `<span class="pr${on?" on":""}"><i>${esc(PER[i]==="Since inc."?"S.Inc":PER[i])}</i></span>`}).join("")}
      <span class="pr vs"><i>vs index 3Y</i></span></div>
     <span></span></div>`:""}${rows.length?rows.map(f=>{
     const si=PICK_SORTK[PICK.sort];
     return `<div class="pickrow">
     <div class="pickname"><b>${esc(deCaps(f.n))}</b><span>${esc(houseName(f.p)||f.m||"Manager not listed")}</span>
      <div class="stybadges">${styleTags(f,2)}</div></div>
     <div class="pickrets"><span class="pr aum${PICK.sort==="aum"?" on":""}"><i>AUM (₹)</i><b class="num">${f.aum!=null?esc(fmtCr(f.aum)):'<span class="na">—</span>'}</b></span>${PICK_PERIODS.map(i=>{
       const v=ret(f,i),on=si===i;
       return `<span class="pr${on?" on":""}"><i>${esc(PER[i]==="Since inc."?"S.Inc":PER[i])}</i><b class="num">${v==null?'<span class="na">—</span>':pctT(v)}${implausible(f,i)?'<span class="flagq" title="As filed, but implausible for the product">?</span>':""}</b></span>`}).join("")}
      <span class="pr vs"><i>vs index 3Y</i><b class="num">${alpha(f,5)==null?'<span class="na">—</span>':`<span style="color:var(--${alpha(f,5)>=0?"up":"down"})">${alpha(f,5)>=0?"▲":"▼"} ${Math.abs(alpha(f,5)).toFixed(1)}</span>`}</b></span>
     </div>
     <button class="btn" type="button" data-pickadd="${f.s}" ${full?"disabled":""}>Add</button>
    </div>`}).join(""):`<div class="empty"><p>No scheme matches those filters.</p></div>`}</div>
   <p class="note">${L.length>40?`Showing the top 40 of ${L.length.toLocaleString("en-IN")}. Narrow with the filters or search by name. `:""}Style filters use our strategy tags, then the manager's own category wording, then the asset class as filed with SEBI — schemes that publish none of these are reachable by product, search or sort rather than by style.</p>
  </div>`;
};

/* a selection saved before the rule existed keeps working, with a way to tidy it */
mixNote=function(fs){
  if(!cmpMixed())return "";
  const prods=[...new Set(fs.map(prodTab))];
  const keep=prodTab(fs[0]);
  return `<p class="oddnote">This saved comparison mixes ${prods.map(esc).join(", ")}. Those products report against different benchmarks and charge on different structures, so the rows line up but the reading does not. <button type="button" class="linkbtn" data-cmptidy>Keep only the ${esc(keep)} schemes</button></p>`;
};

/* the compare toggle in Explore has to obey the same rule */
toggleCmp=function(s){
  if(cmp.includes(s)){cmp=cmp.filter(x=>x!==s)}
  else{
    if(cmp.length>=CMP_MAX){toast("Compare holds four funds. Remove one first.");return}
    const f=DATA.find(x=>x.s===s),lock=cmpLock();
    if(f&&cmpKeys().has(dedupeKey(f))){
      toast("That approach is already in the comparison, filed under another registration.");return;
    }
    if(f&&lock&&prodTab(f)!==lock){
      toast(`Comparing ${lock}. Clear the selection to compare ${prodTab(f)} instead.`);return;
    }
    cmp.push(s);
  }
  store.set("cmp",cmp);renderTray();refreshButtons();
  if(current==="compare")renderCompare();
};

/* presets replace the whole selection, so they always land in one bucket */
/* "Top 3" has to mean three. Only one Cat III scheme publishes a three-year
   figure, so rank on returns where they exist and top up by size where they
   do not, rather than handing back a comparison of one. */
applyPreset=function(i){
  const p=CMP_PRESETS[i];if(!p)return;
  const pool=DATA.filter(p[1]);
  const withR=pool.filter(f=>ret(f,5)!=null&&!implausible(f,5)).sort((a,b)=>ret(b,5)-ret(a,5));
  const rest=pool.filter(f=>!withR.includes(f)).sort((a,b)=>(b.aum||0)-(a.aum||0));
  cmp=withR.concat(rest).slice(0,3).map(f=>f.s);
  store.set("cmp",cmp);renderTray();refreshButtons();renderCompare();
};

/* only the live parts redraw while typing, so the caret stays where it is */
function acRefresh(){
  const host=$("#acHost");if(host)host.innerHTML=acHTML();
}
function acAdd(s){
  if(cmp.length>=CMP_MAX){toast("Compare holds four funds. Remove one first.");return}
  if(!s)return;
  cmp.push(s);store.set("cmp",cmp);
  AC.q="";AC.i=-1;AC.open=false;
  renderTray();refreshButtons();renderCompare();
}

/* the filtered list below the search gets the same treatment */
var _pickSortedBase=pickSorted;
pickSorted=function(){return dedupe(_pickSortedBase())};

document.addEventListener("click",function(e){
  const t=e.target.closest("[data-acadd],[data-acclear],[data-cmpclear],[data-cmptidy]");
  if(!t)return;
  if(t.dataset.acadd){acAdd(t.dataset.acadd);return}
  if(t.hasAttribute("data-acclear")){AC.q="";AC.i=-1;renderCompare();setTimeout(()=>{const i=$("#acInput");i&&i.focus()},30);return}
  if(t.hasAttribute("data-cmpclear")){cmp=[];store.set("cmp",cmp);AC.q="";AC.i=-1;renderTray();refreshButtons();renderCompare();return}
  if(t.hasAttribute("data-cmptidy")){
    const fs=cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean),keep=prodTab(fs[0]);
    cmp=fs.filter(f=>prodTab(f)===keep).map(f=>f.s);
    store.set("cmp",cmp);renderTray();refreshButtons();renderCompare();return}
},true);

document.addEventListener("input",function(e){
  if(e.target.id!=="acInput")return;
  AC.q=e.target.value;AC.i=-1;AC.open=true;acRefresh();
});
document.addEventListener("focusin",function(e){
  if(e.target.id==="acInput"){AC.open=true;acRefresh()}
});
document.addEventListener("keydown",function(e){
  if(e.target.id!=="acInput")return;
  const n=acMatches().length;
  if(e.key==="ArrowDown"){e.preventDefault();AC.open=true;AC.i=n?(AC.i+1)%n:-1;acRefresh()}
  else if(e.key==="ArrowUp"){e.preventDefault();AC.i=n?(AC.i-1+n)%n:-1;acRefresh()}
  else if(e.key==="Enter"){
    e.preventDefault();
    const rows=acMatches();const pick=AC.i>=0?rows[AC.i]:rows[0];
    if(pick)acAdd(pick.f.s);
  }
  else if(e.key==="Escape"){AC.open=false;acRefresh()}
});
document.addEventListener("click",function(e){
  if(!e.target.closest(".acwrap")&&AC.open){AC.open=false;acRefresh()}
});
