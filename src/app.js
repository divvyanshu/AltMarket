(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const PER=["1M","3M","6M","1Y","2Y","3Y","4Y","5Y","Since inc."];
const TYPES=[["PMS","PMS"],["AIF","AIF"],["GIFT","GIFT City"],["SIF","SIF"],["INTL","International"]];
const THEMES=["Small cap","Mid cap","Large cap","Multi / flexi","Value","Quant","Thematic","Credit & debt","Long-short","Venture & PE","Real estate","Global","GIFT City"];
const PAL=["#7C5CFF","#2B5DA8","#1D7466","#9A5B12","#8A3C80","#3E6B2F","#B0413E","#4B4A8C","#6B5B45","#2F7A8C"];
const VIEWS=["explore","compare","managers","research"];
const PAGES=window.AV_PAGES, MENU=window.AV_MENU;
let DATA=[], HOUSES={}, state=defaultState(), shown=40;
const store={get(k,d){try{const v=localStorage.getItem("altview."+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("altview."+k,JSON.stringify(v))}catch(e){}}};
let short=new Set(store.get("short",[])), cmp=store.get("cmp",[]);
const dbP=(window.claude&&typeof window.claude.use==="function")?window.claude.use("db").catch(()=>null):Promise.resolve(null);

function defaultState(){return{types:new Set(),themes:new Set(),period:5,min:-10,beat:false,data:false,aum:0,prov:"",houseKey:"",onlyShort:false,sort:"rel",q:[]}}
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pct=v=>v==null?'<span class="na">—</span>':(v>0?"+":"")+v.toFixed(1)+"%";
const pctT=v=>v==null?"—":(v>0?"+":"")+v.toFixed(1)+"%";
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const initials=s=>(s||"?").replace(/[^A-Za-z0-9 ]/g,"").split(/\s+/).filter(w=>w&&!/^(the|of|and|pvt|ltd|private|limited|llp)$/i.test(w)).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";
const mono=f=>`<span class="mono" style="background:${PAL[hash(f.p||f.n)%PAL.length]}" aria-hidden="true">${esc(initials(f.p||f.n))}</span>`;
const tname=t=>(TYPES.find(x=>x[0]===t)||[t,t])[1];
/* Figures are in crore, written out in full. The rupee sign lives on the
   column heading so the numbers themselves stay comparable at a glance. */
const fmtCr=v=>v==null?"—":Math.round(v).toLocaleString("en-IN")+" Cr";
const inr=v=>v>=1e7?"₹"+(v/1e7).toFixed(2)+" Cr":"₹"+(v/1e5).toFixed(1)+" L";
const median=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const quant=(a,q)=>{const s=[...a].sort((x,y)=>x-y);const i=(s.length-1)*q,lo=Math.floor(i);return s[lo]+(s[Math.ceil(i)]-s[lo])*(i-lo)};
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),1900)}
const ret=(f,i)=>f.r?f.r[i]:null, bret=(f,i)=>f.br?f.br[i]:null;
const alpha=(f,i)=>{const a=ret(f,i),b=bret(f,i);return a==null||b==null?null:a-b};

/* ─── tooltip ─── */
const tip=$("#tip");
document.addEventListener("mousemove",e=>{const t=e.target.closest&&e.target.closest("[data-tip]");if(!t){tip.classList.remove("on");return}tip.innerHTML=t.getAttribute("data-tip");tip.classList.add("on");const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;tip.style.left=x+"px";tip.style.top=y+"px"});

/* ─── ask ─── */
const EX=["small cap PMS beating benchmark, 3Y above 20%","private credit AIF","GIFT City funds","quant strategies over ₹500 Cr","ASK funds with 5Y returns","SIF long-short"];
function parseAsk(q){
  const s=" "+q.toLowerCase()+" ", chips=[], st=defaultState();st.sort="ret";
  const add=(label,fn)=>{chips.push(label);fn()};
  if(/\bpms\b|portfolio management/.test(s))add("PMS",()=>st.types.add("PMS"));
  if(/\baif\b|alternative investment|cat(egory)?[ -]?(i{1,3}|[123])\b/.test(s))add("AIF",()=>st.types.add("AIF"));
  if(/gift ?city|ifsc/.test(s))add("GIFT City",()=>st.types.add("GIFT"));
  if(/\bsif\b|specialised investment|specialized investment/.test(s))add("SIF",()=>st.types.add("SIF"));
  const TK=[["Small cap",/small ?cap|micro ?cap|smallcap/],["Mid cap",/mid ?cap|midcap/],["Large cap",/large ?cap|blue ?chip|largecap/],["Multi / flexi",/multi ?cap|flexi|all ?cap/],["Value",/\bvalue\b|contra/],["Quant",/quant|factor|momentum|\bai\b/],["Thematic",/theme|thematic|esg|shariah|consumption|pharma/],["Credit & debt",/credit|debt|income|fixed income|bond|yield/],["Long-short",/long[- ]?short|hedge|absolute return|arbitrage/],["Venture & PE",/venture|private equity|\bpe\b|startup|secondar/],["Real estate",/real estate|reit|realty/],["Global",/global|\bus\b|world|international|overseas/]];
  for(const [t,re] of TK)if(re.test(s)&&!st.themes.has(t))add(t,()=>st.themes.add(t));
  const pm=s.match(/\b(1|3|5)\s?y(ea)?r?s?\b/)||s.match(/since inception/);
  if(pm){st.period=pm[0].includes("since")?8:{1:3,3:5,5:7}[pm[1]];add("Judged on "+PER[st.period],()=>{})}
  const rm=s.match(/(?:above|over|more than|>|at least|≥|>=)\s*(\d{1,2})\s*%/)||s.match(/(\d{1,2})\s*%\s*(?:\+|plus|or more)/);
  if(rm)add(PER[st.period]+" ≥ "+rm[1]+"%",()=>{st.min=+rm[1];st.data=true});
  if(/beat|outperform|beating|alpha|ahead of/.test(s))add("Beats benchmark",()=>{st.beat=true;st.data=true});
  if(/with (\d )?\w* ?returns|track record|performance data/.test(s)&&!st.data)add("Has return data",()=>st.data=true);
  const am=s.match(/(?:over|above|>|aum)\s*₹?\s*(\d[\d,]*)\s*(?:cr|crore)/);
  if(am){const v=+am[1].replace(/,/g,"");const o=[100,500,1000,5000].filter(x=>x<=v).pop()||0;if(o)add("AUM ₹"+o.toLocaleString("en-IN")+" Cr+",()=>st.aum=o)}
  const provs=[...new Set(DATA.map(f=>f.p).filter(Boolean))];
  const stop=new Set(["pms","aif","sif","fund","funds","cap","with","returns","above","over","the","and","for","beating","benchmark","small","large","mid","gift","city","global","credit","private","quant","strategies","under","lakh","value","long","short","since","inception","growth","india","equity","portfolio","multi","debt","income","year","years"]);
  const words=s.replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>=3&&!stop.has(w));
  for(const w of words){const hit=provs.find(p=>p.toLowerCase().split(/\s+/)[0]===w);if(hit){const first=hit.split(/\s+/)[0];add("Manager: "+first,()=>st.prov=first);break}}
  if(!chips.length){st.prov=q.trim();chips.push("Name contains “"+q.trim()+"”")}
  st.q=chips;return st;
}
function applyChip(ch){
  const T={"PMS":"PMS","AIF":"AIF","GIFT City":"GIFT","SIF":"SIF"};let m;
  if(T[ch]){state.types.add(T[ch]);return}
  if(THEMES.includes(ch)){state.themes.add(ch);return}
  if((m=ch.match(/^Judged on (.+)$/))){state.period=PER.indexOf(m[1]);return}
  if((m=ch.match(/≥ (\d+)%/))){state.min=+m[1];state.data=true;return}
  if(ch==="Beats benchmark"){state.beat=true;state.data=true;return}
  if(ch==="Has return data"){state.data=true;return}
  if((m=ch.match(/^AUM ₹([\d,]+)/))){state.aum=+m[1].replace(/,/g,"");return}
  if((m=ch.match(/^Manager: (.+)$/))){state.prov=m[1];return}
  if((m=ch.match(/^Name contains “(.+)”$/)))state.prov=m[1];
}
function renderUnderstood(){
  const u=$("#understood");if(!state.q.length){u.hidden=true;return}u.hidden=false;
  u.innerHTML='<span>Understood as</span>'+state.q.map((c,i)=>`<span class="chip">${esc(c)}<button type="button" data-chip="${i}" aria-label="Remove ${esc(c)}">×</button></span>`).join("")+'<button class="btn ghost" type="button" id="clearAsk" style="padding:4px 10px;font-size:12px">Clear</button>';
}

/* ─── screener ─── */
function counts(key){const c={};DATA.forEach(f=>{(key==="t"?[f.t]:f.th).forEach(v=>c[v]=(c[v]||0)+1)});return c}
function buildFilters(){
  const tc=counts("t"),hc=counts("th");
  /* Products are a single choice, and AIFs are split by the category they filed
     under — a Cat II private-credit fund and a Cat III long-short fund are not
     the same shelf. Keys are prefixed so they cannot collide with the raw type
     codes that the goal cards and live sections still pass in. */
  const pc={};DATA.forEach(f=>{const k=prodTab(f);pc[k]=(pc[k]||0)+1});
  const order=(typeof TAB_ORDER!=="undefined"?TAB_ORDER:[]).filter(k=>pc[k])
    .concat(Object.keys(pc).filter(k=>(typeof TAB_ORDER==="undefined")||!TAB_ORDER.includes(k)));
  $("#fType").innerHTML=order.map(k=>{
    const label=k==="AIF"?"AIF (other)":k;
    return `<button type="button" class="pill" data-k="p:${esc(k)}" aria-pressed="false">${esc(label)}<span class="n">${pc[k].toLocaleString("en-IN")}</span></button>`}).join("");
  $("#fTheme").innerHTML=THEMES.filter(t=>hc[t]).map(t=>`<button type="button" class="pill" data-k="${esc(t)}" aria-pressed="false">${esc(t)}<span class="n">${hc[t]}</span></button>`).join("");
}
function syncFilters(){
  $$("#fType .pill").forEach(b=>b.setAttribute("aria-pressed",state.types.has(b.dataset.k)));
  $$("#fTheme .pill").forEach(b=>b.setAttribute("aria-pressed",state.themes.has(b.dataset.k)));
  $("#fPeriod").value=state.period;$("#fMin").value=state.min;$("#fMinV").textContent=state.min<=-10?"Any":"≥ "+state.min+"%";
  $("#fBeat").checked=state.beat;$("#fData").checked=state.data;$("#fAum").value=state.aum;$("#fProv").value=state.prov;
  {const c=$("#provClear");if(c)c.hidden=!(state.prov||state.houseKey)}$("#fShort").checked=state.onlyShort;$("#sortSel").value=state.sort;
}
function filterWith(st,src){
  const P=st.period,pv=(st.prov||"").toLowerCase();
  return (src||DATA).filter(f=>{
    if(st.types.size){
      const pt=prodTab(f);
      if(![...st.types].some(k=>k.charAt(1)===":"?pt===k.slice(2):f.t===k))return false;
    }
    if(st.themes.size&&!f.th.some(t=>st.themes.has(t)))return false;
    if(st.onlyShort&&!short.has(f.s))return false;
    /* A house is stored as "…Private Limited" but displayed as "…Pvt. Ltd.",
       so searching the stored string alone meant typing what you could see
       returned nothing. Match against both, by token, in any order. */
    /* Keyed on the displayed name, so a house filed under two registrations
       still comes back as one manager with all of its strategies. */
    if(st.houseKey){ if(houseName(f.p)!==st.houseKey)return false }
    else if(pv){
      const hay=f.p+" "+houseName(f.p)+" "+f.n+" "+(f.m||"");
      if(!tokenHits(hay,tokens(pv)))return false;
    }
    if(st.data&&ret(f,P)==null)return false;
    if(st.min>-10){const v=ret(f,P);if(v==null||v<st.min)return false}
    if(st.beat){const a=alpha(f,P);if(a==null||a<=0)return false}
    if(st.aum&&(f.aum==null||f.aum<st.aum))return false;
    return true});
}
function sortList(L,S,P){const nv=v=>v==null?-1e9:v;
  if(S==="ret")L.sort((a,b)=>nv(ret(b,P))-nv(ret(a,P)));
  else if(S==="alpha")L.sort((a,b)=>nv(alpha(b,P))-nv(alpha(a,P)));
  else if(S==="aum")L.sort((a,b)=>nv(b.aum)-nv(a.aum));
  else if(S==="az")L.sort((a,b)=>a.n.localeCompare(b.n));
  else L.sort((a,b)=>(b.f||0)-(a.f||0)||(b.r?1:0)-(a.r?1:0)||nv(b.aum)-nv(a.aum));
  return L}
