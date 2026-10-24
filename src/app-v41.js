
/* ─── v4.1 — Compare: fixed column geometry + a fund picker ───
   Compare used to be somewhere you arrived at, never somewhere you could start
   from: the only way in was the compare icon on a screener row. The picker below
   lets you build a comparison from the Compare page itself, narrowing by product,
   style, house or return. */

var CMP_MAX=4;
var PICK={open:false,tab:"",style:"",q:"",sort:"y3"};

/* the style vocabulary we can actually filter on, in a sensible reading order */
var PICK_STYLES=["Large cap","Mid cap","Small cap","Multi / flexi","Value","Quant",
  "Thematic","Credit & debt","Venture & PE","Real estate","Long-short","Global"];

function styleKeys(f){
  const out=new Set();
  (f.th||[]).forEach(t=>out.add(t));
  const c=f.c||"";
  if(c&&!/^(pms|aif|sif|gift city funds|benchmark|international)$/i.test(c)&&!/^aif[, ]/i.test(c)&&!/^aif category/i.test(c))
    c.split(/\s*[,/]\s*/).forEach(x=>{
      const k=x.trim().toLowerCase();
      if(/small/.test(k)&&/mid/.test(k)){out.add("Small cap");out.add("Mid cap")}
      else if(/small/.test(k))out.add("Small cap");
      else if(/mid/.test(k))out.add("Mid cap");
      else if(/large/.test(k))out.add("Large cap");
      else if(/flexi|multi ?cap/.test(k))out.add("Multi / flexi");
      else if(/thematic|sector/.test(k))out.add("Thematic");
      else if(/value/.test(k))out.add("Value");
      else if(/debt|credit|income|bond/.test(k))out.add("Credit & debt");
    });
  if(!out.size&&f.strat==="DEBT")out.add("Credit & debt");
  return out;
}

function pickPool(){
  const q=PICK.q.trim().toLowerCase();
  return DATA.filter(f=>{
    if(cmp.includes(f.s))return false;
    if(PICK.tab&&prodTab(f)!==PICK.tab)return false;
    if(PICK.style&&!styleKeys(f).has(PICK.style))return false;
    if(q&&!((f.n+" "+(houseName(f.p)||"")+" "+(f.m||"")).toLowerCase().includes(q)))return false;
    return true;
  });
}
/* A handful of managers file figures that cannot be right for the product —
   a liquid scheme at +120% over three years. We do not delete what was filed,
   but we refuse to let it head a "best return" list. */
function implausible(f,i){
  if(f.odd)return true;
  const v=ret(f,i);
  return v!=null&&Math.abs(v)>60;
}
/* every period the scheme files is shown; the sort only decides the order */
var PICK_PERIODS=[0,1,2,3,4,5,7,8];
var PICK_SORTK={m1:0,m3:1,m6:2,y1:3,y2:4,y3:5,y5:7,si:8};
function pickSorted(){
  const K=PICK_SORTK,nv=v=>v==null?-1e9:v;
  const L=pickPool();
  if(PICK.sort==="aum")return L.sort((a,b)=>nv(b.aum)-nv(a.aum));
  const i=K[PICK.sort]!=null?K[PICK.sort]:5;
  return L.sort((a,b)=>{
    const ao=implausible(a,i),bo=implausible(b,i);
    if(ao!==bo)return ao?1:-1;
    return nv(ret(b,i))-nv(ret(a,i));
  });
}

