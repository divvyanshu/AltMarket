
/* ─── v3.4 — DD/MMM/YYYY dates, compact scheme-vs-index strip, fuller strategy page ─── */

var MONS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(v){
  if(!v)return "";
  const s=String(v).trim();
  let m=s.match(/^(\d{1,2})[\s\-\/]+([A-Za-z]{3,})[\s\-\/,]+(\d{4})$/);            // 8 May 2002
  if(m){const mo=MONS.find(x=>m[2].toLowerCase().startsWith(x.toLowerCase()));if(mo)return String(m[1]).padStart(2,"0")+"/"+mo+"/"+m[3]}
  m=s.match(/^([A-Za-z]{3,})[\s\-\/,]+(\d{1,2})[\s\-\/,]+(\d{4})$/);               // May 8, 2002
  if(m){const mo=MONS.find(x=>m[1].toLowerCase().startsWith(x.toLowerCase()));if(mo)return String(m[2]).padStart(2,"0")+"/"+mo+"/"+m[3]}
  m=s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);                            // 08-10-2017 (day first)
  if(m&&+m[2]>=1&&+m[2]<=12)return String(m[1]).padStart(2,"0")+"/"+MONS[+m[2]-1]+"/"+m[3];
  m=s.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/);                            // 2017-10-08
  if(m)return String(m[3]).padStart(2,"0")+"/"+MONS[+m[2]-1]+"/"+m[1];
  m=s.match(/^([A-Za-z]{3,})[\s\-–]+(\d{4})$/);                                    // Nov – 2020
  if(m){const mo=MONS.find(x=>m[1].toLowerCase().startsWith(x.toLowerCase()));if(mo)return mo+"/"+m[2]}
  m=s.match(/^(\d{1,2})(?:st|nd|rd|th)\s+([A-Za-z]{3,})\s+(\d{4})$/);              // 30th October 2014
  if(m){const mo=MONS.find(x=>m[2].toLowerCase().startsWith(x.toLowerCase()));if(mo)return String(m[1]).padStart(2,"0")+"/"+mo+"/"+m[3]}
  if(/^\d{4}$/.test(s))return s;
  return s;
}
function launchOf(f){return fmtDate((f.x&&f.x.launch)||"")}

/* Compact replacement for the tall per-scheme chart: every scheme as one dot,
   placed by how far it is ahead of or behind its own benchmark. */
