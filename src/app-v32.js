
/* ─── v3.2 — on-theme series palette, manager pages, editorial insights ─── */

/* Series styling: one violet family separated by luminance, plus a fill
   treatment per series so the chart survives greyscale and colour blindness. */
var SER=[
 {c:"var(--s1)",fill:"var(--s1)",name:"solid"},
 {c:"var(--s2)",fill:"var(--s2)",name:"deep"},
 {c:"var(--s3)",fill:"var(--s3)",name:"tint"},
 {c:"var(--s4)",fill:"url(#hatch4)",name:"hatched"}
];
function serDefs(){return `<defs><pattern id="hatch4" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--s4t)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--s4)" stroke-width="3"/></pattern></defs>`}
function serSwatch(i){const s=SER[i];return `<i style="background:${i===3?"var(--s4)":s.c};${i===3?"background-image:repeating-linear-gradient(45deg,var(--s4) 0 3px,var(--s4t) 3px 6px)":""}"></i>`}

/* Compare chart — replaces the earlier four-hue version */
function cmpChart(fs){
  const idx=[3,5,7,8];
  const vals=fs.flatMap(f=>idx.map(i=>ret(f,i))).filter(v=>v!=null);
  const bvals=fs.flatMap(f=>idx.map(i=>bret(f,i))).filter(v=>v!=null);
  if(!vals.length)return"";
  let lo=Math.min(0,...vals,...bvals),hi=Math.max(...vals,...bvals)*1.18;lo=lo<0?lo*1.25:0;
  const W=680,H=250,L=40,T=16,B=34,pw=W-L-10,ph=H-T-B;
  const y=v=>T+(hi-v)/(hi-lo)*ph,gw=pw/idx.length,bw=Math.min(24,(gw-26)/fs.length);
  const step=(hi-lo)>45?10:5,ticks=[];for(let t=Math.ceil(lo/step)*step;t<=hi;t+=step)ticks.push(t);
  const grid=ticks.map(t=>`<line x1="${L}" x2="${W-10}" y1="${y(t)}" y2="${y(t)}" stroke="${t?"var(--line)":"var(--ink3)"}" stroke-width="${t?0.8:1}"/><text x="${L-7}" y="${y(t)+4}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("");
  const groups=idx.map((i,k)=>{
    const x0=L+gw*k+(gw-bw*fs.length)/2;
    const bm=fs.map(f=>bret(f,i)).find(v=>v!=null);
    const ghost=bm==null?"":`<rect x="${L+gw*k+6}" y="${Math.min(y(bm),y(0))}" width="${gw-12}" height="${Math.max(1,Math.abs(y(bm)-y(0)))}" rx="2" fill="var(--bench)" fill-opacity=".22"/><line x1="${L+gw*k+6}" x2="${L+gw*k+gw-6}" y1="${y(bm)}" y2="${y(bm)}" stroke="var(--bench)" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    const bars=fs.map((f,j)=>{const v=ret(f,i);if(v==null)return"";
      const x=x0+j*bw,h=Math.max(1,Math.abs(y(v)-y(0))),yy=Math.min(y(v),y(0));
      return `<rect class="grow" style="animation-delay:${(k*fs.length+j)*45}ms" x="${x+1}" y="${yy}" width="${bw-2}" height="${h}" rx="2" fill="${SER[j].fill}" stroke="${SER[j].c}" stroke-width="${j===3?1:0}"/><text x="${x+bw/2}" y="${v>=0?y(v)-5:y(v)+12}" text-anchor="middle" font-size="9.5" font-family="Geist Mono,monospace" fill="var(--ink2)">${v.toFixed(1)}</text>`}).join("");
    return `<g data-tip="<b>${PER[i]}</b>${bm!=null?"<br>Benchmark "+pctT(bm):""}">${ghost}${bars}<text x="${L+gw*k+gw/2}" y="${H-14}" text-anchor="middle" font-size="11.5" fill="var(--ink)" font-family="Geist,sans-serif">${PER[i]}</text></g>`}).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="play" role="img" aria-label="Annualised returns compared">${serDefs()}${grid}${groups}</svg>
   <div class="legend wrapleg">${fs.map((f,j)=>`<span>${serSwatch(j)}${esc(f.n)}</span>`).join("")}<span><i class="ghost"></i>Benchmark</span></div>
   <p class="foot">Annualised, time-weighted, net of fees. ${SEBI_NOTE}</p>`;
}

/* ─── Manager pages ─── */
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)}
/* House names for display: shouting names are title-cased, and the legal suffix is
   abbreviated (Private Limited → Pvt. Ltd., Limited → Ltd.). Slugs, filters and data
   keys keep the full name as published. */
var ACRO=new Set(["ICICI","SBI","UTI","ASK","AMC","AIF","PMS","SIF","LLP","LLC","IIFL","PGIM","ITI","ABSL","NJ","JM","DSP","HDFC","IDFC","BOI","LIC","GIC","UCO","IDBI","BNP","AAA","ESG","NRI","IFSC","REIT","INVIT","SME","US","UK","AK","BMC","PL","AA","AB","MO","TRI"]);
function deCaps(s){
  const letters=s.replace(/[^A-Za-z]/g,"");
  if(!letters||/[a-z]/.test(letters)&&letters.replace(/[^A-Z]/g,"").length/letters.length<0.7)return s;
  return s.split(/(\s+|-)/).map(w=>{
    const core=w.replace(/[^A-Za-z&.]/g,"");
    if(!core)return w;
    if(ACRO.has(core.toUpperCase())||(core.length<=5&&!/[AEIOU]/i.test(core))||/^[IVX]+$/.test(core))return w.toUpperCase();
    return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();
  }).join("");
}
function houseName(s){return deCaps(String(s||""))
  .replace(/\b(?:Private|Pvt\.?)\s+(?:Limited|Ltd\.?)/gi,"Pvt. Ltd.")
  .replace(/\bLimited\b/gi,"Ltd.")
  .replace(/\bLtd\b(?!\.)/gi,"Ltd.")}
function mgrBySlug(s){return MGR.find(m=>slug(m.p)===s)}
function mgrStats(m){
  const withR=m.fs.filter(f=>ret(f,5)!=null);
  const beat=[3,5,7,8].map(i=>{const v=m.fs.filter(f=>alpha(f,i)!=null);return {i,n:v.length,b:v.filter(f=>alpha(f,i)>0).length}}).filter(r=>r.n);
  const years=m.fs.map(f=>{const l=(f.x&&f.x.launch||"").match(/(19|20)\d{2}/);return l?+l[0]:null}).filter(Boolean);
  return {withR,beat,earliest:years.length?Math.min(...years):null,med3:median(withR.map(f=>ret(f,5)))};
}
function mgrDots(m){
  const rows=m.fs.filter(f=>ret(f,5)!=null).sort((a,b)=>ret(b,5)-ret(a,5)).slice(0,14);
  if(rows.length<2)return"";
  const all=rows.flatMap(f=>[ret(f,5),bret(f,5)]).filter(v=>v!=null);
  const lo=Math.floor(Math.min(...all)/5)*5,hi=Math.ceil(Math.max(...all)/5)*5;
  const W=640,L=196,R=52,rh=26,T=10,H=T+rows.length*rh+26,pw=W-L-R,X=v=>L+(v-lo)/(hi-lo)*pw;
  const ticks=[];for(let t=lo;t<=hi;t+=5)ticks.push(t);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Each scheme's three-year return against its benchmark">
   ${ticks.map(t=>`<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H-22}" stroke="${t?"var(--line)":"var(--ink3)"}" stroke-width=".8"/><text x="${X(t)}" y="${H-7}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")}
   ${rows.map((f,k)=>{const y=T+k*rh+rh/2,v=ret(f,5),b=bret(f,5),ahead=b!=null&&v>b;
     const nm=f.n.length>26?f.n.slice(0,25)+"…":f.n;
     return `<g class="dotrow" data-open="${f.s}" data-tip="<b>${esc(f.n)}</b><br>3Y ${pctT(v)}${b!=null?" · index "+pctT(b):""}">
      <text x="0" y="${y+4}" font-size="11.5" fill="var(--ink2)" font-family="Geist,sans-serif">${esc(nm)}</text>
      ${b!=null?`<line x1="${X(Math.min(v,b))}" x2="${X(Math.max(v,b))}" y1="${y}" y2="${y}" stroke="${ahead?"var(--up)":"var(--down)"}" stroke-width="2" opacity=".45"/><circle cx="${X(b)}" cy="${y}" r="4" fill="var(--bench)"/>`:""}
      <circle class="pop" style="animation-delay:${k*45}ms" cx="${X(v)}" cy="${y}" r="5.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>
      <text x="${W-R+8}" y="${y+4}" font-size="11" font-family="Geist Mono,monospace" fill="var(--ink)">${v.toFixed(1)}</text></g>`}).join("")}
   </svg><div class="legend" style="margin-top:4px"><span><i style="background:var(--s1)"></i>Scheme</span><span><i class="ghost"></i>Its benchmark</span></div>`;
}
/* Category tags without repeats: a GIFT City fund carries "GIFT City" as both its
   product type and a strategy tag, so show it once. */
function catTags(f,max){
  const seen=new Set(),out=[];
  for(const [label,cls] of [[tname(f.t),"t-"+f.t],...f.th.map(t=>[t,""])]){
    const k=label.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push([label,cls]);
    if(max&&out.length>=max)break;
  }
  return out.map(([l,c])=>`<span class="tag ${c}">${esc(l)}</span>`).join("");
}
/* Which product tab a scheme belongs to. AIF category comes from the scheme's
   own published category where it exists, not from a guess. */
function prodTab(f){
  if(f.t!=="AIF")return tname(f.t);
  const hay=[(f.x&&f.x.cat)||"",f.c||"",f.n,...(f.details||[]).filter(r=>/categor/i.test(r[0])).map(r=>r[1])].join(" ");
  const m=hay.match(/\bcat(?:egory)?[\s\-]*(iii|ii|i|3|2|1)\b/i);
  if(!m)return "AIF";
  const k=m[1].toLowerCase();
  const n=(k==="iii"||k==="3")?"III":(k==="ii"||k==="2")?"II":"I";
  return "AIF (Cat "+n+")";
}
var TAB_ORDER=["PMS","AIF (Cat I)","AIF (Cat II)","AIF (Cat III)","AIF","SIF","GIFT City","International"];
var MGR_TAB="",MGR_SORT="y3";
function mgrTabCounts(m){
  const counts={};m.fs.forEach(f=>{const t=prodTab(f);counts[t]=(counts[t]||0)+1});
  const tabs=TAB_ORDER.filter(t=>counts[t]).concat(Object.keys(counts).filter(t=>!TAB_ORDER.includes(t)));
  return {counts,tabs};
}
/* No "All" tab: a house's PMS and its AIFs are different products and are not
   meaningfully ranked in one list. The first product tab opens by default. */
function mgrTabs(m){
  const {counts,tabs}=mgrTabCounts(m);
  if(!MGR_TAB||!counts[MGR_TAB])MGR_TAB=tabs[0]||"";
  if(tabs.length<2)return "";
  return `<div class="prodtabs" role="tablist">${tabs.map(t=>
    `<button type="button" role="tab" data-mtab="${esc(t)}" aria-selected="${MGR_TAB===t}">${esc(t)}<span>${counts[t]}</span></button>`).join("")}</div>`;
}
/* The category column used to repeat the product (PMS, AIF) already shown by the
   tab. What distinguishes one approach from another is its style, so show that:
   our own strategy tags first, then the manager's own category wording, then the
   asset class as filed with SEBI. Nothing is invented — blank where none exists. */
/* Each style gets its own hue so a row is scannable by colour. Named hues for
   the vocabulary we actually publish; anything else hashes to a stable one. */
var STYLE_HUE={"equity":258,"smallcap":28,"midcap":172,"largecap":212,"multiflexi":242,
 "value":138,"quant":200,"thematic":318,"creditdebt":18,"ventureandpe":288,"venturepe":288,
 "realestate":96,"global":188,"longshort":348,"giftcity":42,"hybrid":160,"multiasset":272,
 "international":188,"debt":18,"privatecredit":18,"infrastructure":76,"preipo":300};
function styleHue(l){
  const k=String(l).toLowerCase().replace(/[^a-z0-9]/g,"");
  if(STYLE_HUE[k]!=null)return STYLE_HUE[k];
  let h=0;for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))%360;
  return h;
}
var STRAT_NAME={"EQUITY":"Equity","DEBT":"Credit & debt","HYBRID":"Hybrid","MULTI ASSET":"Multi-asset"};
function styleTags(f,max){
  const seen=new Set(),out=[];
  const push=l=>{l=String(l||"").trim();if(!l)return;const k=l.toLowerCase().replace(/[^a-z0-9]/g,"");
    if(!k||seen.has(k))return;seen.add(k);out.push(l)};
  (f.th||[]).forEach(push);
  const c=f.c||"";
  if(c&&!/^(pms|aif|sif|gift city funds|benchmark|international)$/i.test(c)&&!/^aif[, ]/i.test(c)&&!/^aif category/i.test(c))
    c.split(/\s*[,/]\s*/).forEach(push);
  if(!out.length&&f.strat&&STRAT_NAME[f.strat])push(STRAT_NAME[f.strat]);
  const list=max?out.slice(0,max):out;
  if(!list.length)return '<span class="na">—</span>';
  return list.map(l=>`<span class="tag sty" style="--bh:${styleHue(l)}">${esc(l)}</span>`).join("");
}
function mgrTable(m,sortKey,tab){
  const K={y1:3,y2:4,y3:5,y5:7,si:8}, key=K[sortKey]||5;
  const pool=tab?m.fs.filter(f=>prodTab(f)===tab):m.fs;
  const rows=[...pool].sort((a,b)=>{const x=ret(a,key),y=ret(b,key);return (y==null?-1e9:y)-(x==null?-1e9:x)});
  if(!rows.length)return `<div class="empty"><p>No schemes in this category.</p></div>`;
  /* Annualised periods only. No 10-year column: neither SEBI's monthly filing nor
     the listing publishes one, so it would be empty for every row. */
  const ann=[["1Y",3],["2Y",4],["3Y",5],["5Y",7],["Since inc.",8]];
  const sortKeyFor=i=>({3:"y1",4:"y2",5:"y3",7:"y5",8:"si"})[i];
  const cell=(i,lab)=>f=>`<td class="num r" data-l="${esc(lab||"")}">${ret(f,i)==null?'<span class="na">NA</span>':pctT(ret(f,i))}</td>`;
  return `<div class="ptable mgrtable"><table>
   <thead>
    <tr class="grouphead"><th colspan="3"></th><th colspan="${ann.length}">Annualised</th><th colspan="2"></th></tr>
    <tr><th>Investment approach</th><th>Strategy</th><th class="r">AUM (₹)</th>
     ${ann.map(c=>`<th class="r"><button type="button" data-msort="${sortKeyFor(c[1])}" ${c[1]===key?"data-on":""}>${c[0]}</button></th>`).join("")}
     <th class="r">vs index (3Y)</th><th>Inception</th></tr>
   </thead>
   <tbody>${rows.map(f=>`<tr data-open="${f.s}" tabindex="0" role="button" aria-label="${esc(f.n)}">
    <td data-l="Approach"><b>${esc(deCaps(f.n))}</b></td>
    <td data-l="Strategy"><div class="cattags">${styleTags(f,2)}</div></td>
    <td class="num r" data-l="AUM (₹)">${f.aum!=null?esc(fmtCr(f.aum)):'<span class="na">NA</span>'}</td>
    ${ann.map(c=>cell(c[1],c[0])(f)).join("")}
    <td class="num r" data-l="vs index 3Y">${alpha(f,5)==null?'<span class="na">NA</span>':`<span style="color:var(--${alpha(f,5)>=0?"up":"down"})">${alpha(f,5)>=0?"▲":"▼"} ${Math.abs(alpha(f,5)).toFixed(1)}</span>`}</td>
    <td class="num" data-l="Inception">${esc(launchOf(f)||"—")}</td></tr>`).join("")}</tbody></table></div>`;
}
function renderManager(s){
  const m=mgrBySlug(s);if(!m)return false;
  const st=mgrStats(m), people=[...new Set(m.fs.map(f=>f.m).filter(Boolean).flatMap(x=>x.split(/,\s*/)))].slice(0,8);
  const mix={};m.fs.forEach(f=>f.th.forEach(t=>mix[t]=(mix[t]||0)+1));
  const mixRows=Object.entries(mix).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const beatAll=st.beat.reduce((a,r)=>({n:a.n+r.n,b:a.b+r.b}),{n:0,b:0});
  $("#v-page").innerHTML=`<div class="wrap">
   <div class="crumb" style="padding-top:26px"><a href="#explore">Home</a><span>/</span><a href="#managers">Managers</a><span>/</span><span>${esc(houseName(m.p))}</span></div>
   <div class="mgrhead">
    <div class="mgrid"><div><h1>${esc(houseName(m.p))}</h1><div class="dmeta">${[...m.types].map(t=>`<span class="tag t-${t}">${tname(t)}</span>`).join("")}</div></div></div>
   </div>
   <div class="factstrip">
    <div><span>AUM (₹)</span><b class="num">${m.aum?fmtCr(m.aum):"—"}</b></div>
    <div><span>Investment approaches</span><b class="num">${m.fs.length}</b></div>
    <div><span>No. of clients</span><b class="num">${(function(){const h=houseReg(m.p);return h&&h.clients!=null?h.clients.toLocaleString("en-IN"):"—"})()}</b></div>
    <div><span>Earliest inception</span><b class="num">${st.earliest||"—"}</b></div>
   </div>
   <div class="pbody">
    <section><h2>About the house</h2><div class="prose">${houseBlurb(m)}</div></section>
    ${beatAll.n?`<section><h2>Consistency against the benchmark</h2><p class="prose" style="margin-bottom:14px">Across every scheme and period with published data, ${esc(houseName(m.p).split(/\s+/).slice(0,2).join(" "))} is ahead of the benchmark in <b>${beatAll.b} of ${beatAll.n}</b> measurements. A house that beats its index in most periods is more convincing than one carried by a single strong year.</p>
     <div class="beatrow">${st.beat.map(r=>`<div data-tip="${r.b} of ${r.n} schemes ahead over ${PER[r.i]}"><span>${PER[r.i]}</span><div class="bmeter"><i class="growx" style="width:${r.b/r.n*100}%"></i></div><b class="num">${Math.round(r.b/r.n*100)}%</b><small>${r.b} of ${r.n}</small></div>`).join("")}</div></section>`:""}
    ${st.withR.length>1?`<section><h2>Every scheme, against its own index</h2><div class="ccard compactstrip">${mgrStrip(m)||mgrDots(m)}<p class="foot">Three-year annualised, in percentage points against each scheme's own benchmark. Hover a dot for the scheme, click to open it. ${SEBI_NOTE}</p></div></section>`:""}
    <section><h2>Investment approaches</h2>${mgrTabs(m)}<div id="mgrTableWrap">${mgrTable(m,MGR_SORT,MGR_TAB)}</div>
     <p class="note">Every column is annualised and time-weighted (TWRR) as filed by the portfolio manager. NA means the scheme has not published that period. Neither SEBI’s monthly filing nor the listing publishes a 10-year figure, so there is no 10Y column. ${SEBI_NOTE}</p></section>
    ${mixRows.length>1?`<section><h2>Where the house invests</h2><div class="hbars">${mixRows.map(r=>`<div class="hb"><span>${esc(r[0])}</span><div class="trk"><i class="growx" style="width:${r[1]/mixRows[0][1]*100}%"></i></div><b>${r[1]}</b></div>`).join("")}</div><p class="note">Number of schemes carrying each strategy tag. A scheme can carry more than one.</p></section>`:""}
    ${people.length?`<section><h2>Named fund managers</h2><div class="people">${people.map(p=>`<div class="person">${mono({p})}<div><b>${esc(p)}</b><span>Named on ${m.fs.filter(f=>(f.m||"").includes(p)).length} scheme${m.fs.filter(f=>(f.m||"").includes(p)).length===1?"":"s"}</span></div></div>`).join("")}</div>
     <p class="note">Names as published on the scheme pages. Biographies and photographs are not part of the data AltMarket holds.</p></section>`:""}
    ${regPanel(m)?`<section><h2>Registration and firm details</h2>${regPanel(m)}</section>`:""}
    <section><div class="band"><div><h3>Considering ${esc(houseName(m.p).split(/\s+/).slice(0,2).join(" "))}?</h3><p>We'll share the latest factsheets and set their schemes side by side with two alternatives.</p></div><button class="btn" type="button" data-callback="mgr:${esc(s)}">Request a callback →</button></div></section>
    <p class="src">Compiled from public scheme pages on altportfunds.com, collected 24 September 2026, which cite APMI and the manager. Verify all figures against the manager's own disclosure document before investing.</p>
   </div></div>`;
  return true;
}

/* ─── Editorial insights ─── */
var ART_META={
 "reading-returns":{read:6,kicker:"Performance",fig:"figRankChurn"},
 "carry-explained":{read:5,kicker:"Fees",fig:"figWaterfall"},
 "fee-model":{read:5,kicker:"Fees",fig:"figBreakeven"},
 "early-exit":{read:4,kicker:"Liquidity",fig:"figDiscount"},
 "direct-plan":{read:4,kicker:"Costs",fig:"figDirectGap"},
 "long-short-explained":{read:4,kicker:"Strategy",fig:"figDispersion"}
};
var PULLQ={
 "reading-returns":"A 24% return means little until you know the index did 22%.",
 "carry-explained":"Read the waterfall clause, not the headline “2 and 20”.",
 "fee-model":"Expect more than the crossover and fixed is cheaper. Expect less and it isn't.",
 "early-exit":"Sometimes patience costs less than a secondary discount.",
 "direct-plan":"₹34 lakh over ten years is the price of advice. It can be worth paying.",
 "long-short-explained":"A 10%-net fund earning 11% is remarkable. A 90%-net fund earning 11% is the market."
};

function figRankChurn(){
  const P=DATA.filter(f=>f.t==="PMS"&&ret(f,3)!=null&&ret(f,7)!=null);
  if(P.length<20)return"";
  const by1=[...P].sort((a,b)=>ret(b,3)-ret(a,3)),by5=[...P].sort((a,b)=>ret(b,7)-ret(a,7));
  const r5=new Map(by5.map((f,i)=>[f.s,i+1]));
  const n=10,top=by1.slice(0,n).map((f,i)=>({f,r1:i+1,r5:r5.get(f.s)}));
  const W=660,H=310,L=190,R=150,T=34,pw=W-L-R,ph=H-T-26,rowH=ph/(n-1);
  const maxR=Math.max(...top.map(t=>t.r5),n);
  const Y1=k=>T+k*rowH;                       // left: the 1-year top ten, evenly spaced
  const Y2=r=>T+(r-1)/(maxR-1)*ph;            // right: their place over five years
  // keep right-hand labels from colliding
  const right=top.map((t,k)=>({k,y:Y2(t.r5)})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<right.length;i++)if(right[i].y-right[i-1].y<13)right[i].y=right[i-1].y+13;
  const ly={};right.forEach(r=>ly[r.k]=r.y);
  const slid=top.filter(t=>t.r5>40).length;
  return `<figure class="afig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Rank over one year against rank over five years">
   <text x="${L}" y="18" text-anchor="end" font-size="10.5" fill="var(--ink3)" font-family="Geist,sans-serif" letter-spacing=".08em">BEST OVER 1 YEAR</text>
   <text x="${L+pw}" y="18" text-anchor="start" font-size="10.5" fill="var(--ink3)" font-family="Geist,sans-serif" letter-spacing=".08em">RANK OVER 5 YEARS</text>
   <line x1="${L}" x2="${L}" y1="${T-8}" y2="${T+ph+8}" stroke="var(--line)"/>
   <line x1="${L+pw}" x2="${L+pw}" y1="${T-8}" y2="${T+ph+8}" stroke="var(--line)"/>
   ${top.map((t,k)=>{const y1=Y1(k),y2=Y2(t.r5),worse=t.r5>t.r1;
     const nm=t.f.n.length>26?t.f.n.slice(0,25)+"…":t.f.n;
     return `<g class="slope" data-open="${t.f.s}" data-tip="<b>${esc(t.f.n)}</b><br>1-year rank ${t.r1} · 5-year rank ${t.r5} of ${P.length}">
      <line x1="${L}" x2="${L+pw}" y1="${y1}" y2="${y2}" stroke="${worse?"var(--down)":"var(--up)"}" stroke-width="1.5" opacity=".5"/>
      <circle cx="${L}" cy="${y1}" r="4" fill="var(--s1)"/><circle cx="${L+pw}" cy="${y2}" r="4" fill="${worse?"var(--down)":"var(--up)"}"/>
      <text x="${L-11}" y="${y1+4}" text-anchor="end" font-size="10.5" fill="var(--ink2)" font-family="Geist,sans-serif">${esc(nm)}</text>
      <text x="${L+pw+11}" y="${ly[k]+3.5}" font-size="10.5" fill="${worse?"var(--down)":"var(--up)"}" font-family="Geist Mono,monospace">#${t.r5}</text></g>`}).join("")}
   </svg><figcaption>The ten best PMS strategies of the past year, and where those same strategies rank over five years among ${P.length} funds with both records. ${slid} of them sit outside the top 40 on the longer view. ${SEBI_NOTE}</figcaption></figure>`;
}
function figWaterfall(){
  const steps=[["Gross profit",100,"var(--s3)"],["Your capital back",0,""],["Hurdle to you",61,"var(--s1)"],["Manager catch-up",20,"var(--s4)"],["Split 80:20",19,"var(--s2)"]];
  const W=620,H=240,L=8,T=24,B=46,pw=W-16,ph=H-T-B;
  const bars=[["Gross profit","₹1.00 Cr",100,"var(--s3)"],["Hurdle, to you","₹61 L",61,"var(--s1)"],["Catch-up, to manager","₹20 L",20,"var(--s4)"],["Remainder split 80:20","₹19 L",19,"var(--s2)"]];
  const bw=pw/bars.length-18;
  return `<figure class="afig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="How a 2 and 20 waterfall divides a one crore profit">${serDefs()}
   ${bars.map((b,k)=>{const x=L+k*(pw/bars.length)+9,h=b[2]/100*ph,y=T+ph-h;
     return `<g data-tip="<b>${b[0]}</b><br>${b[1]}"><rect class="grow" style="animation-delay:${k*90}ms" x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${b[3]==="var(--s4)"?"url(#hatch4)":b[3]}" stroke="${b[3]}" stroke-width="${b[3]==="var(--s4)"?1:0}"/>
      <text x="${x+bw/2}" y="${y-7}" text-anchor="middle" font-size="12" font-family="Geist Mono,monospace" fill="var(--ink)">${b[1]}</text>
      <text x="${x+bw/2}" y="${H-24}" text-anchor="middle" font-size="11" fill="var(--ink2)" font-family="Geist,sans-serif">${b[0].split(",")[0]}</text>
      <text x="${x+bw/2}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">${b[0].split(",")[1]||""}</text></g>`}).join("")}
   </svg><figcaption>₹1 crore committed, doubled over five years. Of the ₹1 crore profit you keep ₹80 lakh and the manager takes ₹20 lakh — but only after your capital and a 10% compounded hurdle have been returned first.</figcaption></figure>`;
}
function figBreakeven(){
  const fx=0.025,ps=0.20,hu=0.10,y=7,A=1e7;
  const pts=[];for(let r=0;r<=40;r+=1){
    let vF=A,vP=A,hw=A;
    for(let t=0;t<y;t++){const e=vF*(1+r/100);vF=e-e*fx;const p=vP*(1+r/100);const ex=Math.max(0,p-Math.max(hw,vP*(1+hu)));vP=p-ex*ps;hw=Math.max(hw,vP)}
    pts.push({r,f:vF,p:vP});
  }
  let be=null;for(const p of pts)if(be==null&&p.p<p.f)be=p.r;
  const W=640,H=260,L=52,R=14,T=16,B=34,pw=W-L-R,ph=H-T-B;
  const mx=Math.max(...pts.flatMap(p=>[p.f,p.p])),mn=A;
  const X=r=>L+r/40*pw,Y=v=>T+(mx-v)/(mx-mn)*ph;
  const line=(k,c,dash)=>`<path d="${pts.map((p,i)=>`${i?"L":"M"}${X(p.r)},${Y(p[k])}`).join("")}" fill="none" stroke="${c}" stroke-width="2.2" ${dash?'stroke-dasharray="5 4"':'class="draw"'}/>`;
  return `<figure class="afig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fixed fee against profit share by gross return">
   ${[0,10,20,30,40].map(t=>`<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${T+ph}" stroke="var(--line)" stroke-width=".8"/><text x="${X(t)}" y="${H-12}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")}
   ${line("f","var(--s1)")}${line("p","var(--s2)",1)}
   ${be!=null?`<line x1="${X(be)}" x2="${X(be)}" y1="${T}" y2="${T+ph}" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="${X(be)+6}" y="${T+14}" font-size="11" fill="var(--ink)" font-family="Geist,sans-serif">crossover ≈ ${be}%</text>`:""}
   <text x="${L}" y="${T-4}" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">value after ${y} years →</text>
   <g><rect x="${L+8}" y="${T+8}" width="10" height="3" fill="var(--s1)"/><text x="${L+24}" y="${T+13}" font-size="11" fill="var(--ink2)" font-family="Geist,sans-serif">2.5% fixed</text>
   <rect x="${L+8}" y="${T+26}" width="10" height="3" fill="var(--s2)"/><text x="${L+24}" y="${T+31}" font-size="11" fill="var(--ink2)" font-family="Geist,sans-serif">20% above a 10% hurdle</text></g>
   </svg><figcaption>₹1 crore over seven years. Below the crossover the profit-share model costs you less; above it, the fixed fee does. Move the numbers yourself in the <a href="#fee-calculator">fee calculator</a>.</figcaption></figure>`;
}
function figDiscount(){
  const pts=[[0,25],[1,22],[2,18],[3,14],[4,9],[5,5],[6,2]];
  const W=620,H=230,L=48,R=16,T=18,B=40,pw=W-L-R,ph=H-T-B;
  const X=x=>L+x/6*pw,Y=v=>T+(28-v)/28*ph;
  return `<figure class="afig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Typical secondary discount against years remaining">
   ${[0,10,20].map(t=>`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width=".8"/><text x="${L-8}" y="${Y(t)+4}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")}
   <path d="${pts.map((p,i)=>`${i?"L":"M"}${X(p[0])},${Y(p[1])}`).join("")} L${X(6)},${T+ph} L${X(0)},${T+ph}Z" fill="var(--s1)" fill-opacity=".14"/>
   <path d="${pts.map((p,i)=>`${i?"L":"M"}${X(p[0])},${Y(p[1])}`).join("")}" fill="none" stroke="var(--s1)" stroke-width="2.4" class="draw"/>
   ${pts.map(p=>`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.5" fill="var(--s1)" data-tip="${p[0]} years in: about ${p[1]}% discount"/>`).join("")}
   ${[0,2,4,6].map(t=>`<text x="${X(t)}" y="${H-14}" text-anchor="middle" font-size="10.5" fill="var(--ink2)" font-family="Geist,sans-serif">Year ${t}</text>`).join("")}
   <text x="${L}" y="${T-4}" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">discount to NAV →</text>
   </svg><figcaption><b>Illustrative, not market data.</b> Secondary buyers price uncertainty: early in a fund's life, when little has been realised, discounts are widest. As distributions arrive and the remaining tenure shortens, the gap narrows.</figcaption></figure>`;
}
function figDirectGap(){
  const y=10,A=1e7,direct=Array.from({length:y+1},(_,i)=>A*Math.pow(1.15,i)),via=Array.from({length:y+1},(_,i)=>A*Math.pow(1.14,i));
  const gap=direct[y]-via[y];
  const W=620,H=250,L=10,R=118,T=14,B=30,pw=W-L-R,ph=H-T-B;
  const mx=direct[y]*1.02,mn=A*.98,X=i=>L+i/y*pw,Y=v=>T+(mx-v)/(mx-mn)*ph;
  const path=a=>a.map((v,i)=>`${i?"L":"M"}${X(i)},${Y(v)}`).join("");
  return `<figure class="afig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Direct plan against distributor plan over ten years">
   <path d="${path(direct)} L${X(y)},${Y(via[y])} ${via.map((v,i)=>`L${X(y-i)},${Y(via[y-i])}`).join("")}Z" fill="var(--s1)" fill-opacity=".16"/>
   <path d="${path(direct)}" fill="none" stroke="var(--s1)" stroke-width="2.4" class="draw"/>
   <path d="${path(via)}" fill="none" stroke="var(--s2)" stroke-width="2" stroke-dasharray="5 4"/>
   <text x="${X(y)+8}" y="${Y(direct[y])+4}" font-size="12" font-family="Geist Mono,monospace" fill="var(--s1)">${inr(direct[y])}</text>
   <text x="${X(y)+8}" y="${Y(direct[y])+18}" font-size="9.5" fill="var(--ink3)" font-family="Geist,sans-serif">direct, 15%</text>
   <text x="${X(y)+8}" y="${Y(via[y])+4}" font-size="12" font-family="Geist Mono,monospace" fill="var(--ink2)">${inr(via[y])}</text>
   <text x="${X(y)+8}" y="${Y(via[y])+18}" font-size="9.5" fill="var(--ink3)" font-family="Geist,sans-serif">after a 1% trail</text>
   ${[0,5,10].map(t=>`<text x="${X(t)}" y="${H-10}" text-anchor="${t===0?"start":t===10?"end":"middle"}" font-size="10.5" fill="var(--ink2)" font-family="Geist,sans-serif">${t===0?"Start":"Year "+t}</text>`).join("")}
   </svg><figcaption>₹1 crore at 15% gross. A 1% annual trail costs <b>${inr(gap)}</b> over ten years — not 1%, because the fee compounds away alongside the returns.</figcaption></figure>`;
}
function figDispersion(){
  const groups=["Long-short","Small cap","Multi / flexi"].map(t=>{
    const v=DATA.filter(f=>f.th.includes(t)&&ret(f,5)!=null).map(f=>ret(f,5));
    return v.length>=5?{t,n:v.length,lo:quant(v,.1),p25:quant(v,.25),md:median(v),p75:quant(v,.75),hi:quant(v,.9)}:null}).filter(Boolean);
  if(!groups.length)return"";
  const all=groups.flatMap(g=>[g.lo,g.hi]);
  const lo=Math.floor(Math.min(...all)/5)*5,hi=Math.ceil(Math.max(...all)/5)*5;
  const W=620,L=118,R=40,rh=52,T=14,H=T+groups.length*rh+26,pw=W-L-R,X=v=>L+(v-lo)/(hi-lo)*pw;
  const ticks=[];for(let t=lo;t<=hi;t+=5)ticks.push(t);
  return `<figure class="afig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Spread of three-year returns by strategy">
   ${ticks.map(t=>`<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H-22}" stroke="${t?"var(--line)":"var(--ink3)"}" stroke-width=".8"/><text x="${X(t)}" y="${H-7}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")}
   ${groups.map((g,k)=>{const y=T+k*rh+rh/2;return `<g data-tip="<b>${esc(g.t)}</b> · ${g.n} funds<br>Middle half ${g.p25.toFixed(1)}% to ${g.p75.toFixed(1)}%">
    <text x="0" y="${y-2}" font-size="12" fill="var(--ink)" font-family="Geist,sans-serif">${esc(g.t)}</text>
    <text x="0" y="${y+13}" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${g.n} funds</text>
    <line x1="${X(g.lo)}" x2="${X(g.hi)}" y1="${y}" y2="${y}" stroke="var(--line2)" stroke-width="1.5"/>
    <rect class="growx" style="animation-delay:${k*70}ms" x="${X(g.p25)}" y="${y-8}" width="${Math.max(2,X(g.p75)-X(g.p25))}" height="16" rx="8" fill="var(--s3)"/>
    <circle class="pop" style="animation-delay:${k*70+250}ms" cx="${X(g.md)}" cy="${y}" r="5.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/></g>`}).join("")}
   </svg><figcaption>Three-year annualised returns. The bar covers the middle half of each group, the dot is the median, the thin line the tenth to ninetieth percentile. Long-short funds cluster tightly; small-cap outcomes scatter. ${SEBI_NOTE}</figcaption></figure>`;
}

/* artCard and coverSVG deliberately stay as defined in app.js — the flowing-line
   covers read better than the bar version tried here. Do not override them. */
function renderArticle(id){
  const p=PG(id),m=ART_META[id]||{},q=PULLQ[id];
  const body=p.s.map(s=>s.t==="prose"?s.b:"").join("");
  const FIGS={figRankChurn,figWaterfall,figBreakeven,figDiscount,figDirectGap,figDispersion};
  let fig="";try{fig=m.fig&&FIGS[m.fig]?FIGS[m.fig]():""}catch(e){fig=""}
  const parts=body.split("<h3>");
  const heads=parts.slice(1).map(x=>x.slice(0,x.indexOf("</h3>")));
  const rel=(p.rel||[]).filter(PG);
  const others=window.AV_ARTICLES.filter(a=>a!==id).slice(0,3);
  let html=parts[0];
  parts.slice(1).forEach((x,i)=>{html+=`<h3 id="h-${i}">`+x; if(i===0&&q)html+=`<blockquote class="pull">${esc(q)}</blockquote>`});
  if(!heads.length&&q)html+=`<blockquote class="pull">${esc(q)}</blockquote>`;
  $("#v-page").innerHTML=`<div class="readbar"><i id="readProg"></i></div>
   <div class="wrap article">
    <div class="crumb"><a href="#explore">Home</a><span>/</span><a href="#insights">Insights</a><span>/</span><span>${esc(m.kicker||p.g)}</span></div>
    <h1>${p.h1}</h1>
    <p class="lede">${p.lede}</p>
    <div class="dateline"><span>${m.read||5} min read</span><span>Data as at 24 September 2026</span><span>AltMarket research</span></div>
    ${fig}
    <div class="prose artbody">${html}</div>
    ${heads.length>1?`<nav class="artnav" aria-label="In this article"><b>In this article</b>${heads.map((h,i)=>`<a href="#h-${i}" onclick="document.getElementById('h-${i}').scrollIntoView({behavior:'smooth'});return false">${esc(h)}</a>`).join("")}</nav>`:""}
    <div class="artend">
     <p class="src">Written by the AltMarket research desk. Figures are drawn from the fund data on this site or, where marked illustrative, constructed to show a mechanism. Nothing here is investment, tax or legal advice.</p>
     <div class="band" style="margin-top:18px"><div><h3>Put it to work</h3><p>Screen ${DATA.length.toLocaleString("en-IN")} strategies with every return shown against its benchmark.</p></div><button class="btn" type="button" data-go="explore">Explore funds →</button></div>
    </div>
    <h2 class="sec" style="margin-top:44px;font-size:28px">Keep reading</h2>
    <div class="arts">${others.map(artCard).join("")}</div>
    ${rel.length?`<div class="related" style="margin-top:16px">${rel.map(r=>`<a href="#${r}"><small>${esc(PG(r).g)}</small><b>${pageTitle(r)}</b><span class="src">${esc(pageDesc(r))}</span></a>`).join("")}</div>`:""}
   </div>`;
  const prog=$("#readProg"),body2=$(".article");
  const onScroll=()=>{if(!document.body.contains(prog))return removeEventListener("scroll",onScroll);
    const r=body2.getBoundingClientRect(),total=r.height-innerHeight;
    prog.style.width=Math.max(0,Math.min(1,-r.top/(total||1)))*100+"%"};
  addEventListener("scroll",onScroll,{passive:true});onScroll();
  return true;
}