function pickerHTML(){
  if(!PICK.open)return "";
  const counts={};DATA.forEach(f=>{const t=prodTab(f);counts[t]=(counts[t]||0)+1});
  const tabs=TAB_ORDER.filter(t=>counts[t]);
  const L=pickSorted(),rows=L.slice(0,40);
  const full=cmp.length>=CMP_MAX;
  return `<div class="pickpanel" id="pickPanel">
   <div class="pickhead">
    <div><b>Add a fund to compare</b><span class="src">${cmp.length} of ${CMP_MAX} chosen${full?" · remove one to add another":""}</span></div>
    <button class="iconbtn" type="button" data-pickclose aria-label="Close">×</button>
   </div>
   <div class="prodtabs" role="tablist">
    <button type="button" role="tab" data-picktab="" aria-selected="${PICK.tab===""}">All products<span>${DATA.length}</span></button>
    ${tabs.map(t=>`<button type="button" role="tab" data-picktab="${esc(t)}" aria-selected="${PICK.tab===t}">${esc(t)}<span>${counts[t]}</span></button>`).join("")}
   </div>
   <div class="pickstyles">
    <button type="button" class="pill" data-pickstyle="" aria-pressed="${PICK.style===""}">Any style</button>
    ${PICK_STYLES.map(st=>{
      const n=DATA.filter(f=>(!PICK.tab||prodTab(f)===PICK.tab)&&styleKeys(f).has(st)).length;
      return n?`<button type="button" class="pill" data-pickstyle="${esc(st)}" aria-pressed="${PICK.style===st}">${esc(st)}<span class="n">${n}</span></button>`:""}).join("")}
   </div>
   <div class="pickbar">
    <input type="text" id="pickQ" placeholder="Search a scheme or house" value="${esc(PICK.q)}" autocomplete="off">
    <select id="pickSort" aria-label="Sort">
     <option value="y3"${PICK.sort==="y3"?" selected":""}>Best 3-year</option>
     <option value="y1"${PICK.sort==="y1"?" selected":""}>Best 1-year</option>
     <option value="si"${PICK.sort==="si"?" selected":""}>Best since inception</option>
     <option value="aum"${PICK.sort==="aum"?" selected":""}>Largest AUM</option>
    </select>
   </div>
   <div class="picklist">${rows.length?rows.map(f=>`<div class="pickrow">
     <div class="pickname"><b>${esc(deCaps(f.n))}</b><span>${esc(houseName(f.p)||f.m||"Manager not listed")}</span>
      <div class="stybadges">${styleTags(f,2)}</div></div>
     <div class="pickret"><span class="k">3Y</span><b class="num">${ret(f,5)==null?'<span class="na">NA</span>':pctT(ret(f,5))}${implausible(f,5)?'<span class="flagq" title="This figure is as filed but looks implausible for the product">?</span>':""}</b></div>
     <div class="pickret"><span class="k">vs index</span><b class="num">${alpha(f,5)==null?'<span class="na">—</span>':`<span style="color:var(--${alpha(f,5)>=0?"up":"down"})">${alpha(f,5)>=0?"▲":"▼"} ${Math.abs(alpha(f,5)).toFixed(1)}</span>`}</b></div>
     <button class="btn" type="button" data-pickadd="${f.s}" ${full?"disabled":""}>Add</button>
    </div>`).join(""):`<div class="empty"><p>No scheme matches those filters.</p></div>`}</div>
   <p class="note">${L.length>40?`Showing the top 40 of ${L.length.toLocaleString("en-IN")}. Narrow with the filters or search by name. `:""}Style filters use our strategy tags, then the manager's own category wording, then the asset class as filed with SEBI — schemes that publish none of these are reachable by product, search or sort rather than by style.</p>
  </div>`;
}

/* preset shortcuts that give someone a starting comparison in one tap */
var CMP_PRESETS=[
  ["Top 3 small & mid cap PMS",f=>f.t==="PMS"&&(styleKeys(f).has("Small cap")||styleKeys(f).has("Mid cap"))],
  ["Top 3 flexi / multi cap PMS",f=>f.t==="PMS"&&styleKeys(f).has("Multi / flexi")],
  ["Top 3 AIF Cat III",f=>prodTab(f)==="AIF (Cat III)"],
  ["Top 3 by 3-year return",f=>f.aum>=100]
];
function presetRow(){
  return `<div class="cmppresets"><span class="k">Start from</span>${CMP_PRESETS.map((p,i)=>
    `<button class="pill" type="button" data-cmppreset="${i}">${esc(p[0])}</button>`).join("")}</div>`;
}
function applyPreset(i){
  const p=CMP_PRESETS[i];if(!p)return;
  cmp=DATA.filter(f=>ret(f,5)!=null&&p[1](f)).sort((a,b)=>ret(b,5)-ret(a,5)).slice(0,3).map(f=>f.s);
  store.set("cmp",cmp);renderTray();refreshButtons();renderCompare();
}

/* a selection that spans products or styles is still worth making, but the
   benchmarks and fee structures behind it are not the same thing */
function mixNote(fs){
  if(fs.length<2)return "";
  const prods=[...new Set(fs.map(prodTab))];
  if(prods.length<2)return "";
  return `<p class="oddnote">These ${prods.length} products — ${prods.map(esc).join(", ")} — are measured against different benchmarks and charge on different structures. The rows still line up, but a like-for-like reading needs the same product type.</p>`;
}