function mgrStrip(m){
  const rows=m.fs.filter(f=>alpha(f,5)!=null).map(f=>({f,a:alpha(f,5)}));
  if(rows.length<2)return "";
  const vals=rows.map(r=>r.a);
  let lo=Math.min(...vals),hi=Math.max(...vals);
  const pad=Math.max(2,(hi-lo)*0.08);lo=Math.floor((lo-pad)/5)*5;hi=Math.ceil((hi+pad)/5)*5;
  const W=660,L=14,R=14,T=26,rowsH=104,B=26,H=T+rowsH+B,pw=W-L-R;
  const X=v=>L+(v-lo)/(hi-lo)*pw;
  // lay dots out in bands so they do not sit on top of one another
  const r=rows.length>30?4.5:5.5;
  const nb=rows.length>24?7:rows.length>12?5:4;
  const bands=Array.from({length:nb},()=>[]);
  const gap=Math.min(r*2+2,(rowsH-r*2)/(nb-1));
  rows.sort((a,b)=>a.a-b.a).forEach(d=>{
    const x=X(d.a);
    let bi=bands.findIndex(b=>!b.length||x-b[b.length-1]>=r*2);
    if(bi<0)bi=bands.reduce((best,b,i)=>b[b.length-1]<bands[best][bands[best].length-1]?i:best,0);
    bands[bi].push(x);
    d.y=T+rowsH/2+(bi-(nb-1)/2)*gap;
  });
  const ahead=rows.filter(d=>d.a>0).length;
  const best=rows[rows.length-1],worst=rows[0];
  const ticks=[];const step=(hi-lo)>40?10:5;for(let t=Math.ceil(lo/step)*step;t<=hi;t+=step)ticks.push(t);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Each scheme's three-year gap to its own benchmark">
   ${ticks.map(t=>`<line x1="${X(t)}" x2="${X(t)}" y1="${T-6}" y2="${T+rowsH+4}" stroke="${t===0?"var(--ink3)":"var(--line)"}" stroke-width="${t===0?1.2:.8}"/><text x="${X(t)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist Mono,monospace">${t>0?"+":""}${t}</text>`).join("")}
   <text x="${X(0)}" y="${T-12}" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif" letter-spacing=".06em">MATCHES INDEX</text>
   ${rows.map((d,k)=>`<circle class="dot pop" style="animation-delay:${Math.min(600,k*22)}ms" cx="${X(d.a).toFixed(1)}" cy="${d.y.toFixed(1)}" r="${r}" fill="${d.a>0?"var(--s1)":"var(--down)"}" fill-opacity=".8" stroke="var(--surface)" stroke-width="1.5" data-open="${d.f.s}" data-tip="<b>${esc(d.f.n)}</b><br>3Y ${pctT(ret(d.f,5))} vs index ${pctT(bret(d.f,5))}<br>${d.a>=0?"Ahead":"Behind"} by ${Math.abs(d.a).toFixed(1)} points"/>`).join("")}
   </svg>
   <div class="stripfoot"><span><b class="num">${ahead}</b> of ${rows.length} schemes ahead of their benchmark over three years</span>
    <span class="src">Best: <a href="#fund-${best.f.s}">${esc(best.f.n.length>28?best.f.n.slice(0,27)+"…":best.f.n)}</a> ${best.a>0?"+":""}${best.a.toFixed(1)} pts · Weakest: <a href="#fund-${worst.f.s}">${esc(worst.f.n.length>28?worst.f.n.slice(0,27)+"…":worst.f.n)}</a> ${worst.a>0?"+":""}${worst.a.toFixed(1)} pts</span></div>`;
}

/* Compact bars for the strategy page: shorter, no value labels above every bar
   (the numbers live in the table tab instead). */
function perfChart(f){
  const idx=[3,4,5,6,7,8].filter(i=>ret(f,i)!=null||bret(f,i)!=null);if(!idx.length)return"";
  const vals=idx.flatMap(i=>[ret(f,i),bret(f,i)]).filter(v=>v!=null);
  let lo=Math.min(0,...vals),hi=Math.max(0,...vals);const pad=(hi-lo)*.14||2;hi+=pad;lo=lo<0?lo-pad:0;
  const W=580,H=168,L=32,B=20,T=12,pw=W-L-8,ph=H-B-T,y=v=>T+(hi-v)/(hi-lo)*ph,gw=pw/idx.length,bw=Math.min(18,gw/3.2);
  const step=(hi-lo)>45?15:(hi-lo)>25?10:5,ticks=[];for(let t=Math.ceil(lo/step)*step;t<=hi;t+=step)ticks.push(t);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Annualised returns versus benchmark" class="play">`+
    ticks.map(t=>`<line x1="${L}" x2="${W-8}" y1="${y(t)}" y2="${y(t)}" stroke="${t===0?"var(--ink3)":"var(--line)"}" stroke-width="${t===0?1:.8}"/><text x="${L-6}" y="${y(t)+3.5}" text-anchor="end" font-size="9.5" fill="var(--ink3)" font-family="Geist Mono,monospace">${t}%</text>`).join("")+
    idx.map((i,k)=>{const cx=L+gw*k+gw/2,v=ret(f,i),b=bret(f,i);let g="";
      if(v!=null)g+=`<rect class="grow" style="animation-delay:${k*55}ms" x="${cx-bw-1}" y="${Math.min(y(v),y(0))}" width="${bw}" height="${Math.max(1,Math.abs(y(v)-y(0)))}" rx="2" fill="${v>=0?"var(--s1)":"var(--down)"}" data-tip="<b>${PER[i]}</b> scheme ${pctT(v)}${b!=null?"<br>index "+pctT(b):""}"/>`;
      if(b!=null)g+=`<rect class="grow" style="animation-delay:${k*55+25}ms" x="${cx+1}" y="${Math.min(y(b),y(0))}" width="${bw}" height="${Math.max(1,Math.abs(y(b)-y(0)))}" rx="2" fill="var(--bench)" data-tip="<b>${PER[i]}</b> index ${pctT(b)}"/>`;
      return g+`<text x="${cx}" y="${H-5}" text-anchor="middle" font-size="10" fill="var(--ink2)" font-family="Geist,sans-serif">${PER[i]}</text>`}).join("")+"</svg>";
}
/* One performance block with three views, instead of two tall sections. */
function perfSection(f,grow,yrs){
  if(!f.r&&!grow)return `<section><h2>Performance</h2><div class="empty"><p>This scheme does not publish a comparable return history. Ask the manager for the latest factsheet before shortlisting it.</p></div></section>`;
  const si=ret(f,8),sb=bret(f,8);
  const kpis=[["1 year",ret(f,3),alpha(f,3)],["3 years",ret(f,5),alpha(f,5)],["5 years",ret(f,7),alpha(f,7)],["Since inception",si,alpha(f,8)]].filter(k=>k[1]!=null);
  return `<section><h2>Performance</h2>
   <div class="ccard perfcard">
    <div class="perfkpi">${kpis.map(k=>`<div><span>${k[0]}</span><b class="num">${pctT(k[1])}</b>${k[2]!=null?`<em class="${k[2]>=0?"up":"dn"}">${k[2]>=0?"▲":"▼"} ${Math.abs(k[2]).toFixed(1)} pts vs index</em>`:""}</div>`).join("")}</div>
    <div class="perftabs" role="tablist">
     <button type="button" role="tab" data-ptab="ret" aria-selected="true">vs ${esc(f.b||"benchmark")}</button>
     ${grow?`<button type="button" role="tab" data-ptab="grow" aria-selected="false">Growth of ₹1 Cr</button>`:""}
     ${f.r?`<button type="button" role="tab" data-ptab="tbl" aria-selected="false">All periods</button>`:""}
    </div>
    <div class="perfpanes">
     <div data-pane="ret">${f.r?perfChart(f)+`<div class="legend"><span><i style="background:var(--s1)"></i>This scheme</span><span><i style="background:var(--bench)"></i>${esc(f.b||"Benchmark")}</span></div>`:'<p class="foot">No return history published.</p>'}</div>
     ${grow?`<div data-pane="grow" hidden>${grow}<p class="foot">Compounded at each line's since-inception rate over ${yrs} year${yrs>1?"s":""}. Illustrative — real returns arrive unevenly.</p></div>`:""}
     ${f.r?`<div data-pane="tbl" hidden>${retTable(f)}</div>`:""}
    </div>
    ${f.odd?`<p class="oddnote"><b>Some periods withheld.</b> This scheme's filing contains return values outside any plausible range for a managed portfolio, so those periods are not shown. The rest are as filed. Check the figures directly with the manager or in the <a href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doPmr=yes" target="_blank" rel="noopener">SEBI filing</a>.</p>`:""}
    <p class="foot">Annualised beyond one year, time-weighted (TWRR), net of fees and before your tax. ${SEBI_NOTE}</p>
   </div></section>`;
}

/* ---------- Strategy page ---------- */
const isAM=f=>f.src==="altmarket";
const prov=(f,k)=>isAM(f)&&(f.provisional||[]).includes(k)?' <span class="prov" title="Provisional — awaiting confirmation from AltMarket">provisional</span>':"";
function sourceBlock(f){
  if(isAM(f))return `<tr><td>Source</td><td>Listed by AltMarket. This scheme is not on AltMarket's bulk data source, so its details are entered by hand and confirmed with the manager before they are relied on.</td></tr>`;
  if(f.src==="sebi")return `<tr><td>Source</td><td><a href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doPmr=yes" target="_blank" rel="noopener">SEBI Portfolio Manager Monthly Report</a> — the manager's own filing with the regulator${f.per?` for ${esc(perLabel(f.per))}`:""}. Returns and benchmark are as filed.</td></tr>`;
  return `<tr><td>Source</td><td><a href="https://www.altportfunds.com/investments/${f.s}/" target="_blank" rel="noopener">Scheme page on altportfunds.com</a>, which cites APMI and the manager</td></tr>`;
}
function perLabel(p){
  if(!p)return "";
  const m=String(p).match(/^(\d{4})-(\d{1,2})$/);
  return m?MONS[+m[2]-1]+" "+m[1]:p;
}
/* Registration details straight from the manager's SEBI filing. */
function regPanel(m){
  const h=houseReg(m.p);if(!h)return "";
  const rows=[["SEBI registration",h.reg],["Registered since",h.regDate?fmtDate(h.regDate):null],
    ["Principal officer",h.principal],["Compliance officer",h.compliance],
    ["Clients",h.clients!=null?h.clients.toLocaleString("en-IN"):null],
    ["Assets under management (₹)",h.aum!=null?fmtCr(h.aum):null],
    ["Registered office",h.address]].filter(r=>r[1]);
  if(!rows.length)return "";
  return `<div class="regcard"><div class="regtop"><span class="k">Filed with SEBI</span><span class="src">Monthly report for ${esc(perLabel(h.period))}</span></div>
   <div class="facts">${rows.map(r=>`<div><span>${esc(r[0])}</span>${esc(r[1])}</div>`).join("")}</div>
   ${h.principalEmail?`<p class="src">Principal officer contact: <span class="sel">${esc(h.principalEmail)}</span>${h.principalPhone&&!/^0+-?0/.test(h.principalPhone)?` · <span class="sel">${esc(h.principalPhone)}</span>`:""}</p>`:""}
   <p class="src">From the manager's own <a href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doPmr=yes" target="_blank" rel="noopener">SEBI Portfolio Manager Monthly Report</a>. Figures cover the whole firm, not one scheme.</p></div>`;
}
function houseReg(name){
  if(!name)return null;
  if(HOUSES[name])return HOUSES[name];
  const k=String(name).toLowerCase().replace(/\b(private|pvt|limited|ltd|llp|llc|inc|company|co|and|&)\b/g," ").replace(/[^a-z0-9]+/g," ").trim();
  for(const h in HOUSES){
    if(String(h).toLowerCase().replace(/\b(private|pvt|limited|ltd|llp|llc|inc|company|co|and|&)\b/g," ").replace(/[^a-z0-9]+/g," ").trim()===k)return HOUSES[h];
  }
  return null;
}
function pendingBanner(f){
  if(!f.pending)return "";
  return `<div class="pendingbar"><b>Awaiting verified data.</b> AltMarket has listed this scheme, but its returns, AUM, fees and portfolio have not been confirmed yet. Nothing is shown here that has not been verified — ask us and we will send the manager's factsheet.
   <button class="btn" type="button" data-callback="pending:${f.s}">Request details</button></div>`;
}
function asOf(f){if(f.src==="sebi"&&f.per)return perLabel(f.per);const d=(f.x&&f.x.aumDate)||"";return d?fmtDate(d):""}
function objectiveOf(f){
  const X=f.x||{};
  if(X.obj)return {text:X.obj,src:"as published by the manager"};
  if(f.a)return {text:f.a,src:"from the manager's strategy description"};
  return null;
}
function renderFund(s){
  const f=DATA.find(x=>x.s===s);if(!f)return false;
  const X=f.x||{},mgrs=fundManagers(f),house=f.p?MGR.find(m=>m.p===f.p):null;
  const si=ret(f,8),sb=bret(f,8),ly=(X.launch||"").match(/(19|20)\d{2}/),yrs=Math.min(10,Math.max(1,ly?2026-+ly[0]:5));
  const grow=si!=null?lineChart([{name:"This scheme",c:"var(--s1)",pts:compound(si,yrs)},...(sb!=null?[{name:f.b||"Benchmark",c:"var(--ink3)",pts:compound(sb,yrs)}]:[]),{name:"FD at 7%",c:"var(--bench)",dash:1,pts:compound(7,yrs)}],{years:yrs}):"";
  const mc=f.mc?f.mc.filter(r=>r[1]>0):null,obj=objectiveOf(f),dated=asOf(f);
  const approach=[["Investment approach",X.app],["Investment universe",X.uni],["Management style",X.sty],["Portfolio concentration",X.conc],["Structure",X.str],["Indicative horizon",X.hz],["Risk level",X.risk],["Tenure",X.tenure]].filter(r=>r[1]);
  const fees=[["Minimum investment",f.mn+(f.mnd?" · regulatory minimum for this product, not a scheme term":"")],["Management fee",X.fee],["Performance fee / carry",X.carry],["Hurdle rate",X.hurdle],["High-water mark",X.hwm],["Exit load",X.exit]].filter(r=>r[1]);
  $("#v-page").innerHTML=`<div class="wrap">
   <div class="crumb" style="padding-top:26px"><a href="#explore">Home</a><span>/</span>${house?`<a href="#mgr-${slug(house.p)}">${esc(houseName(house.p))}</a><span>/</span>`:""}<span>${esc(f.n)}</span></div>
   <div class="fundhead">
    <div>
     <div class="dmeta">${catTags(f)}</div>
     <h1>${esc(f.n)}</h1>
     <p class="lede">${esc(houseName(f.p)||"Manager not published")}${f.m?" · managed by "+esc(pplNames(f.m)):""}</p>
     <div class="fundcta"><button class="btn" type="button" data-callback="fund:${f.s}">Request a callback</button>
      <button class="btn ghost" type="button" data-short="${f.s}">${short.has(f.s)?"★ Shortlisted":"☆ Shortlist"}</button>
      <button class="btn ghost" type="button" data-cmp="${f.s}">${cmp.includes(f.s)?"In compare":"+ Compare"}</button></div>
    </div>
    ${gauge(f)?`<div class="fundgauge">${gauge(f)}</div>`:""}
   </div>
   <div class="factstrip five">
    <div><span>Total declared AUM (₹)</span><b class="num">${fmtCr(f.aum)}</b>${dated?`<em>as on ${esc(dated)}</em>`:""}</div>
    <div><span>Minimum investment</span><b class="num">${esc(f.mn)}</b>${f.mnd?`<em>product minimum</em>`:""}</div>
    <div><span>Inception</span><b class="num">${launchOf(f)||"—"}</b>${launchOf(f)?"":`<em>not published</em>`}</div>
    <div><span>Benchmark</span><b class="bmk">${esc(f.b||"—")}</b></div>
    <div><span>Since inception</span><b class="num">${pctT(si)}</b>${sb!=null?`<em>index ${pctT(sb)}</em>`:""}</div>
   </div>
   <div class="pbody">
    <section><div class="verdict">${verdict(f)}</div></section>

    <section><h2>Investment objective</h2>
     ${obj?`<div class="prose"><p>${esc(obj.text)}</p></div><p class="src">Stated ${obj.src}.</p>`:
      `<div class="card"><p>The source page does not publish a stated objective for this scheme. Its disclosure document will set one out, and we can request it for you.</p></div>`}</section>

    <section><h2>Investment approach</h2>
     ${approach.length?`<div class="ptable"><table><tbody>${approach.map(r=>`<tr><td style="width:230px">${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>`:""}
     ${!approach.length?`<div class="card"><p>The approach is described as ${esc(X.cat||f.c||f.th.join(", ")||tname(f.t))}. Detailed mandate terms — universe, concentration limits and style — are set out in the scheme's disclosure document rather than on its public page.</p></div>`:""}
     ${f.th.length?`<p class="src" style="margin-top:10px">Classified on AltMarket as ${f.th.map(t=>`<a href="#explore" data-theme-go="${esc(t)}">${esc(t)}</a>`).join(", ")}.</p>`:""}</section>

    ${perfSection(f,grow,yrs)}

    <section><h2>Portfolio</h2>
     ${(mc&&mc.length)||f.sec||f.h?`<div class="portgrid">
       ${f.sec?`<div class="card"><span class="k">Top sectors</span>${hbars(f.sec)}</div>`:""}
       ${f.h?`<div class="card"><span class="k">Top holdings</span>${hbars(f.h)}</div>`:""}
       ${mc&&mc.length?`<div class="card"><span class="k">Market-cap mix</span><div class="stack" style="margin-top:10px">${mc.map(r=>`<i style="flex:${r[1]};background:${MCC[r[0]]||"var(--ink3)"}" data-tip="${esc(r[0])} ${r[1]}%"></i>`).join("")}</div><div class="stackl">${mc.map(r=>`<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${MCC[r[0]]||"var(--ink3)"};margin-right:5px"></i>${esc(r[0])} <b class="num">${r[1]}%</b></span>`).join("")}</div></div>`:""}
      </div>${dated?`<p class="src" style="margin-top:10px">Portfolio data as on ${esc(dated)}.</p>`:""}`:
      `<div class="card"><p>Sector weights and holdings are not published for this scheme on its public page — they appear in the monthly factsheet. Ask us and we will send the latest one.</p>
       <button class="btn ghost" type="button" data-callback="factsheet:${f.s}" style="margin-top:10px">Request the factsheet</button></div>`}</section>

    <section><h2>Fees and exit load</h2>
     <div class="ptable"><table><tbody>${fees.map(r=>`<tr><td style="width:230px">${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}
      ${!X.fee&&!X.carry?`<tr><td>Fee schedule</td><td>Not published on the source page. Managers commonly state fees are "as per the client agreement". Typical for ${esc(tname(f.t))}: ${f.t==="PMS"?"1.5–2.5% a year fixed, or a lower fixed fee plus 10–20% of profits above a hurdle":"about 2% management fee plus 10–20% of profits above a hurdle"}.</td></tr>`:""}
      ${!X.exit?`<tr><td>Exit load</td><td>Not published. ${f.t==="PMS"?"SEBI caps PMS exit load at 3%, 2% and 1% in years one to three.":"Close-ended schemes normally have no redemption before maturity."}</td></tr>`:""}
     </tbody></table></div>
     <p class="note">Fees compound against you exactly as returns compound for you. The <a href="#fee-calculator">fee calculator</a> shows what each model costs over your holding period.</p></section>

    ${mgrs.length?`<section><h2>Who manages it</h2><div class="grid2">${mgrs.map(nm=>{const fp=managerFootprint(nm);
      return `<div class="card pmcard"><span class="k">Fund manager</span><h4>${esc(nm)}</h4>
       <dl class="pmstats"><div><dt>Schemes managed</dt><dd class="num">${fp.schemes.length}</dd></div><div><dt>Across houses</dt><dd class="num">${fp.houses.length}</dd></div><div><dt>Median 3Y</dt><dd class="num">${fp.med3==null?"—":fp.med3.toFixed(1)+"%"}</dd></div></dl>
       ${fp.schemes.length>1?`<p class="src">Also named on ${fp.schemes.filter(x=>x.s!==f.s).slice(0,3).map(x=>`<a href="#fund-${x.s}">${esc(x.n)}</a>`).join(", ")}${fp.schemes.length>4?` and ${fp.schemes.length-4} more`:""}.</p>`:""}
       <p class="note" style="margin-top:8px">Qualifications, career history and tenure on this strategy are not part of the data AltMarket holds. Ask us and we will get them from the manager.</p></div>`}).join("")}</div></section>`:""}

    ${house?`<section><a class="houselink" href="#mgr-${slug(house.p)}"><span><span class="k">Managed by</span><b>${esc(houseName(house.p))}</b><em>${house.fs.length} scheme${house.fs.length===1?"":"s"} on AltMarket${houseReg(house.p)?" · registration and firm details on the house page":""}</em></span><span class="go" aria-hidden="true">→</span></a></section>`:""}

    <section><h2>Data and disclosure</h2>
     <div class="ptable"><table><tbody>
      <tr><td style="width:230px">Returns as at</td><td>${esc(dated||"31 August 2026 (period end used by the source)")}</td></tr>
      <tr><td>Collected by AltMarket</td><td>24/Sep/2026</td></tr>
      <tr><td>Return basis</td><td>Time-weighted (TWRR), annualised beyond one year, net of fees, before your tax</td></tr>
      <tr><td>Benchmark</td><td>${esc(f.b||"Not published")}</td></tr>
      ${sourceBlock(f)}
      <tr><td>Verification</td><td>${SEBI_NOTE} Check every figure against the scheme's own disclosure document before investing.</td></tr>
     </tbody></table></div></section>

    <section><div class="band"><div><h3>Want the factsheet for ${esc(f.n.length>40?f.n.slice(0,38)+"…":f.n)}?</h3><p>We'll send the latest one and line this scheme up against two alternatives on the numbers.</p></div><button class="btn" type="button" data-callback="fund:${f.s}">Request a callback →</button></div></section>
   </div></div>`;
  return true;
}