/* let, not const: v4.9 wraps this to scope the screener's universe */
let filtered=()=>sortList(filterWith(state),state.sort,state.period);
function spark(f){
  if(!f.r)return '<span class="na" style="font-size:12px">No data</span>';
  const idx=[3,5,7,8].filter(i=>f.r[i]!=null);if(!idx.length)return '<span class="na">—</span>';
  const w=84,h=26,max=Math.max(5,...idx.map(i=>Math.abs(f.r[i])),...idx.map(i=>Math.abs(bret(f,i)||0))),bw=w/idx.length;
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="0" x2="${w}" y1="${h/2}" y2="${h/2}" stroke="var(--line2)"/>`+idx.map((i,k)=>{const v=f.r[i],b=bret(f,i),x=k*bw+3,bh=Math.abs(v)/max*(h/2-1),y=v>=0?h/2-bh:h/2;
    const bb=b==null?"":`<rect x="${x+bw/2-1}" y="${b>=0?h/2-Math.abs(b)/max*(h/2-1):h/2}" width="${bw/2-3}" height="${Math.abs(b)/max*(h/2-1)}" fill="var(--bench)"/>`;
    return `<rect x="${x}" y="${y}" width="${bw/2-2}" height="${bh}" fill="${v>=0?'var(--acc)':'var(--down)'}"/>`+bb}).join("")+"</svg>";
}
function cell(f,i,cls){const v=ret(f,i),a=alpha(f,i);
  /* The lead over the benchmark stays available on hover and on the strategy
     page; printing it under every figure made the table noisy. */
  return `<div class="ret r ${cls}"${a==null?"":` title="${Math.abs(a).toFixed(1)} points ${a>=0?"ahead of":"behind"} its benchmark over ${PER[i]}"`}>${v==null?'<span class="na">—</span>':pct(v)}</div>`}
function actBtns(f){return `<div class="acts"><button type="button" data-short="${f.s}" aria-pressed="${short.has(f.s)}" title="Shortlist" aria-label="Shortlist ${esc(f.n)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="${short.has(f.s)?"currentColor":"none"}" stroke="currentColor" stroke-width="2"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg></button><button type="button" data-cmp="${f.s}" aria-pressed="${cmp.includes(f.s)}" title="Add to compare" aria-label="Compare ${esc(f.n)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v18M16 3v18M3 8h5M16 16h5"/></svg></button></div>`}
const sub=f=>esc(houseName(f.p)||f.m||"Manager not listed");
function renderList(){
  const L=filtered(),P=state.period;
  const active=state.types.size||state.themes.size||state.beat||state.min>-10||state.prov||state.aum||state.onlyShort||state.data;
  $("#count").innerHTML=`<b>${L.length.toLocaleString("en-IN")}</b> of ${DATA.length.toLocaleString("en-IN")} funds${active?" match":""}`;
  const colsU=[...new Set([3,5,P===3||P===5?7:P])];while(colsU.length<3)colsU.push(8);
  const head=`<div class="tr th"><span>Fund</span><button type="button" data-sortaum ${state.sort==="aum"?"data-on":""} class="r">AUM (₹)${state.sort==="aum"?" ↓":""}</button>${colsU.map((i,k)=>`<button type="button" data-p="${i}" ${i===P?"data-on":""} class="c${k*2+1}">${PER[i]}${i===P?" ↓":""}</button>`).join("")}<span></span></div>`;
  if(!L.length){$("#tbl").innerHTML=head+`<div class="empty"><p>No funds match all of these filters.</p><button class="btn ghost" type="button" data-reset>Loosen filters</button></div>`;$("#more").hidden=true;return}
  $("#tbl").innerHTML=head+L.slice(0,shown).map(f=>`<div class="tr" data-s="${f.s}" role="button" tabindex="0" aria-label="${esc(f.n)} details"><div class="fname"><b>${esc(deCaps(f.n))}</b><div class="stybadges">${styleTags(f,2)}<span class="tag t-${f.t} prodtag">${esc(prodTab(f))}</span></div></div><div class="aumc num r">${f.aum!=null?esc(fmtCr(f.aum)):'<span class="na">—</span>'}</div>${colsU.map((i,k)=>cell(f,i,"c"+(k*2+1))).join("")}${actBtns(f)}<div class="mret">${[3,5,8].map(i=>`<span class="ret"><small>${PER[i]}</small>${pct(ret(f,i))}</span>`).join("")}</div></div>`).join("");
  const left=Math.max(0,L.length-shown);
  $("#more").hidden=left===0;
  $("#moreBtn").textContent=`Show ${Math.min(40,left)} more`;
}
function apply(scroll){shown=40;syncFilters();renderList();renderUnderstood();if(scroll)setTimeout(()=>$("#screenerSec").scrollIntoView({behavior:"smooth",block:"start"}),30)}
function toScreener(fn){state=defaultState();fn&&fn(state);$("#ask").value="";if(current!=="explore")go("explore",true);apply(true)}

/* ─── drawer ─── */
function verdict(f){
  if(!f.r)return `<b>No return history published yet.</b> ${esc(f.n)} is listed as a ${tname(f.t)} product${f.th.length?" ("+esc(f.th.join(", ").toLowerCase())+")":""}. Ask the manager for the latest factsheet before shortlisting it.`;
  const ps=[3,4,5,6,7,8].filter(i=>alpha(f,i)!=null),beat=ps.filter(i=>alpha(f,i)>0).length,si=ret(f,8),sb=bret(f,8);
  let s=ps.length?`<b>Ahead of its benchmark in ${beat} of ${ps.length}</b> periods, from 1 year to since inception. `:"";
  if(si!=null)s+=`Since launch it has compounded at <b>${si.toFixed(1)}% a year</b>${sb!=null?` against ${sb.toFixed(1)}% for the ${esc(f.b||"benchmark")}`:""}.`;
  const y1=ret(f,3);if(y1!=null&&si!=null&&y1<si-8)s+=" The last 12 months have run well below that pace.";
  return s;
}
function gauge(f){
  const ps=[3,4,5,6,7,8].filter(i=>alpha(f,i)!=null);if(!ps.length)return"";
  const b=ps.filter(i=>alpha(f,i)>0).length,fr=b/ps.length,R=44,C=2*Math.PI*R;
  return `<svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Beat benchmark in ${b} of ${ps.length} periods"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--sunk)" stroke-width="10"/><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--acc)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C*fr} ${C}" transform="rotate(-90 60 60)" style="transition:stroke-dasharray 1s"><animate attributeName="stroke-dasharray" from="0 ${C}" to="${C*fr} ${C}" dur="1s" fill="freeze"/></circle><text x="60" y="58" text-anchor="middle" font-family="Newsreader,serif" font-size="30" font-weight="300" fill="var(--ink)">${b}/${ps.length}</text><text x="60" y="76" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">periods ahead</text></svg>`;
}
function perfChart(f){
  const idx=[3,4,5,6,7,8].filter(i=>ret(f,i)!=null||bret(f,i)!=null);if(!idx.length)return"";
  const vals=idx.flatMap(i=>[ret(f,i),bret(f,i)]).filter(v=>v!=null);
  let lo=Math.min(0,...vals),hi=Math.max(0,...vals);const pad=(hi-lo)*.12||2;hi+=pad;lo=lo<0?lo-pad:0;
  const W=560,H=200,L=34,B=24,T=16,pw=W-L-8,ph=H-B-T,y=v=>T+(hi-v)/(hi-lo)*ph,gw=pw/idx.length,bw=Math.min(22,gw/3);
  const step=(hi-lo)>40?10:5,ticks=[];for(let t=Math.ceil(lo/step)*step;t<=hi;t+=step)ticks.push(t);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Annualised returns versus benchmark" class="play">`+
    ticks.map(t=>`<line x1="${L}" x2="${W-8}" y1="${y(t)}" y2="${y(t)}" stroke="${t===0?"var(--ink3)":"var(--line)"}" stroke-width="${t===0?1:.8}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")+
    idx.map((i,k)=>{const cx=L+gw*k+gw/2,v=ret(f,i),b=bret(f,i);let g="";
      if(v!=null)g+=`<rect class="grow" style="animation-delay:${k*60}ms" x="${cx-bw-1}" y="${Math.min(y(v),y(0))}" width="${bw}" height="${Math.max(1,Math.abs(y(v)-y(0)))}" rx="2" fill="${v>=0?"var(--acc)":"var(--down)"}" data-tip="<b>${PER[i]}</b> fund ${pctT(v)}${b!=null?" · index "+pctT(b):""}"/><text x="${cx-bw/2-1}" y="${v>=0?y(v)-4:y(v)+11}" text-anchor="middle" font-size="9.5" fill="var(--ink)" font-family="Geist Mono,monospace">${v.toFixed(1)}</text>`;
      if(b!=null)g+=`<rect class="grow" style="animation-delay:${k*60+30}ms" x="${cx+1}" y="${Math.min(y(b),y(0))}" width="${bw}" height="${Math.max(1,Math.abs(y(b)-y(0)))}" rx="2" fill="var(--bench)"/>`;
      return g+`<text x="${cx}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--ink2)" font-family="Geist,sans-serif">${PER[i]}</text>`}).join("")+"</svg>";
}
function lineChart(series,{W=560,H=210,years,fmt=inr,cls=""}={}){
  const all=series.flatMap(s=>s.pts),mx=Math.max(...all)*1.06,mn=Math.min(...all)*.94,L=8,R=86,T=12,B=22,pw=W-L-R,ph=H-T-B,n=series[0].pts.length-1;
  const X=i=>L+i/n*pw,Y=v=>T+(mx-v)/(mx-mn)*ph;
  const grid=[0,.25,.5,.75,1].map(t=>{const v=mn+(mx-mn)*t;return `<line x1="${L}" x2="${L+pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width=".8"/>`}).join("");
  const xt=[0,.25,.5,.75,1].map(t=>`<text x="${X(n*t)}" y="${H-5}" text-anchor="${t===0?"start":t===1?"end":"middle"}" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">${t===0?"Start":"Yr "+(years*t).toFixed(years*t%1?1:0)}</text>`).join("");
  let labels=series.map(s=>({s,y:Y(s.pts[n])})).sort((a,b)=>a.y-b.y);for(let i=1;i<labels.length;i++)if(labels[i].y-labels[i-1].y<26)labels[i].y=labels[i-1].y+26;
  const first=series[0];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" class="${cls}"><defs><linearGradient id="ga${hash(first.name)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".22"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>${grid}`+
   `<path d="M${X(0)},${Y(first.pts[0])} ${first.pts.map((v,i)=>`L${X(i)},${Y(v)}`).join(" ")} L${X(n)},${T+ph} L${X(0)},${T+ph}Z" fill="url(#ga${hash(first.name)})" class="fadein" style="animation-delay:.9s"/>`+
   series.map((s,k)=>`<path d="M${s.pts.map((v,i)=>`${X(i)},${Y(v)}`).join(" L")}" fill="none" stroke="${s.c}" stroke-width="${k?1.6:2.4}" ${s.dash?'stroke-dasharray="4 4"':'class="draw"'} stroke-linecap="round"/>`).join("")+
   `<circle cx="${X(n)}" cy="${Y(first.pts[n])}" r="4" fill="var(--acc)" class="pulse"/><circle cx="${X(n)}" cy="${Y(first.pts[n])}" r="4" fill="var(--acc)"/>`+
   labels.map(l=>`<g class="fadein"><text x="${L+pw+8}" y="${l.y+2}" font-size="12" font-family="Geist Mono,monospace" fill="${l.s.c}" font-weight="500">${fmt(l.s.pts[n])}</text><text x="${L+pw+8}" y="${l.y+14}" font-size="9.5" fill="var(--ink3)" font-family="Geist,sans-serif">${esc(l.s.name)}</text></g>`).join("")+xt+"</svg>";
}
function compound(r,years,start=1e7,steps=60){return Array.from({length:steps+1},(_,i)=>start*Math.pow(1+r/100,years*i/steps))}
function hbars(rows){const m=Math.max(...rows.map(r=>r[1]),1);return `<div class="hbars">${rows.map(r=>`<div class="hb"><span title="${esc(r[0])}">${esc(r[0])}</span><div class="trk"><i style="width:${r[1]/m*100}%"></i></div><b>${r[1].toFixed(1)}%</b></div>`).join("")}</div>`}
const MCC={"Large Cap":"var(--acc)","Mid Cap":"#B79CFF","Small Cap":"#D9CCFF","Micro Cap":"#EDE6FF"};
function openFund(s){
  const f=DATA.find(x=>x.s===s);if(!f)return;
  const X=f.x||{},FL=[["Minimum",f.mn+(f.mnd?" (typical minimum)":"")],["Benchmark",f.b],["Fund manager",f.m],["Category",X.cat||f.c],["Launched",X.launch],["Structure",X.str],["Style",X.sty],["Concentration",X.conc],["Horizon",X.hz],["Tenure",X.tenure],["Risk",X.risk],["Management fee",X.fee],["Profit share",X.carry],["Hurdle",X.hurdle],["Exit load",X.exit]].filter(r=>r[1]);
  const mc=f.mc?f.mc.filter(r=>r[1]>0):null, si=ret(f,8), sb=bret(f,8);
  const ly=(X.launch||"").match(/(19|20)\d{2}/), yrs=Math.min(10,Math.max(1,ly?2026-+ly[0]:5));
  const grow=si!=null?lineChart([{name:"This fund",c:"var(--acc)",pts:compound(si,yrs)},...(sb!=null?[{name:f.b||"Benchmark",c:"var(--ink3)",pts:compound(sb,yrs)}]:[]),{name:"FD at 7%",c:"var(--bench)",dash:1,pts:compound(7,yrs)}],{years:yrs}):"";
  $("#drawer").innerHTML=`<div class="dhead"><button class="btn ghost" type="button" data-close>← Back</button><div style="display:flex;gap:6px"><button class="btn ghost" type="button" data-short="${f.s}">${short.has(f.s)?"★ Shortlisted":"☆ Shortlist"}</button><button class="btn" type="button" data-cmp="${f.s}">${cmp.includes(f.s)?"In compare":"+ Compare"}</button></div></div>
  <div class="dbody">
    <div><div class="dmeta">${catTags(f)}</div>
    <h3>${esc(f.n)}</h3><div class="dmeta">${esc(houseName(f.p))}${f.m&&f.p?" · ":""}${f.m?esc(f.m):""}</div></div>
    <div class="drow">${gauge(f)||""}<div class="verdict" style="${gauge(f)?"":"grid-column:1/-1"}">${verdict(f)}</div></div>
    <div class="kpis"><div><span>AUM (₹)</span><b>${fmtCr(f.aum)}</b></div><div><span>1Y</span><b>${pct(ret(f,3))}</b></div><div><span>3Y</span><b>${pct(ret(f,5))}</b></div><div><span>Since inc.</span><b>${pct(si)}</b></div></div>
    ${f.r?`<div class="panel"><h5>Annualised returns <span class="legend"><span><i style="background:var(--acc)"></i>Fund</span><span><i style="background:var(--bench)"></i>${esc(f.b||"Benchmark")}</span></span></h5>${perfChart(f)}<div class="src">Short term: ${[0,1,2].map(i=>PER[i]+" "+pctT(ret(f,i))).join(" · ")}</div></div>`:""}
    ${grow?`<div class="panel"><h5>₹1 crore over ${yrs} year${yrs>1?"s":""}, at since-inception rates</h5>${grow}<div class="src">Illustrative. Compounds each line at its since-inception annual rate; actual paths were bumpier.</div></div>`:""}
    ${mc&&mc.length?`<div class="panel"><h5>Market-cap mix</h5><div class="stack">${mc.map(r=>`<i style="flex:${r[1]};background:${MCC[r[0]]||"var(--ink3)"}" data-tip="${esc(r[0])} ${r[1]}%"></i>`).join("")}</div><div class="stackl">${mc.map(r=>`<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${MCC[r[0]]||"var(--ink3)"};margin-right:5px"></i>${esc(r[0])} <b class="num">${r[1]}%</b></span>`).join("")}</div></div>`:""}
    ${f.sec?`<div class="panel"><h5>Sectors</h5>${hbars(f.sec)}</div>`:""}
    ${f.h?`<div class="panel"><h5>Top holdings</h5>${hbars(f.h)}</div>`:""}
    ${f.a?`<div class="panel"><h5>Strategy</h5><p style="margin:0;color:var(--ink2);font-size:14px">${esc(f.a)}</p></div>`:""}
    <div class="panel"><h5>Key terms</h5><div class="facts">${FL.map(r=>`<div><span>${r[0]}</span>${esc(r[1])}</div>`).join("")}</div></div>
    <div class="band" style="grid-template-columns:1fr;padding:20px"><div><h3 style="font-size:24px">Interested in ${esc(f.n)}?</h3><p>We'll share the latest factsheet and help you compare it with two alternatives.</p></div><button class="btn" type="button" data-callback="fund:${f.s}" style="justify-self:start">Request a callback →</button></div>
    <p class="src">Source: <a href="https://www.altportfunds.com/investments/${f.s}/" target="_blank" rel="noopener">fund page on altportfunds.com</a>, collected 24 Sep 2026. Returns are time-weighted (TWRR) as reported, net of fees and before your own tax. ${SEBI_NOTE} Read the manager's latest disclosure document before investing.</p>
  </div>`;
  $("#drawer").classList.add("on");$("#drawer").setAttribute("aria-hidden","false");$("#scrim").classList.add("on");$("#drawer").scrollTop=0;
  setTimeout(()=>{const c=$("#drawer [data-close]");c&&c.focus()},50);
}
function closeFund(){$("#drawer").classList.remove("on");$("#drawer").setAttribute("aria-hidden","true");$("#scrim").classList.remove("on")}

/* ─── shortlist & compare ─── */
function toggleShort(s){short.has(s)?short.delete(s):short.add(s);store.set("short",[...short]);$("#shortCt").textContent=short.size;toast(short.has(s)?"Added to your shortlist":"Removed from your shortlist");refreshButtons()}
function toggleCmp(s){if(cmp.includes(s))cmp=cmp.filter(x=>x!==s);else{if(cmp.length>=4){toast("Compare holds four funds. Remove one first.");return}cmp.push(s)}store.set("cmp",cmp);renderTray();refreshButtons();if(current==="compare")renderCompare()}
function refreshButtons(){
  $$("[data-short]").forEach(b=>{const on=short.has(b.dataset.short);if(b.closest(".acts")){b.setAttribute("aria-pressed",on);b.querySelector("svg").setAttribute("fill",on?"currentColor":"none")}else b.textContent=on?"★ Shortlisted":"☆ Shortlist"});
  $$("[data-cmp]").forEach(b=>{const on=cmp.includes(b.dataset.cmp);if(b.closest(".acts"))b.setAttribute("aria-pressed",on);else if(b.closest(".dhead"))b.textContent=on?"In compare":"+ Compare"});
}
function renderTray(){
  const fs=cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean);
  $("#slots").innerHTML=fs.map(f=>`<span class="slot"><span>${esc(deCaps(f.n))}</span><button type="button" data-uncmp="${f.s}" aria-label="Remove ${esc(f.n)}">×</button></span>`).join("");
  $("#goCmp").textContent=`Compare ${fs.length}`;
  /* The tray belongs where funds can actually be ticked — the screener and a
     strategy page. On Managers, Insights, Tools and the content pages it is a
     floating bar with nothing to act on, and Compare is a nav item anyway. */
  const trayHere=current==="explore"||current.startsWith("fund-");
  $("#tray").classList.toggle("on",fs.length>0&&trayHere);
}
function renderCompare(){
  const fs=cmp.map(s=>DATA.find(f=>f.s===s)).filter(Boolean);
  if(!fs.length){$("#cmp").innerHTML=`<div class="tbl"><div class="empty"><p>Nothing to compare yet. Tap the compare icon on any fund in Explore, or start with a preset.</p><button class="btn" type="button" data-preset>Compare the top 3 by 3-year return</button></div></div>`;return}
  const only=$("#onlyDiff").checked;
  const rows=[["Returns"],...[3,5,7,8].map(i=>[PER[i],f=>ret(f,i),"max",v=>pct(v)]),...[3,5,8].map(i=>[PER[i]+" vs index",f=>alpha(f,i),"max",v=>v==null?"—":(v>=0?"▲ ":"▼ ")+Math.abs(v).toFixed(1)+" pts"]),
    ["Size & structure"],["Type",f=>tname(f.t)],["AUM (₹)",f=>f.aum,"max",fmtCr],["Minimum",f=>f.mn],["Benchmark",f=>f.b||"—"],["Manager",f=>f.m||"—"],["House",f=>houseName(f.p)||"—"],["Launched",f=>f.x&&f.x.launch||"—"],["Strategy",f=>f.th.join(", ")||"—"],
    ["Portfolio"],["Large / mid / small",f=>f.mc?f.mc.filter(r=>/cap/i.test(r[0])).map(r=>Math.round(r[1])).join(" / ")+"%":"—"],["Top sector",f=>f.sec?f.sec[0][0]+" "+f.sec[0][1]+"%":"—"],["Top holding",f=>f.h?f.h[0][0]+" "+f.h[0][1]+"%":"—"],
    ["Fees"],["Management fee",f=>f.x&&f.x.fee||"—"],["Profit share",f=>f.x&&f.x.carry||"—"],["Exit load",f=>f.x&&f.x.exit||"—"]];
  let body="";
  for(const r of rows){
    if(r.length===1){body+=`<tr class="grp"><th colspan="${fs.length+1}">${r[0]}</th></tr>`;continue}
    const raw=fs.map(r[1]),disp=raw.map(v=>r[3]?r[3](v):(v==null?"—":esc(v))),same=disp.every(d=>d===disp[0]);
    if(same&&only&&fs.length>1)continue;
    let best=-1;if(r[2]==="max"){const nums=raw.map(v=>v==null?-1e9:v),m=Math.max(...nums);if(m>-1e9&&nums.filter(v=>v===m).length===1)best=nums.indexOf(m)}
    body+=same&&fs.length>1?`<tr class="same"><th>${r[0]}</th><td colspan="${fs.length}" class="mergedsame">${disp[0]}, same for all</td></tr>`:`<tr><th>${r[0]}</th>${disp.map((d,k)=>`<td class="${k===best?"best":""}${r[2]?" num":""}">${d}</td>`).join("")}</tr>`;
  }
  const chart=fs.some(f=>f.r)?`<div class="ccard" style="margin-bottom:14px"><h4>Returns at a glance</h4><p class="c">Annualised, each fund against the others.</p>${cmpChart(fs)}</div>`:"";
  $("#cmp").innerHTML=chart+`<div class="ctbl"><table><thead><tr><th></th>${fs.map(f=>`<th><span class="tag t-${f.t}">${tname(f.t)}</span><b>${esc(f.n)}</b><span>${esc(houseName(f.p))}</span><div style="margin-top:6px;display:flex;gap:6px"><button class="btn ghost" type="button" data-open="${f.s}" style="padding:4px 8px;font-size:12px">Details</button><button class="btn ghost" type="button" data-uncmp="${f.s}" style="padding:4px 8px;font-size:12px">Remove</button></div></th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}
const CMPC=["var(--acc)","#2F9E8F","#D08A2E","#C0508A"];
function cmpChart(fs){
  const idx=[3,5,7,8],vals=fs.flatMap(f=>idx.map(i=>ret(f,i))).filter(v=>v!=null);if(!vals.length)return"";
  let lo=Math.min(0,...vals),hi=Math.max(0,...vals)*1.15;lo=lo<0?lo*1.2:0;
  const W=640,H=220,L=36,T=14,B=26,pw=W-L-6,ph=H-T-B,y=v=>T+(hi-v)/(hi-lo)*ph,gw=pw/idx.length,bw=Math.min(26,(gw-16)/fs.length);
  const step=(hi-lo)>40?10:5,ticks=[];for(let t=Math.ceil(lo/step)*step;t<=hi;t+=step)ticks.push(t);
  return `<svg viewBox="0 0 ${W} ${H}" class="play">`+ticks.map(t=>`<line x1="${L}" x2="${W-6}" y1="${y(t)}" y2="${y(t)}" stroke="${t?"var(--line)":"var(--ink3)"}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")+
   idx.map((i,k)=>{const x0=L+gw*k+(gw-bw*fs.length)/2;return fs.map((f,j)=>{const v=ret(f,i);if(v==null)return"";return `<rect class="grow" style="animation-delay:${(k*fs.length+j)*40}ms" x="${x0+j*bw+1}" y="${Math.min(y(v),y(0))}" width="${bw-2}" height="${Math.max(1,Math.abs(y(v)-y(0)))}" rx="2" fill="${CMPC[j]}" data-tip="<b>${esc(f.n)}</b><br>${PER[i]}: ${pctT(v)}"/>`}).join("")+`<text x="${L+gw*k+gw/2}" y="${H-7}" text-anchor="middle" font-size="11" fill="var(--ink2)" font-family="Geist,sans-serif">${PER[i]}</text>`}).join("")+"</svg>"+
   `<div class="legend" style="margin-top:6px;flex-wrap:wrap">${fs.map((f,j)=>`<span><i style="background:${CMPC[j]}"></i>${esc(f.n)}</span>`).join("")}</div>`;
}

/* ─── managers ─── */
let MGR=[];
function buildMgr(){const m={};DATA.forEach(f=>{if(!f.p)return;(m[f.p]=m[f.p]||{p:f.p,fs:[],types:new Set(),aum:0});m[f.p].fs.push(f);m[f.p].types.add(f.t);if(f.aum)m[f.p].aum+=f.aum});
  MGR=Object.values(m).map(x=>{x.y3=median(x.fs.map(f=>ret(f,5)).filter(v=>v!=null));return x})}
function renderMgr(){
  const q=$("#mSearch").value.toLowerCase(),S=$("#mSort").value,nv=v=>v==null?-1e9:v;
  let L=MGR.filter(x=>!q||x.p.toLowerCase().includes(q));
  L.sort(S==="aum"?(a,b)=>b.aum-a.aum:S==="y3"?(a,b)=>nv(b.y3)-nv(a.y3):(a,b)=>b.fs.length-a.fs.length);
  $("#mgrs").innerHTML=L.slice(0,90).map(x=>`<button class="mgr" type="button" data-mgr="${esc(x.p)}"><div class="top"><b>${esc(houseName(x.p))}</b></div><div class="pills">${[...x.types].map(t=>`<span class="tag t-${t}">${tname(t)}</span>`).join("")}</div><dl><div><dt>Strategies</dt><dd>${x.fs.length}</dd></div><div><dt>AUM (₹)</dt><dd>${x.aum?fmtCr(x.aum):"—"}</dd></div><div><dt>Median 3Y</dt><dd>${x.y3==null?"—":x.y3.toFixed(1)+"%"}</dd></div></dl></button>`).join("")+(L.length>90?`<p class="note">Showing 90 of ${L.length}. Search to narrow the list.</p>`:"");
}

/* ─── research notes ─── */
const FIND=[
 ["Entry","Let people ask, then show what you understood","Investors describe needs (“steady income”, “small caps that beat the index”), not product codes. Platforms like YCharts and Orion now take plain-language queries. Trust holds when the system shows its interpretation as filters the investor can edit.","The search bar turns intent into removable chips: product, strategy, period, return floor, benchmark, AUM, manager."],
 ["Entry","Offer goals before filters","A blank screener with twenty controls stalls first-time users. Goal cards work as preset filter bundles, the same idea as Fidelity's and Capital Group's preset screens, and they teach the filters by example.","Four goal cards set filters and scroll to results. Every filter stays adjustable."],
 ["Density","Reveal depth on demand, except when comparing","Show the decision-critical summary first and hold the rest one tap away. NN/g and UXPin both flag the exception: anything being compared has to be visible at the same time.","Rows show three return periods plus the benchmark gap. The drawer holds holdings, sectors and fees. The compare view shows everything."],
 ["Honesty","Never show a return without its benchmark","SEBI's December 2022 circular standardised PMS reporting on TWRR against APMI benchmarks so investors could compare fairly. A bare “24% CAGR” invites the wrong conclusion.","Every return carries a ▲/▼ gap to its index, charts pair fund and benchmark bars, and you can sort by lead over benchmark."],
 ["Comparison","Highlight differences, merge sameness","NN/g's rules for comparison tables: consistent attributes, key differentiators first, identical cells merged so the eye lands on what differs.","The best value per row is highlighted; identical rows merge into one faded cell or can be hidden."],
 ["Comprehension","Say what the numbers mean in one line","Investors skim. A one-line verdict (“ahead of its benchmark in 5 of 6 periods”) makes a chart readable before it is studied, and flags a weak recent year plainly.","Every fund opens with a verdict and a beat-rate gauge above the data."],
 ["Visual","Use pictures for style, not decoration","Morningstar's Style Box lasted because size and style read instantly as a shape. For Indian PMS, the market-cap mix and sector weights play that role.","Market-cap bar, sector and holding bars on a shared scale, and a growth-of-₹1-crore line."],
 ["Mobile","Tables need a mobile plan","NN/g: on small screens, lock headers and let people pick a subset of columns. Horizontal scroll is acceptable only for true comparison tables.","Screener rows turn into cards, filters become a bottom sheet, and compare scrolls sideways."],
 ["Continuity","Remember intent across visits","People decide over days, not minutes. A persistent shortlist and compare tray let them collect candidates while browsing instead of juggling tabs.","Shortlist and compare tray are saved on this device."],
 ["Trust","Show provenance next to every number","Aggregated data should say where and when it came from. Missing data should look missing, not zero.","A source link and collection date on every fund; a dash, never a guessed zero."]
];

/* ─── home widgets ─── */
const GOALS=[
 ["Growth","Compound in equities","Multi-cap and small-cap PMS that beat their index over three years.",s=>{s.types.add("PMS");["Small cap","Mid cap","Multi / flexi"].forEach(t=>s.themes.add(t));s.beat=true;s.data=true;s.sort="ret"}],
 ["Income","Earn a steady yield","Private credit and debt strategies across AIF and PMS.",s=>{s.themes.add("Credit & debt")}],
 ["Diversify","Invest outside India","GIFT City and global funds, in US dollars.",s=>{s.types.add("GIFT");s.types.add("INTL")}],
 ["Lower ticket","Start from ₹10 lakh","Specialised Investment Funds: long-short at a mutual-fund-sized minimum.",s=>{s.types.add("SIF")}]
];
function renderGoals(){$("#goals").innerHTML=GOALS.map((g,i)=>{const st=defaultState();g[3](st);const n=filterWith(st).length;return `<button class="goal" type="button" data-goal="${i}"><small>${g[0]}</small><b>${g[1]}</b><span>${g[2]}</span><span class="gc">${n.toLocaleString("en-IN")} funds →</span></button>`}).join("")}
function statsHTML(){const c=counts("t"),/* a scheme with an all-null return array has no history; count real values
     so this agrees with the Market pulse sample below it */
    withR=DATA.filter(f=>f.r&&f.r.some(v=>v!=null&&v!==0)).length,mgr=new Set(DATA.map(f=>f.p).filter(Boolean)).size;
  return [[DATA.length,"strategies tracked"],[mgr,"named portfolio managers"],[withR,"with return history"],[(c.GIFT||0)+(c.SIF||0)+(c.INTL||0),"GIFT City, SIF & global"]].map(x=>`<div><b class="num" data-count="${x[0]}">${x[0].toLocaleString("en-IN")}</b><span>${x[1]}</span></div>`).join("")}
function countUp(root){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;$$("[data-count]").filter(e=>root.contains(e)).forEach(e=>{const to=+e.dataset.count,t0=performance.now();const f=t=>{const p=Math.min(1,(t-t0)/1100),v=Math.round(to*(1-Math.pow(1-p,3)));e.textContent=v.toLocaleString("en-IN");if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
function renderHero(){
  const P=DATA.filter(f=>f.t==="PMS"&&ret(f,7)!=null),v5=P.map(f=>ret(f,7)).sort((a,b)=>b-a);
  const tq=median(v5.slice(0,Math.ceil(v5.length/4))),md=median(v5),bm=median(P.map(f=>bret(f,7)).filter(v=>v!=null));
  const s=[{name:"Top-quartile PMS",c:"var(--acc)",pts:compound(tq,5)},{name:"Median PMS",c:"var(--ink2)",pts:compound(md,5)},{name:"BSE 500 TRI (median)",c:"var(--ink3)",pts:compound(bm,5)},{name:"FD at 7%",c:"var(--bench)",dash:1,pts:compound(7,5)}];
  $("#heroViz").innerHTML=`<h3>₹1 crore, five years ago</h3><div class="big num" data-count-cr="${s[0].pts[60]}">${inr(s[0].pts[60])}</div><div class="cap">What the top quarter of ${v5.length} PMS strategies turned it into, against the median manager, the index and a fixed deposit.</div>${lineChart(s,{years:5,W:520,H:230})}<div class="src" style="position:relative">Compounded at each group's median 5-year CAGR. TWRR, net of fees.</div>`;
}
function renderTicker(){const L=DATA.filter(f=>ret(f,5)!=null&&(f.aum||0)>=100&&alpha(f,5)>0).sort((a,b)=>alpha(b,5)-alpha(a,5)).slice(0,22);
  const h=L.map(f=>`<button type="button" class="titem" data-open="${f.s}"><b>${esc(f.n)}</b><span class="num">${pctT(ret(f,5))}</span><small>3Y · ▲${alpha(f,5).toFixed(1)} pts vs index</small></button>`).join("");$("#ticker").innerHTML=h+h}

/* ─── market pulse charts ─── */
function chHist(){
  const P=DATA.filter(f=>f.t==="PMS"&&ret(f,5)!=null),v=P.map(f=>ret(f,5)),bm=median(P.map(f=>bret(f,5)).filter(x=>x!=null));
  const lo=-10,hi=45,st=2.5,bins=[];for(let x=lo;x<hi;x+=st)bins.push({x,n:0});
  v.forEach(r=>{const i=Math.max(0,Math.min(bins.length-1,Math.floor((r-lo)/st)));bins[i].n++});
  const W=560,H=220,L=6,T=14,B=26,pw=W-L*2,ph=H-T-B,mx=Math.max(...bins.map(b=>b.n)),bw=pw/bins.length,X=x=>L+(x-lo)/(hi-lo)*pw,Y=n=>T+ph-n/mx*ph;
  const beat=v.filter((r,i)=>r>bm).length;
  return `<h4>How 3-year PMS returns spread out</h4><p class="c">${v.length} strategies. <b>${Math.round(beat/v.length*100)}%</b> beat the median benchmark of ${bm.toFixed(1)}% a year.</p><svg viewBox="0 0 ${W} ${H}">`+
   bins.map((b,k)=>`<rect class="grow" style="animation-delay:${k*18}ms" x="${X(b.x)+1}" y="${Y(b.n)}" width="${bw-2}" height="${ph-(Y(b.n)-T)}" rx="2" fill="${b.x>=bm?"var(--acc)":"var(--bench)"}" data-tip="<b>${b.x}% to ${b.x+st}%</b><br>${b.n} strategies · click to filter" data-hist="${b.x}" style="cursor:pointer;animation-delay:${k*18}ms"/>`).join("")+
   `<line x1="${X(bm)}" x2="${X(bm)}" y1="${T-4}" y2="${T+ph}" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="${X(bm)+5}" y="${T+6}" font-size="11" fill="var(--ink)" font-family="Geist,sans-serif">Index ${bm.toFixed(1)}%</text>`+
   [-10,0,10,20,30,40].map(t=>`<text x="${X(t)}" y="${H-6}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")+`</svg><div class="foot">3-year annualised TWRR. Click a bar to see those funds.</div>`;
}
function chScatter(){
  const P=DATA.filter(f=>ret(f,5)!=null&&f.aum>1);const W=560,H=240,L=34,R=8,T=12,B=28,pw=W-L-R,ph=H-T-B;
  const xs=P.map(f=>Math.log10(f.aum)),x0=Math.floor(Math.min(...xs)),x1=Math.ceil(Math.max(...xs));
  const ys=P.map(f=>ret(f,5)),y0=Math.max(-20,Math.floor(Math.min(...ys)/10)*10),y1=Math.min(80,Math.ceil(Math.max(...ys)/10)*10);
  const X=v=>L+(v-x0)/(x1-x0)*pw,Y=v=>T+(y1-Math.max(y0,Math.min(y1,v)))/(y1-y0)*ph;
  const yt=[];for(let t=y0;t<=y1;t+=10)yt.push(t);
  return `<h4>Size vs 3-year return</h4><p class="c">Each dot is a strategy. <span style="color:var(--acc)">●</span> ahead of its index, <span style="color:var(--bench)">●</span> behind. Big funds cluster tighter; the extremes are small.</p><svg viewBox="0 0 ${W} ${H}">`+
   yt.map(t=>`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${t?"var(--line)":"var(--ink3)"}" stroke-width=".8"/><text x="${L-6}" y="${Y(t)+4}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")+
   Array.from({length:x1-x0+1},(_,k)=>x0+k).map(t=>`<text x="${X(t)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">₹${Math.pow(10,t).toLocaleString("en-IN")} Cr</text>`).join("")+
   P.map((f,k)=>{const a=alpha(f,5);return `<circle class="dot pop" style="animation-delay:${Math.min(900,k)}ms" cx="${X(Math.log10(f.aum)).toFixed(1)}" cy="${Y(ret(f,5)).toFixed(1)}" r="3.2" fill="${a!=null&&a>0?"var(--acc)":"var(--bench)"}" fill-opacity=".75" data-open="${f.s}" data-tip="<b>${esc(f.n)}</b><br>3Y ${pctT(ret(f,5))}${a!=null?" · "+(a>=0?"▲":"▼")+Math.abs(a).toFixed(1)+" vs index":""}<br>AUM ${fmtCr(f.aum)}"/>`}).join("")+`</svg><div class="foot">Log scale on AUM. Click a dot for the fund.</div>`;
}
function chRange(){
  const rows=THEMES.map(t=>{const v=DATA.filter(f=>f.th.includes(t)&&ret(f,5)!=null).map(f=>ret(f,5));return v.length>=8?{t,n:v.length,p25:quant(v,.25),md:median(v),p75:quant(v,.75)}:null}).filter(Boolean).sort((a,b)=>b.md-a.md);
  const bm=median(DATA.filter(f=>f.t==="PMS").map(f=>bret(f,5)).filter(x=>x!=null));
  const lo=Math.floor(Math.min(...rows.map(r=>r.p25))/5)*5,hi=Math.ceil(Math.max(...rows.map(r=>r.p75))/5)*5;
  const W=560,L=112,R=40,rh=26,T=8,H=T+rows.length*rh+24,pw=W-L-R,X=v=>L+(v-lo)/(hi-lo)*pw;
  const ticks=[];for(let t=lo;t<=hi;t+=5)ticks.push(t);
  return `<h4>Which strategies earned most</h4><p class="c">Middle half of 3-year returns by strategy. The dot is the median; the dashed line is the index.</p><svg viewBox="0 0 ${W} ${H}">`+
   ticks.map(t=>`<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H-20}" stroke="var(--line)" stroke-width=".8"/><text x="${X(t)}" y="${H-6}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")+
   `<line x1="${X(bm)}" x2="${X(bm)}" y1="${T}" y2="${H-20}" stroke="var(--ink)" stroke-dasharray="3 3"/>`+
   rows.map((r,k)=>{const y=T+k*rh+rh/2;return `<g style="cursor:pointer" data-theme-go="${esc(r.t)}" data-tip="<b>${esc(r.t)}</b> · ${r.n} funds<br>Median ${r.md.toFixed(1)}% · range ${r.p25.toFixed(1)}–${r.p75.toFixed(1)}%"><text x="0" y="${y+4}" font-size="12" fill="var(--ink2)" font-family="Geist,sans-serif">${esc(r.t)}</text><rect class="growx" style="animation-delay:${k*50}ms" x="${X(r.p25)}" y="${y-5}" width="${Math.max(2,X(r.p75)-X(r.p25))}" height="10" rx="5" fill="var(--tint2)"/><circle class="pop" style="animation-delay:${k*50+300}ms" cx="${X(r.md)}" cy="${y}" r="5.5" fill="var(--acc)" stroke="var(--surface)" stroke-width="2"/><text x="${W-R+6}" y="${y+4}" font-size="11" fill="var(--ink)" font-family="Geist Mono,monospace">${r.md.toFixed(1)}</text></g>`}).join("")+`</svg><div class="foot">Strategies with 8+ funds reporting a 3-year return. Click a row to filter.</div>`;
}
function chBeat(){
  const per=[3,5,7,8],P=DATA.filter(f=>f.t==="PMS");
  const rows=per.map(i=>{const v=P.filter(f=>alpha(f,i)!=null);return {i,n:v.length,b:v.filter(f=>alpha(f,i)>0).length,ma:median(v.map(f=>alpha(f,i)))}});
  const W=560,H=220,T=26,B=40,L=10,pw=W-L*2,ph=H-T-B,gw=pw/rows.length,bw=Math.min(70,gw*.5);
  return `<h4>How often managers beat the index</h4><p class="c">Share of PMS strategies ahead of their benchmark, by period. Longer records separate skill from luck.</p><svg viewBox="0 0 ${W} ${H}">`+
   `<line x1="${L}" x2="${W-L}" y1="${T+ph/2}" y2="${T+ph/2}" stroke="var(--line2)" stroke-dasharray="3 3"/><text x="${W-L}" y="${T+ph/2-5}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">50%</text>`+
   rows.map((r,k)=>{const fr=r.b/r.n,cx=L+gw*k+gw/2,h=fr*ph;return `<g data-beat="${r.i}" style="cursor:pointer" data-tip="<b>${PER[r.i]}</b>: ${r.b} of ${r.n} ahead<br>Median gap ${r.ma>=0?"+":""}${r.ma.toFixed(1)} pts"><rect x="${cx-bw/2}" y="${T}" width="${bw}" height="${ph}" rx="4" fill="var(--sunk)"/><rect class="grow" style="animation-delay:${k*90}ms" x="${cx-bw/2}" y="${T+ph-h}" width="${bw}" height="${h}" rx="4" fill="var(--acc)"/><text x="${cx}" y="${T+ph-h-7}" text-anchor="middle" font-family="Newsreader,serif" font-size="22" font-weight="300" fill="var(--ink)">${Math.round(fr*100)}%</text><text x="${cx}" y="${H-22}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="Geist,sans-serif">${PER[r.i]}</text><text x="${cx}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">n=${r.n}</text></g>`}).join("")+`</svg><div class="foot">Click a period to see the funds that beat their index over it.</div>`;
}
function renderPulse(){$("#pulse").innerHTML=[chRange(),chBeat()].map(h=>`<div class="ccard">${h}</div>`).join("");observePlay()}
let io;
function observePlay(){
  if(!("IntersectionObserver" in window))return;
  io=io||new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("play");io.unobserve(e.target)}}),{threshold:.25});
  $$(".ccard:not(.play)").forEach(c=>{const r=c.getBoundingClientRect();if(r.top>innerHeight)io.observe(c);else c.classList.add("play")});
}

/* ─── content pages ─── */
const PG=id=>PAGES[id];
const pageTitle=id=>{for(const [,items] of MENU)for(const it of items)if(it[0]===id)return it[1];const p=PG(id);return p?p.h1.replace(/<[^>]+>/g,""):id};
const pageDesc=id=>{for(const [,items] of MENU)for(const it of items)if(it[0]===id)return it[2];const p=PG(id);return p?p.lede.split(". ")[0]:""};
function liveFilter(f){const st=defaultState();(f.types||[]).forEach(t=>st.types.add(t));(f.themes||[]).forEach(t=>st.themes.add(t));if(f.beat){st.beat=true;st.period=f.beat;st.data=true}return st}
function secLive(s){
  const st=liveFilter(s.f),all=filterWith(st),key={y3:5,y5:7}[s.sort]??5;
  const L=s.sort==="aum"?sortList([...all],"aum",5):sortList(all.filter(f=>ret(f,key)!=null),"ret",key);
  const withR=all.filter(f=>ret(f,5)!=null),md=median(withR.map(f=>ret(f,5))),bt=withR.filter(f=>alpha(f,5)>0).length,big=sortList([...all],"aum",5)[0];
  const rows=L.slice(0,8);
  return `<h2>${esc(s.h)}</h2><div class="livemod"><div class="tbl">${rows.length?`<div class="tr th"><span></span><span>Fund</span><span class="r">${PER[key]}</span><span class="r">vs index</span></div>`+rows.map(f=>`<div class="tr" data-s="${f.s}" role="button" tabindex="0">${mono(f)}<div class="fname"><b>${esc(f.n)}</b><span>${sub(f)}</span></div><div class="ret r">${pct(ret(f,key))}</div><div class="ret r">${alpha(f,key)==null?'<span class="na">—</span>':`<span class="${alpha(f,key)>=0?"d-up":"d-dn"}" style="color:var(--${alpha(f,key)>=0?"up":"down"})">${alpha(f,key)>=0?"▲":"▼"} ${Math.abs(alpha(f,key)).toFixed(1)}</span>`}</div></div>`).join(""):`<div class="empty">No matching funds yet.</div>`}</div>
   <div class="livesum"><div class="kv"><span>Funds tracked</span><b>${all.length.toLocaleString("en-IN")}</b></div><div class="kv"><span>With 3-year record</span><b>${withR.length}</b></div><div class="kv"><span>Median 3Y return</span><b>${md==null?"—":md.toFixed(1)+"%"}</b></div><div class="kv"><span>Beat their index (3Y)</span><b>${withR.length?Math.round(bt/withR.length*100)+"%":"—"}</b></div><div class="kv"><span>Largest by AUM</span><b style="font-family:var(--sans);font-size:13px;text-align:right">${big&&big.aum?esc(big.n):"—"}</b></div><button class="btn" type="button" data-live='${esc(JSON.stringify(s.f))}'>See all ${all.length.toLocaleString("en-IN")} in Explore →</button></div></div>`;
}
function coverSVG(id){const h=hash(id),a=h%360;let p="";for(let i=0;i<9;i++){const y=20+i*18+((h>>i)%12);p+=`<path d="M0 ${y} C 80 ${y-30+(h>>(i+2))%40}, 160 ${y+30-(h>>(i+3))%40}, 320 ${y-10}" stroke="var(--acc)" stroke-opacity="${.12+i*.07}" fill="none" stroke-width="1.2"/>`}
  return `<svg viewBox="0 0 320 160" preserveAspectRatio="none" aria-hidden="true"><rect width="320" height="160" fill="var(--tint)"/>${p}<circle cx="${60+h%200}" cy="${40+h%70}" r="${18+h%20}" fill="var(--acc)" fill-opacity=".18"/></svg>`}
function artCard(id){const p=PG(id);return `<a class="art" href="#${id}"><div class="cover">${coverSVG(id)}</div><div class="t"><small>${esc(p.eyebrow)}</small><b>${p.h1.replace(/<[^>]+>/g,"")}</b><span>${esc(p.lede)}</span></div></a>`}
const WRAP_ROWS=[["Minimum","₹500 (SIP)","₹10 lakh","₹50 lakh","₹1 crore","US$150,000 typical"],["Regulator","SEBI","SEBI (MF framework)","SEBI","SEBI","IFSCA"],["You own","Fund units","Fund units","Shares in your demat","Fund units","Fund units"],["Liquidity","Daily","Daily to periodic","Sell any time; exit load years 1–3","Cat I/II locked 3–10 yrs; Cat III often open","Varies; many close-ended"],["Tax","MF rules","MF rules","Each trade taxed in your hands","Cat I/II pass-through; Cat III at fund level","IFSC regime"],["Fees","TER-capped, ~0.5–2%","TER-capped","Fixed, or fixed + profit share","~2% + ~20% carry","Management + performance"],["Can short or hedge","Barely","Up to 25% unhedged short","No","Cat III yes, with leverage","Depends on scheme"],["Best for","Core long-term savings","Long-short at a lower ticket","Concentrated equity, full transparency","Private credit, PE, hedged books","Dollar exposure, NRIs"]];
function secWrappers(){return `<div class="ptable"><table><thead><tr><th></th><th>Mutual fund</th><th>SIF</th><th>PMS</th><th>AIF</th><th>GIFT City fund</th></tr></thead><tbody>${WRAP_ROWS.map(r=>`<tr><td>${r[0]}</td>${r.slice(1).map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="note">For orientation. Tax rules change with each Finance Act and depend on residency; confirm with your tax adviser.</p>`}
function formHTML(p){return `<form class="cbform" id="${p}form" novalidate>
  <label class="fl"><span>First name *</span><input id="${p}first" autocomplete="given-name" required></label>
  <label class="fl"><span>Last name</span><input id="${p}last" autocomplete="family-name"></label>
  <label class="fl full"><span>Email *</span><input id="${p}email" type="email" autocomplete="email" required></label>
  <label class="fl"><span>Mobile *</span><span class="ph"><select id="${p}cc" aria-label="Country code"><option>+91</option><option>+971</option><option>+65</option><option>+44</option><option>+1</option><option>+61</option><option>+852</option></select><input id="${p}phone" type="tel" inputmode="numeric" autocomplete="tel-national" required></span></label>
  <label class="fl"><span>City *</span><input id="${p}city" autocomplete="address-level2" required></label>
  <label class="fl full"><span>Interested in *</span><select id="${p}interest" required><option value="">Choose one</option><option>PMS · from ₹50 lakh</option><option>AIF · from ₹1 crore</option><option>SIF · from ₹10 lakh</option><option>GIFT City fund · from US$150,000</option><option>Not sure yet, help me choose</option></select></label>
  <label class="fl full"><span>Best time to call</span><select id="${p}time"><option>Any time</option><option>Morning (9–12)</option><option>Afternoon (12–4)</option><option>Evening (4–8)</option></select></label>
  <label class="consent full"><input type="checkbox" id="${p}consent"><span>I agree to be contacted about my enquiry and accept the <a href="#privacy">Privacy Policy</a>.</span></label>
  <div class="msg full" id="${p}msg" role="alert"></div>
  <button class="btn full" type="submit">Request my callback <span aria-hidden="true">→</span></button>
  <p class="mdisc full">Investing in PMS, AIFs, SIFs and GIFT City funds carries market risk. Read all scheme documents carefully.</p>
</form>`}
function renderSection(s){
  switch(s.t){
   case "prose":return (s.h?`<h2>${s.h}</h2>`:"")+`<div class="prose">${s.b}</div>`;
   case "steps":return `<h2>${s.h}</h2><div class="steps">${s.items.map(i=>`<div class="step"><b>${i[0]}</b><p>${i[1]}</p></div>`).join("")}</div>`;
   case "split":return `<h2>${s.h}</h2><div class="split"><div class="g"><h5>Good fit if</h5><ul>${s.good.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="b"><h5>Think twice if</h5><ul>${s.bad.map(x=>`<li>${x}</li>`).join("")}</ul></div></div>`;
   case "table":return `<h2>${s.h}</h2><div class="ptable"><table><thead><tr>${s.head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${s.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
   case "faq":return `<h2>${s.h||"Questions investors ask"}</h2><div class="faqs">${s.items.map((q,i)=>`<details${i===0?" open":""}><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join("")}</div>`;
   case "live":return secLive(s);
   case "cats":return `<h2>The three categories</h2><div class="catcards">${[["aif-cat-1","Category I","Venture, angel, SME, infrastructure. Long-dated, pass-through tax."],["aif-cat-2","Category II","Private equity, private credit, real estate. The largest category."],["aif-cat-3","Category III","Long-short, arbitrage, PIPE. Can short and use leverage."]].map(c=>`<a class="catcard" href="#${c[0]}"><small>${c[1]}</small><b>${pageTitle(c[0]).replace("AIF ","")}</b><span>${c[2]}</span></a>`).join("")}</div>`;
   case "wrappers":return `<h2>Five wrappers, side by side</h2>`+secWrappers();
   case "articles":return `<div class="arts">${window.AV_ARTICLES.map(artCard).join("")}</div>`;
   case "glossary":return `<dl class="gloss">${s.items.map(g=>`<div id="g-${g[0].toLowerCase().replace(/[^a-z]+/g,"-")}"><dt>${g[0]}</dt><dd>${g[1]}</dd></div>`).join("")}</dl>`;
   case "lens":return `<div class="lens">${window.AV_LENS.map(l=>`<div><b>${l[0]}</b><p>${l[1]}</p><span>${l[2]}</span></div>`).join("")}</div>`;
   case "stats":return `<div class="statrow">${statsHTML()}</div>`;
   case "cta":return `<div class="band"><div><h3>${s.h}</h3><p>${s.b}</p></div><button class="btn" type="button" data-callback="partner">Get in touch →</button></div>`;
   case "contactform":return `<div class="inlineform"><div class="mleft"><span class="mtag">We call back within a business day</span><h3>Tell us what you're<br><em>trying to achieve.</em></h3><ul class="mlist"><li><i>1</i>Your goals, horizon and ticket size</li><li><i>2</i>A shortlist across PMS, AIF, SIF and GIFT City</li><li><i>3</i>Side-by-side numbers before any paperwork</li></ul></div><div class="mright">${formHTML("ct-")}</div></div>`;
   case "feecalc":return feeCalcHTML();
   case "growthcalc":return growthCalcHTML();
   case "quiz":return `<div class="qwrap" id="quiz"></div>`;
   case "taxmatrix":return taxMatrixHTML();
   case "taxcalc":return taxCalcHTML();
   case "people":return peopleHTML();
   case "registry":return `<div id="registryRoot"><div class="loading">Opening the registry…</div></div>`;
  }return "";
}
function renderPage(id){
  const p=PG(id);if(!p)return false;
  const crumbs=`<a href="#explore">Home</a><span>/</span><span>${esc(p.g)}</span>`;
  $("#v-page").innerHTML=`<div class="wrap"><div class="phero"><div class="crumb">${crumbs}</div><h1>${p.h1}</h1><p class="lede">${p.lede}</p>${p.facts?`<div class="factstrip">${p.facts.map(f=>`<div><span>${f[0]}</span><b>${f[1]}</b></div>`).join("")}</div>`:""}</div>
   <div class="pbody">${p.s.map(s=>`<section>${renderSection(s)}</section>`).join("")}
   ${p.rel&&p.rel.length?`<section><h2>Keep reading</h2><div class="related">${p.rel.filter(PG).map(r=>`<a href="#${r}"><small>${esc(PG(r).g)}</small><b>${pageTitle(r)}</b><span class="src">${esc(pageDesc(r))}</span></a>`).join("")}</div></section>`:""}</div></div>`;
  if(id==="fee-calculator")feeCalcRun();
  if(id==="growth-calculator")growthRun();
  if(id==="wrapper-quiz")quizStart();
  if(id==="tax")taxCalcRun();
  if(id==="registry")registryRun();
  countUp($("#v-page"));
  return true;
}

/* ─── tools ─── */
function rng(id,label,min,max,step,val,unit){return `<div class="field"><div class="lab"><label for="${id}">${label}</label><output id="${id}o" for="${id}">${val}${unit}</output></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" data-unit="${unit}"></div>`}
function feeCalcHTML(){return `<div class="calc"><form id="feeForm">${rng("fcAmt","Investment (₹ lakh)",50,500,10,100,"")}${rng("fcRet","Gross return a year",0,40,1,18,"%")}${rng("fcYrs","Years",1,15,1,7,"")}<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">${rng("fcFix","Fixed model: annual fee",0.5,3,0.25,2.5,"%")}${rng("fcHF","Hybrid: fixed part",0,2,0.25,1,"%")}${rng("fcHS","Hybrid: profit share",0,25,1,15,"%")}${rng("fcPS","Profit-only: share",0,30,1,20,"%")}${rng("fcHur","Hurdle",0,15,1,10,"%")}</form><div class="calcout"><div class="ccard play" id="fcChart"></div><div class="ptable" id="fcTable"></div></div></div>`}
function feeSim(g,y,A,fx,hf,hs,ps,hu){
  const out={Gross:[A],Fixed:[A],Hybrid:[A],"Profit share":[A]},fees={Fixed:0,Hybrid:0,"Profit share":0};let hwH=A,hwP=A;
  let vG=A,vF=A,vH=A,vP=A;
  for(let t=1;t<=y;t++){
    vG*=1+g;
    let e=vF*(1+g),fee=e*fx;vF=e-fee;fees.Fixed+=fee;
    e=vH*(1+g);let f1=e*hf,ex=Math.max(0,(e-f1)-Math.max(hwH,vH*(1+hu))),f2=ex*hs;vH=e-f1-f2;fees.Hybrid+=f1+f2;hwH=Math.max(hwH,vH);
    e=vP*(1+g);ex=Math.max(0,e-Math.max(hwP,vP*(1+hu)));const f3=ex*ps;vP=e-f3;fees["Profit share"]+=f3;hwP=Math.max(hwP,vP);
    out.Gross.push(vG);out.Fixed.push(vF);out.Hybrid.push(vH);out["Profit share"].push(vP);
  }return {out,fees};
}
function feeCalcRun(){
  const f=$("#feeForm");if(!f)return;
  const v=id=>+$("#"+id).value;
  const draw=()=>{
    $$("#feeForm input[type=range]").forEach(i=>$("#"+i.id+"o").textContent=i.value+(i.dataset.unit||""));
    const A=v("fcAmt")*1e5,g=v("fcRet")/100,y=v("fcYrs"),fx=v("fcFix")/100,hf=v("fcHF")/100,hs=v("fcHS")/100,ps=v("fcPS")/100,hu=v("fcHur")/100;
    const {out,fees}=feeSim(g,y,A,fx,hf,hs,ps,hu);
    const n=y*12,interp=a=>Array.from({length:n+1},(_,i)=>{const t=i/12,lo=Math.floor(t),hi=Math.min(y,lo+1),fr=t-lo;return a[lo]*Math.pow(a[hi]/a[lo],fr)});
    const s=[{name:"Fixed",c:"var(--acc)",pts:interp(out.Fixed)},{name:"Hybrid",c:"#2F9E8F",pts:interp(out.Hybrid)},{name:"Profit share",c:"#D08A2E",pts:interp(out["Profit share"])},{name:"Before fees",c:"var(--bench)",dash:1,pts:interp(out.Gross)}].sort((a,b)=>b.pts[n]-a.pts[n]);
    let be=null;for(let r=0;r<=60;r+=0.25){const a=feeSim(r/100,y,A,fx,hf,hs,ps,hu).out;if(a["Profit share"][y]<a.Fixed[y]){be=r;break}}
    $("#fcChart").innerHTML=`<h4>${esc(s.find(x=>!x.dash).name)} leaves you the most</h4><p class="c">At ${v("fcRet")}% gross over ${y} years. ${be!=null?`Profit-only becomes costlier than the fixed fee above about <b>${be}%</b> gross a year.`:"Profit-only stays cheaper than the fixed fee at every return up to 60%."}</p>`+lineChart(s,{years:y,W:620,H:250});
    const rows=["Fixed","Hybrid","Profit share"].map(k=>[k,out[k][y],fees[k]]).sort((a,b)=>b[1]-a[1]);
    $("#fcTable").innerHTML=`<table><thead><tr><th>Model</th><th>Final value</th><th>Total fees paid</th><th>Fees as % of gross gain</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${r[0]}${i===0?' <span class="tag" style="color:var(--up)">Lowest cost</span>':""}</td><td class="num">${inr(r[1])}</td><td class="num">${inr(r[2])}</td><td class="num">${(r[2]/(out.Gross[y]-A)*100).toFixed(1)}%</td></tr>`).join("")}</tbody></table>`;
  };
  f.addEventListener("input",draw);draw();
}
function growthCalcHTML(){return `<div class="calc"><form id="grForm"><div class="field"><label for="grFund">Fund (with a since-inception return)</label><input id="grFund" list="grList" placeholder="Start typing a fund name" type="text"><datalist id="grList"></datalist></div>${rng("grAmt","Investment (₹ lakh)",10,500,10,100,"")}${rng("grYrs","Years",1,15,1,5,"")}${rng("grFd","Fixed deposit rate",4,9,0.25,7,"%")}</form><div class="calcout"><div class="ccard play" id="grChart"></div></div></div>`}
function growthRun(){
  const withSI=DATA.filter(f=>ret(f,8)!=null).sort((a,b)=>(b.aum||0)-(a.aum||0));
  $("#grList").innerHTML=withSI.map(f=>`<option value="${esc(f.n)}">`).join("");
  $("#grFund").value=withSI[0]?withSI[0].n:"";
  const draw=()=>{
    $$("#grForm input[type=range]").forEach(i=>$("#"+i.id+"o").textContent=i.value+(i.dataset.unit||""));
    const f=withSI.find(x=>x.n===$("#grFund").value)||withSI[0];if(!f)return;
    const A=+$("#grAmt").value*1e5,y=+$("#grYrs").value,fd=+$("#grFd").value,si=ret(f,8),sb=bret(f,8);
    const s=[{name:f.n.length>22?f.n.slice(0,21)+"…":f.n,c:"var(--acc)",pts:compound(si,y,A)},...(sb!=null?[{name:f.b||"Benchmark",c:"var(--ink3)",pts:compound(sb,y,A)}]:[]),{name:`FD at ${fd}%`,c:"var(--bench)",dash:1,pts:compound(fd,y,A)}];
    const gap=s[0].pts[60]-s[s.length-1].pts[60];
    $("#grChart").innerHTML=`<h4>${inr(s[0].pts[60])} after ${y} year${y>1?"s":""}</h4><p class="c">${esc(f.n)} at its since-inception ${si.toFixed(1)}% a year. That's ${inr(Math.abs(gap))} ${gap>=0?"more":"less"} than a fixed deposit.</p>`+lineChart(s,{years:y,W:620,H:250})+`<div class="foot">Illustrative only. Real returns arrive unevenly, and past performance does not predict future returns. <button class="btn ghost" type="button" data-open="${f.s}" style="padding:3px 8px;font-size:12px">Open fund</button></div>`;
  };
  $("#grForm").addEventListener("input",draw);$("#grFund").addEventListener("change",draw);draw();
}
const QZ=[["How much could you invest?",["Under ₹25 lakh","₹25–50 lakh","₹50 lakh–1 crore","More than ₹1 crore"]],["When might you need this money?",["Within 3 years","3–5 years","5–7 years","Not for 7+ years"]],["What matters most?",["Growth, even if bumpy","Regular income","A smoother ride","Dollar and global exposure"]],["If it fell 25% in a year, you would…",["Sell to stop the pain","Worry, but hold","Hold and wait","Add more"]]];
let qa=[];
function quizStart(){qa=[];quizQ()}
function quizQ(){const i=qa.length,el=$("#quiz");if(!el)return;if(i>=QZ.length)return quizResult();
  el.innerHTML=`<div class="qprog"><i style="width:${i/QZ.length*100}%"></i></div><p class="src">Question ${i+1} of ${QZ.length}</p><h3>${QZ[i][0]}</h3><div class="qopts">${QZ[i][1].map((o,k)=>`<button type="button" data-q="${k}">${o}</button>`).join("")}</div>`}
function quizResult(){
  const [amt,hz,goal,tol]=qa;let w,why,f,page;
  if(goal===3){w="GIFT City funds";why="You want dollar exposure. GIFT City funds invest in USD under IFSCA, and residents can use the LRS route.";f={types:["GIFT"]};page="gift-city"}
  else if(amt===0){w="Specialised Investment Funds";why="At under ₹25 lakh, SIFs are the only professional long-short option, with mutual-fund taxation and a ₹10 lakh minimum.";f={types:["SIF"]};page="sif"}
  else if(goal===1&&amt===3&&hz>=1){w="Private credit AIFs";why="You want income and can commit ₹1 crore for three years or more. Credit AIFs target 11–16% gross yields, paid quarterly.";f={themes:["Credit & debt"],types:["AIF"]};page="private-credit"}
  else if(goal===2||tol<=1){w=amt>=2?"Long-short (SIF or Cat III)":"Long-short SIFs";why="A smoother ride matters to you. Long-short strategies hedge part of the market's fall, at the cost of some upside.";f={themes:["Long-short"]};page="long-short"}
  else if(amt===3&&hz===3&&tol>=2){w="PMS core + PE/VC AIF satellite";why="Large ticket, long horizon, strong stomach. A concentrated PMS for liquid growth, with part in private equity for returns markets can't offer.";f={types:["PMS"],beat:5};page="private-equity"}
  else if(amt>=2){w="Portfolio Management Services";why="You can meet the ₹50 lakh minimum and want growth. PMS gives you a concentrated equity book in your own demat, with every trade visible.";f={types:["PMS"],beat:5};page="pms"}
  else{w="Specialised Investment Funds";why="SIFs give professional long-short strategies from ₹10 lakh. Build towards the ₹50 lakh PMS threshold from there.";f={types:["SIF"]};page="sif"}
  const st=liveFilter(f),n=filterWith(st).length;
  if(hz===0)why+=" <b>One caution:</b> with money needed inside three years, keep most of it in liquid funds, not alternatives.";
  $("#quiz").innerHTML=`<div class="qprog"><i style="width:100%"></i></div><p class="src">Your starting point</p><h3>${w}</h3><p style="color:var(--ink2);font-size:16px;max-width:60ch">${why}</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="btn" type="button" data-live='${esc(JSON.stringify(f))}'>See ${n.toLocaleString("en-IN")} matching funds →</button><a class="btn ghost" href="#${page}" style="text-decoration:none">Read the guide</a><button class="btn ghost" type="button" data-qrestart>Start again</button><button class="btn ghost" type="button" data-callback="quiz">Talk it through</button></div><p class="note">A starting point, not advice. Your full financial picture matters.</p>`;
}

/* ─── menu & footer ─── */
function buildMenus(){
  $("#megaGrid").innerHTML=MENU.map(([g,items])=>`<div><h6>${g}</h6>${items.map(i=>`<a href="#${i[0]}"><b>${i[1]}</b><span>${i[2]}</span></a>`).join("")}</div>`).join("");
  $("#fgrid").innerHTML=`<div class="fbrand"><a class="logo" href="#explore"><span class="mark">a</span><b>AltMarket</b></a><p>Every alternative fund in India, with the numbers that matter next to the ones they should be judged against.</p><button class="btn ghost" type="button" data-callback="footer">Request a callback</button></div>`+
   MENU.filter(m=>m[0]!=="Tools").map(([g,items])=>`<div><h6>${g}</h6>${items.slice(0,6).map(i=>`<a href="#${i[0]}">${i[1]}</a>`).join("")}</div>`).join("");
  const F=FIRM(),todo=s=>/^\[/.test(s||"")?`<span class="todo">${esc(s)}</span>`:esc(s);
  const bits=[["Registered name",F.entity],["APMI registration",F.apmi],["AMFI ARN",F.arn],["Grievance officer",F.grievanceName+" · "+F.grievanceEmail]];
  $("#fgrid").insertAdjacentHTML("afterend",`<div class="freg">${bits.map(b=>`<span><b>${b[0]}</b> ${todo(b[1])}</span>`).join("")}</div>`);
  const dr=$("#discReg");
  if(dr)dr.innerHTML=`Published by ${todo(F.entity)}, a distributor of alternative investment products, registered with APMI (${todo(F.apmi)}) and AMFI (${todo(F.arn)}). Data as compiled on the dates stated on each page.`;
}
function setMenu(on){$("#mega").classList.toggle("on",on);$("#mega").setAttribute("aria-hidden",!on);$("#menuBtn").setAttribute("aria-expanded",on)}

/* ─── callback modal ─── */
let cbSource="";
function openCb(src){cbSource=src||"";setMenu(false);
  $("#cbRight").innerHTML=`<h4 id="cbTitle">Request a callback<em>Start with a conversation.</em></h4>`+formHTML("cb-");
  $("#cbModal").classList.add("on");$("#cbModal").setAttribute("aria-hidden","false");store.set("cbSeen",1);
  setTimeout(()=>{const i=$("#cb-first");i&&i.focus()},80)}
function closeCb(){$("#cbModal").classList.remove("on");$("#cbModal").setAttribute("aria-hidden","true")}
async function submitLead(form){
  const p=form.id.replace("form",""),g=id=>$("#"+p+id),msg=g("msg");msg.textContent="";
  $$("#"+form.id+" .err").forEach(e=>e.classList.remove("err"));
  const bad=[];const need=(id,ok)=>{if(!ok){bad.push(id);g(id).classList.add("err")}};
  need("first",g("first").value.trim().length>0);
  need("email",/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g("email").value.trim()));
  const digits=g("phone").value.replace(/\D/g,"");need("phone",g("cc").value==="+91"?/^[6-9]\d{9}$/.test(digits):digits.length>=7&&digits.length<=15);
  need("city",g("city").value.trim().length>1);need("interest",!!g("interest").value);
  if(bad.length){msg.textContent=bad.includes("phone")&&bad.length===1?"Enter a valid mobile number (10 digits for India).":bad.includes("email")&&bad.length===1?"Enter a valid email address.":"Please complete the highlighted fields.";g(bad[0]).focus();return}
  if(!g("consent").checked){msg.textContent="Please tick the consent box so we can contact you.";return}
  const btn=form.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Sending…";
  const data={firstName:g("first").value.trim(),lastName:g("last").value.trim(),email:g("email").value.trim(),phone:g("cc").value+" "+digits,city:g("city").value.trim(),interest:g("interest").value,callTime:g("time").value,source:cbSource||(p==="ct-"?"contact-page":"modal"),page:current,shortlist:[...short].slice(0,10),createdAt:new Date().toISOString(),status:"new",crmStatus:"pending"};
  const db=await dbP;
  if(!db){msg.textContent="This view can't send requests. Open AltMarket on claude.ai while signed in, then try again.";btn.disabled=false;btn.textContent="Request my callback →";return}
  try{await db.collection("leads").add(data);store.set("cbDone",1);
    form.parentElement.innerHTML=`<div class="mdone"><div class="ok">✓</div><h4 style="font-family:var(--serif);font-weight:300;font-size:30px;margin:0">Thank you, ${esc(data.firstName)}.</h4><p style="margin:0;color:var(--ink2)">A specialist will call you on <b>${esc(data.phone)}</b>${data.callTime!=="Any time"?" in the "+esc(data.callTime.split(" ")[0].toLowerCase()):""}, usually within one business day.</p><p class="src" style="margin:0">Meanwhile, shortlist funds with ☆ and we'll go through them together.</p><button class="btn ghost" type="button" data-cbclose>Continue exploring</button></div>`;
  }catch(e){const c=e&&e.code;msg.textContent=c==="not_granted"||c==="permission_denied"?"Your access to this page doesn't allow sending requests. Ask the owner for 'can interact' access.":c==="rate_limited"?"Too many requests just now. Wait a minute and try again.":"The request didn't go through. Check your connection and try again.";btn.disabled=false;btn.textContent="Request my callback →"}
}
function autoCb(){if(store.get("cbSeen",0)||store.get("cbDone",0))return;let fired=false;const fire=()=>{if(fired||$("#drawer").classList.contains("on")||$("#cbModal").classList.contains("on"))return;fired=true;openCb("auto")};setTimeout(fire,45000);addEventListener("scroll",()=>{if(current==="explore"&&scrollY>document.body.scrollHeight*.55)fire()},{passive:true})}

/* ─── routing ─── */
let current="explore";
function go(id,noScroll){
  if(id==="learn")id="compare-wrappers";
  setMenu(false);closeFund();
  let ok=true;
  if(VIEWS.includes(id)){$$(".view").forEach(x=>x.hidden=x.id!=="v-"+id)}
  else if(id.startsWith("fund-")){$$(".view").forEach(x=>x.hidden=x.id!=="v-page");if(!renderFund(id.slice(5))){go("explore",1);return}}
  else if(id.startsWith("mgr-")){MGR_TAB="";MGR_SORT="y3";$$(".view").forEach(x=>x.hidden=x.id!=="v-page");if(!renderManager(id.slice(4))){go("managers",1);return}}
  else if(PG(id)&&PG(id).article){$$(".view").forEach(x=>x.hidden=x.id!=="v-page");renderArticle(id)}
  else if(PG(id)){$$(".view").forEach(x=>x.hidden=x.id!=="v-page");renderPage(id)}
  else {id="explore";$$(".view").forEach(x=>x.hidden=x.id!=="v-explore");ok=false}
  current=id;
  $$("[data-nav]").forEach(a=>a.setAttribute("aria-current",a.dataset.nav===id));
  const p=PG(id);$("#bandWrap").hidden=!!(p&&(p.legal||p.article||id==="contact"))||id==="research"||id.startsWith("mgr-")||id.startsWith("fund-");
  if(id==="compare")renderCompare();if(id==="managers")renderMgr();
  renderTray();if(!noScroll)window.scrollTo(0,0);
  try{if(("#"+id)!==location.hash)history.replaceState(null,"","#"+id)}catch(e){}
  observePlay();
}
addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(h&&h!==current)go(h)});

/* ─── events ─── */
document.addEventListener("click",e=>{
  const a=e.target.closest("a[href^='#']");
  if(a){const id=a.getAttribute("href").slice(1);if(id&&(PG(id)||VIEWS.includes(id)||id==="learn")){e.preventDefault();go(id)}return}
  const t=e.target.closest("button,[data-s],[data-open],[data-hist],[data-theme-go],[data-beat]");if(!t)return;
  if(t.dataset.callback!=null){openCb(t.dataset.callback);return}
  if(t.hasAttribute("data-cbclose")){closeCb();return}
  if(t.dataset.short){e.stopPropagation();toggleShort(t.dataset.short);return}
  if(t.dataset.cmp){e.stopPropagation();toggleCmp(t.dataset.cmp);return}
  if(t.dataset.uncmp){toggleCmp(t.dataset.uncmp);return}
  if(t.dataset.open){go("fund-"+t.dataset.open);return}
  if(t.dataset.hist!=null){toScreener(s=>{s.types.add("PMS");s.period=5;s.min=Math.floor(+t.dataset.hist);s.data=true;s.sort="ret"});return}
  if(t.dataset.themeGo){toScreener(s=>{s.themes.add(t.dataset.themeGo);s.data=true;s.sort="ret"});return}
  if(t.dataset.beat){toScreener(s=>{s.types.add("PMS");s.period=+t.dataset.beat;s.beat=true;s.data=true;s.sort="alpha"});return}
  if(t.dataset.live){const f=JSON.parse(t.dataset.live);toScreener(s=>{const l=liveFilter(f);Object.assign(s,l);s.sort=l.beat?"ret":"rel"});return}
  if(t.dataset.q!=null){qa.push(+t.dataset.q);quizQ();return}
  if(t.hasAttribute("data-qrestart")){quizStart();return}
  if(t.hasAttribute("data-close")){closeFund();return}
  if(t.hasAttribute("data-reset")){state=defaultState();apply();return}
  if(t.hasAttribute("data-go-screener")){$("#screenerSec").scrollIntoView({behavior:"smooth"});return}
  if(t.dataset.go){go(t.dataset.go);return}
  if(t.hasAttribute("data-preset")){cmp=DATA.filter(f=>ret(f,5)!=null&&f.aum>=100).sort((a,b)=>ret(b,5)-ret(a,5)).slice(0,3).map(f=>f.s);store.set("cmp",cmp);renderCompare();return}
  if(t.dataset.goal!=null){toScreener(s=>GOALS[+t.dataset.goal][3](s));return}
  if(t.dataset.mgr){go("mgr-"+slug(t.dataset.mgr));return}
  if(t.dataset.msort){const m=mgrBySlug(current.slice(4));if(m){MGR_SORT=t.dataset.msort;$("#mgrTableWrap").innerHTML=mgrTable(m,MGR_SORT,MGR_TAB)}return}
  if(t.dataset.mtab!=null&&t.hasAttribute("data-mtab")){const m=mgrBySlug(current.slice(4));if(m){MGR_TAB=t.dataset.mtab;t.parentElement.querySelectorAll("[data-mtab]").forEach(b=>b.setAttribute("aria-selected",b===t));$("#mgrTableWrap").innerHTML=mgrTable(m,MGR_SORT,MGR_TAB)}return}
  if(t.dataset.ptab){const card=t.closest(".perfcard");card.querySelectorAll("[data-ptab]").forEach(x=>x.setAttribute("aria-selected",x===t));card.querySelectorAll("[data-pane]").forEach(p=>p.hidden=p.dataset.pane!==t.dataset.ptab);return}
  if(t.hasAttribute("data-sortaum")){state.sort=state.sort==="aum"?"rel":"aum";apply();return}
  if(t.dataset.p){state.period=+t.dataset.p;state.sort="ret";apply();return}
  if(t.dataset.chip!=null){const rest=state.q.filter((_,i)=>i!==+t.dataset.chip);state=defaultState();state.sort="ret";rest.forEach(applyChip);state.q=rest;apply();return}
  if(t.id==="clearAsk"){$("#ask").value="";state=defaultState();apply();return}
  if(t.id==="menuBtn"){setMenu(!$("#mega").classList.contains("on"));return}
  if(t.closest("#fType")&&t.dataset.k){
    const k=t.dataset.k,was=state.types.has(k);
    state.types=new Set(was?[]:[k]);
    if(!was&&state.sort==="rel")state.sort="ret";   // show what performed best first
    state.q=[];apply();return}
  if(t.closest("#fTheme")&&t.dataset.k){state.themes.has(t.dataset.k)?state.themes.delete(t.dataset.k):state.themes.add(t.dataset.k);state.q=[];apply();return}
  if(t.closest("#examples")&&t.dataset.ex){$("#ask").value=t.dataset.ex;runAsk();return}
  if(t.dataset.s&&t.classList.contains("tr")){go("fund-"+t.dataset.s);return}
});
document.addEventListener("submit",e=>{if(e.target.classList.contains("cbform")){e.preventDefault();submitLead(e.target)}});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeFund();closeCb();setMenu(false);$("#filters").classList.remove("open")}
  if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("tr")&&e.target.dataset.s){e.preventDefault();go("fund-"+e.target.dataset.s)}
});
$("#cbModal").addEventListener("click",e=>{if(e.target.id==="cbModal")closeCb()});
$("#scrim").addEventListener("click",closeFund);
function runAsk(){const q=$("#ask").value.trim();if(!q){state=defaultState();apply();return}state=parseAsk(q);apply(true)}
$("#askForm").addEventListener("submit",e=>{e.preventDefault();runAsk()});
$("#fPeriod").addEventListener("change",e=>{state.period=+e.target.value;apply()});
$("#fMin").addEventListener("input",e=>{state.min=+e.target.value;if(state.min>-10)state.data=true;apply()});
$("#fBeat").addEventListener("change",e=>{state.beat=e.target.checked;apply()});
$("#fData").addEventListener("change",e=>{state.data=e.target.checked;apply()});
$("#fAum").addEventListener("change",e=>{state.aum=+e.target.value;apply()});
$("#fProv").addEventListener("input",e=>{
  state.prov=e.target.value;state.houseKey="";shown=40;provSuggest(true);renderList();});
$("#fProv").addEventListener("focus",()=>provSuggest(true));
$("#provClear").addEventListener("click",()=>{
  state.prov="";state.houseKey="";$("#fProv").value="";provSuggest(false);apply();});
document.addEventListener("click",e=>{
  if(!e.target.closest(".mgrfield"))provSuggest(false);
});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-house]");if(!b)return;
  state.houseKey=b.dataset.house;state.prov=b.dataset.house;
  $("#fProv").value=state.prov;provSuggest(false);apply();
},true);
/* houses that match what was typed, with how many strategies each runs */
function provMatches(){
  const toks=tokens(state.prov);if(!toks.length)return [];
  const by={};
  DATA.forEach(f=>{
    if(!f.p)return;
    const d=houseName(f.p);
    (by[d]=by[d]||{d,raw:new Set(),n:0,aum:0});
    by[d].raw.add(f.p);by[d].n++;by[d].aum+=f.aum||0;
  });
  return Object.values(by)
    .filter(h=>[...h.raw].some(r=>tokenHits(r+" "+h.d,toks)))
    .sort((a,b)=>b.n-a.n||b.aum-a.aum).slice(0,8);
}
function provSuggest(open){
  const box=$("#provList"),inp=$("#fProv");
  $("#provClear").hidden=!(state.prov||state.houseKey);
  if(!open||state.houseKey||!state.prov.trim()){box.innerHTML="";inp.setAttribute("aria-expanded","false");return}
  const rows=provMatches();
  inp.setAttribute("aria-expanded",rows.length?"true":"false");
  box.innerHTML=rows.length?`<div class="provlist" role="listbox">${rows.map(h=>
    `<button type="button" role="option" data-house="${esc(h.d)}"><span>${esc(h.d)}</span><b>${h.n}</b></button>`).join("")}</div>`:"";
}
$("#fShort").addEventListener("change",e=>{state.onlyShort=e.target.checked;apply()});
$("#fReset").addEventListener("click",()=>{state=defaultState();$("#ask").value="";apply()});
$("#sortSel").addEventListener("change",e=>{state.sort=e.target.value;apply()});
$("#moreBtn").addEventListener("click",()=>{shown+=40;renderList()});
$("#fOpen").addEventListener("click",()=>$("#filters").classList.add("open"));
$("#fDone").addEventListener("click",()=>$("#filters").classList.remove("open"));
$("#goCmp").addEventListener("click",()=>go("compare"));
$("#chatOpen").addEventListener("click",chatOpen);
$("#chatClose").addEventListener("click",chatClose);
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();chatSend($("#chatInput").value)});
$("#chatLog").addEventListener("click",e=>{const b=e.target.closest("[data-chatq]");if(b)chatSend(b.dataset.chatq)});
$("#onlyDiff").addEventListener("change",renderCompare);
$("#mSearch").addEventListener("input",renderMgr);$("#mSort").addEventListener("change",renderMgr);
$("#shortBtn").addEventListener("click",()=>{toScreener(s=>{s.onlyShort=true});if(!short.size)toast("Tap ☆ on any fund to add it to your shortlist")});
$("#themeBtn").addEventListener("click",()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=dark?"light":"dark";store.set("theme",r.dataset.theme)});
addEventListener("scroll",()=>$("#top").classList.toggle("scrolled",scrollY>8),{passive:true});
(()=>{const th=store.get("theme",null);if(th)document.documentElement.dataset.theme=th})();
/*MODULES*/
$("#examples").insertAdjacentHTML("beforeend",EX.map(x=>`<button type="button" data-ex="${esc(x)}">${esc(x)}</button>`).join(""));
$("#shortCt").textContent=short.size;
$("#findings").innerHTML=FIND.map(f=>`<article class="finding"><small>${f[0]}</small><h4>${f[1]}</h4><p>${f[2]}</p><div class="how"><b>In AltMarket:</b> ${f[3]}</div></article>`).join("");
buildMenus();
$("#homeArts").innerHTML=window.AV_ARTICLES.slice(0,3).map(artCard).join("");

fetch("funds.json").then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(j=>{
  DATA=j.funds;HOUSES=j.houses||{};/* keep the provenance the payload carries; v5.2 dates Market pulse from it */window.__FUNDS_META={asOf:j.asOf,sebiAsOf:j.sebiAsOf,sheetAsOf:j.sheetAsOf,source:j.source};cmp=cmp.filter(s=>DATA.some(f=>f.s===s));
  buildFilters();buildMgr();$("#heroStats").innerHTML=statsHTML();$("#annCount").textContent=DATA.length.toLocaleString("en-IN")+" funds";{const b=$("#exploreBtn");if(b)b.textContent="Explore "+DATA.length.toLocaleString("en-IN")+" funds";const cs=$("#chatSub");if(cs)cs.textContent="Searches "+DATA.length.toLocaleString("en-IN")+" schemes · books a callback"}
  renderHero();renderTicker();renderGoals();renderPulse();apply();renderTray();countUp(document.body);
  const h=(location.hash||"").slice(1);if(h&&h!=="explore")go(h);else observePlay();
  autoCb();
}).catch(err=>{$("#tbl").innerHTML=`<div class="empty"><p>The fund dataset didn't load (${esc(err.message)}). Reload the page to try again.</p></div>`});
})();