renderCompare=function(){
  const fs=cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean);
  if(!fs.length){
    /* With nothing selected there is nothing else on this page, so the picker
       opens straight away rather than hiding behind a button. */
    PICK.open=true;
    $("#cmp").innerHTML=`<p class="sub cmplede">Pick up to ${CMP_MAX} funds to set side by side — search by name below, or start from one of these.</p>
      ${presetRow()}${pickerHTML()}`;
    return;
  }
  const picker=pickerHTML();
  const only=$("#onlyDiff").checked;
  const rows=[["Returns"],...[3,5,7,8].map(i=>[PER[i],f=>ret(f,i),"max",v=>pct(v)]),...[3,5,8].map(i=>[PER[i]+" vs index",f=>alpha(f,i),"max",v=>v==null?"—":(v>=0?"▲ ":"▼ ")+Math.abs(v).toFixed(1)+" pts"]),
    ["Size & structure"],["Type",f=>prodTab(f)],["AUM (₹)",f=>f.aum,"max",fmtCr],["Minimum",f=>f.mn],["Benchmark",f=>f.b||"—"],["Manager",f=>f.m||"—"],["House",f=>houseName(f.p)||"—"],["Launched",f=>f.x&&f.x.launch||"—"],["Strategy",f=>[...styleKeys(f)].join(", ")||"—"],
    ["Portfolio"],["Large / mid / small",f=>f.mc?f.mc.filter(r=>/cap/i.test(r[0])).map(r=>Math.round(r[1])).join(" / ")+"%":"—"],["Top sector",f=>f.sec?f.sec[0][0]+" "+f.sec[0][1]+"%":"—"],["Top holding",f=>f.h?f.h[0][0]+" "+f.h[0][1]+"%":"—"],
    ["Fees"],["Management fee",f=>f.x&&f.x.fee||"—"],["Profit share",f=>f.x&&f.x.carry||"—"],["Exit load",f=>f.x&&f.x.exit||"—"]];
  const nCols=fs.length+(cmp.length<CMP_MAX?1:0);
  let body="";
  for(const r of rows){
    if(r.length===1){body+=`<tr class="grp"><th colspan="${nCols+1}">${r[0]}</th></tr>`;continue}
    const raw=fs.map(r[1]),disp=raw.map(v=>r[3]?r[3](v):(v==null?"—":esc(v))),same=disp.every(d=>d===disp[0]);
    if(same&&only&&fs.length>1)continue;
    let best=-1;if(r[2]==="max"){const nums=raw.map(v=>v==null?-1e9:v),m=Math.max(...nums);if(m>-1e9&&nums.filter(v=>v===m).length===1)best=nums.indexOf(m)}
    const pad=cmp.length<CMP_MAX?'<td class="padcol"></td>':"";
    body+=same&&fs.length>1
      ? `<tr class="same"><th>${r[0]}</th><td colspan="${fs.length}" class="mergedsame">${disp[0]}, same for all</td>${pad}</tr>`
      : `<tr><th>${r[0]}</th>${disp.map((d,k)=>`<td class="${k===best?"best":""}${r[2]?" num":""}">${d}</td>`).join("")}${pad}</tr>`;
  }
  const chart=fs.some(f=>f.r)?`<div class="ccard" style="margin-bottom:14px"><h4>Returns at a glance</h4><p class="c">Annualised, each fund against the others.</p>${cmpChart(fs)}</div>`:"";
  /* equal widths: the label column is fixed, the fund columns split the rest */
  const labW=190,colPct=(100/nCols);
  const cols=`<colgroup><col style="width:${labW}px">${Array.from({length:nCols},()=>`<col style="width:${colPct}%">`).join("")}</colgroup>`;
  const addCol=cmp.length<CMP_MAX
    ? `<th class="addcol"><button class="addfund" type="button" data-pickopen><span>+</span>Add a fund</button></th>`:"";
  $("#cmp").innerHTML=presetRow()+picker+mixNote(fs)+chart+
   `<div class="ctbl fixed"><table>${cols}<thead><tr><th></th>${fs.map(f=>`<th>
     <span class="tag t-${f.t}">${esc(prodTab(f))}</span>
     <b title="${esc(deCaps(f.n))}">${esc(deCaps(f.n))}</b>
     ${(houseName(f.p)||f.m)?`<span class="hhouse">${esc(houseName(f.p)||f.m)}</span>`:`<span class="hhouse"> </span>`}
     <div class="hacts"><button class="btn ghost" type="button" data-open="${f.s}">Details</button><button class="btn ghost" type="button" data-uncmp="${f.s}">Remove</button></div>
    </th>`).join("")}${addCol}</tr></thead><tbody>${body}</tbody></table></div>`;
};

/* picker interactions, delegated so re-renders keep working */
document.addEventListener("click",function(e){
  const t=e.target.closest("[data-pickopen],[data-pickclose],[data-picktab],[data-pickstyle],[data-pickadd],[data-cmppreset]");
  if(!t)return;
  if(t.hasAttribute("data-pickopen")){PICK.open=true;renderCompare();
    setTimeout(()=>{const p=$("#pickPanel");if(p)p.scrollIntoView({behavior:"smooth",block:"nearest"})},40);return}
  if(t.hasAttribute("data-pickclose")){PICK.open=false;renderCompare();return}
  if(t.dataset.picktab!=null&&t.hasAttribute("data-picktab")){PICK.tab=t.dataset.picktab;renderCompare();return}
  if(t.dataset.pickstyle!=null&&t.hasAttribute("data-pickstyle")){PICK.style=t.dataset.pickstyle===PICK.style?"":t.dataset.pickstyle;renderCompare();return}
  if(t.dataset.pickadd){
    if(cmp.length>=CMP_MAX){toast("Compare holds four funds. Remove one first.");return}
    cmp.push(t.dataset.pickadd);store.set("cmp",cmp);renderTray();refreshButtons();renderCompare();return}
  if(t.dataset.cmppreset!=null){applyPreset(+t.dataset.cmppreset);return}
},true);
document.addEventListener("input",function(e){
  if(e.target.id==="pickQ"){PICK.q=e.target.value;renderCompare();
    const i=$("#pickQ");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
});
document.addEventListener("change",function(e){
  if(e.target.id==="pickSort"){PICK.sort=e.target.value;renderCompare()}
});
