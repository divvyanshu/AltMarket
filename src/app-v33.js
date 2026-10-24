
/* ─── v3.3 — full scheme pages, house profiles, and the AltMarket assistant ─── */

/* ---------- Scheme (fund) pages ---------- */
function fundManagers(f){return (f.m||"").split(/\s*,\s*|\s+and\s+/).map(x=>x.trim()).filter(x=>x.length>2)}
function pplNames(s){return (s||"").replace(/\s*,\s*/g,", ").trim()}
function managerFootprint(name){
  const lc=name.toLowerCase();
  const schemes=DATA.filter(f=>(f.m||"").toLowerCase().includes(lc));
  const houses=[...new Set(schemes.map(f=>f.p).filter(Boolean))];
  const r3=schemes.map(f=>ret(f,5)).filter(v=>v!=null);
  const aum=schemes.reduce((a,f)=>a+(f.aum||0),0);
  return {schemes,houses,med3:median(r3),aum};
}
function feeRows(f){
  const X=f.x||{},rows=[["Minimum investment",f.mn+(f.mnd?" (regulatory minimum for this product, not a scheme-specific term)":"")],["Management fee",X.fee],["Performance fee / carry",X.carry],["Hurdle rate",X.hurdle],["Exit load",X.exit],["High-water mark",X.hwm]];
  return rows.filter(r=>r[1]);
}
function retTable(f){
  const per=[0,1,2,3,4,5,6,7,8];
  const have=per.filter(i=>ret(f,i)!=null||bret(f,i)!=null);
  if(!have.length)return "";
  return `<div class="ptable"><table><thead><tr><th>Period</th><th class="r">This scheme</th><th class="r">${esc(f.b||"Benchmark")}</th><th class="r">Difference</th></tr></thead>
   <tbody>${have.map(i=>{const a=ret(f,i),b=bret(f,i),d=alpha(f,i);
    return `<tr><td>${PER[i]}${i>3?" <span class='src'>annualised</span>":""}</td><td class="num r">${a==null?'<span class="na">NA</span>':pctT(a)}</td><td class="num r">${b==null?'<span class="na">NA</span>':pctT(b)}</td><td class="num r">${d==null?'<span class="na">NA</span>':`<span style="color:var(--${d>=0?"up":"down"})">${d>=0?"▲":"▼"} ${Math.abs(d).toFixed(1)} pts</span>`}</td></tr>`}).join("")}</tbody></table></div>`;
}
function renderFund_v33(s){
  const f=DATA.find(x=>x.s===s);if(!f)return false;
  const X=f.x||{},mgrs=fundManagers(f),house=f.p?MGR.find(m=>m.p===f.p):null;
  const si=ret(f,8),sb=bret(f,8),ly=(X.launch||"").match(/(19|20)\d{2}/),yrs=Math.min(10,Math.max(1,ly?2026-+ly[0]:5));
  const grow=si!=null?lineChart([{name:"This scheme",c:"var(--s1)",pts:compound(si,yrs)},...(sb!=null?[{name:f.b||"Benchmark",c:"var(--ink3)",pts:compound(sb,yrs)}]:[]),{name:"FD at 7%",c:"var(--bench)",dash:1,pts:compound(7,yrs)}],{years:yrs}):"";
  const mc=f.mc?f.mc.filter(r=>r[1]>0):null;
  const facts=[["Product",tname(f.t)],["Strategy",f.th.join(", ")||"—"],["Launched",X.launch||"Not published"],["Benchmark",f.b||"Not published"],["Structure",X.str],["Style",X.sty],["Portfolio",X.conc],["Horizon",X.hz],["Risk",X.risk],["Tenure",X.tenure],["Category",X.cat||f.c]].filter(r=>r[1]);
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
   <div class="factstrip">
    <div><span>AUM (₹)</span><b class="num">${fmtCr(f.aum)}</b></div>
    <div><span>Minimum</span><b class="num">${esc(f.mn)}</b></div>
    <div><span>Launched</span><b class="num">${esc(X.launch||"—")}</b></div>
    <div><span>Since inception</span><b class="num">${pctT(si)}</b></div>
   </div>
   <div class="pbody">
    <section><div class="verdict">${verdict(f)}</div></section>
    ${f.r?`<section><h2>Performance against ${esc(f.b||"its benchmark")}</h2>
      <div class="ccard">${perfChart(f)}<div class="legend"><span><i style="background:var(--s1)"></i>This scheme</span><span><i class="ghost"></i>${esc(f.b||"Benchmark")}</span></div></div>
      ${retTable(f)}
      <p class="note">Returns beyond one year are annualised. Calculated time-weighted (TWRR) at strategy level and reported net of fees, before your own tax. Your personal return will differ with the timing of your investment. ${SEBI_NOTE}</p></section>`:
      `<section><h2>Performance</h2><div class="empty"><p>This scheme does not publish a comparable return history. Ask the manager for the latest factsheet before shortlisting it.</p></div></section>`}
    ${grow?`<section><h2>What ₹1 crore would have become</h2><div class="ccard">${grow}<p class="foot">Compounds each line at its since-inception annual rate over ${yrs} year${yrs>1?"s":""}. Illustrative: real returns arrive unevenly, and past performance does not predict future returns.</p></div></section>`:""}
    <section><h2>Benchmark and mandate</h2>
     <div class="grid2">
      <div class="card"><span class="k">Benchmark index</span><h4>${esc(f.b||"Not published")}</h4><p>${f.b?`Chosen from the benchmarks APMI prescribes for this strategy type. Every return on this page is shown against it, because a return without its index says little on its own.`:"This scheme has not published a benchmark on the source page. Ask the manager which index the strategy is measured against."}</p></div>
      <div class="card"><span class="k">Mandate</span><h4>${esc(X.cat||f.c||f.th[0]||tname(f.t))}</h4><p>${esc(X.sty||X.str||"Detailed mandate terms are set out in the scheme's disclosure document.")}</p></div>
     </div>
     <div class="facts" style="margin-top:14px">${facts.map(r=>`<div><span>${esc(r[0])}</span>${esc(r[1])}</div>`).join("")}</div></section>
    <section><h2>Fees and terms</h2>
     ${feeRows(f).length?`<div class="ptable"><table><tbody>${feeRows(f).map(r=>`<tr><td style="width:220px">${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>`:
      `<div class="card"><p>The source page does not publish this scheme's fee schedule; managers commonly state that fees are "as per the client agreement". Typical ranges for ${esc(tname(f.t))} are ${f.t==="PMS"?"a fixed fee of about 1.5–2.5% a year, or a lower fixed fee plus 10–20% of profits above a hurdle":"about 2% management fee plus 10–20% of profits above a hurdle"}. Ask for the exact schedule, the hurdle, and whether a high-water mark applies before you sign.</p></div>`}
     <p class="note">Fees compound against you in the same way returns compound for you. Our <a href="#fee-calculator">fee calculator</a> shows what each model costs over your holding period.</p></section>
    ${mc&&mc.length?`<section><h2>Portfolio</h2><div class="grid2">
      <div class="card"><span class="k">Market-cap mix</span><div class="stack" style="margin-top:8px">${mc.map(r=>`<i style="flex:${r[1]};background:${MCC[r[0]]||"var(--ink3)"}" data-tip="${esc(r[0])} ${r[1]}%"></i>`).join("")}</div><div class="stackl">${mc.map(r=>`<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${MCC[r[0]]||"var(--ink3)"};margin-right:5px"></i>${esc(r[0])} <b class="num">${r[1]}%</b></span>`).join("")}</div></div>
      ${f.sec?`<div class="card"><span class="k">Sectors</span>${hbars(f.sec)}</div>`:""}</div>
      ${f.h?`<div class="card" style="margin-top:14px"><span class="k">Top holdings</span>${hbars(f.h)}</div>`:""}</section>`:
      (f.sec||f.h?`<section><h2>Portfolio</h2>${f.sec?`<div class="card"><span class="k">Sectors</span>${hbars(f.sec)}</div>`:""}${f.h?`<div class="card" style="margin-top:14px"><span class="k">Top holdings</span>${hbars(f.h)}</div>`:""}</section>`:"")}
    ${mgrs.length?`<section><h2>Who manages it</h2><div class="grid2">${mgrs.map(nm=>{const fp=managerFootprint(nm);
      return `<div class="card pmcard"><span class="k">Fund manager</span><h4>${esc(nm)}</h4>
       <dl class="pmstats"><div><dt>Schemes managed</dt><dd class="num">${fp.schemes.length}</dd></div><div><dt>Across houses</dt><dd class="num">${fp.houses.length}</dd></div><div><dt>Median 3Y</dt><dd class="num">${fp.med3==null?"—":fp.med3.toFixed(1)+"%"}</dd></div></dl>
       ${fp.schemes.length>1?`<p class="src">Also named on ${fp.schemes.filter(x=>x.s!==f.s).slice(0,3).map(x=>`<a href="#fund-${x.s}">${esc(x.n)}</a>`).join(", ")}${fp.schemes.length>4?` and ${fp.schemes.length-4} more`:""}.</p>`:""}
       <p class="note" style="margin-top:8px">Qualifications, career history and tenure on this strategy are not part of the data AltMarket holds. Ask us and we will get them from the manager.</p></div>`}).join("")}</div></section>`:""}
    ${f.a?`<section><h2>Strategy in the manager's words</h2><div class="prose"><p>${esc(f.a)}</p></div></section>`:""}
    ${house?`<section><h2>About ${esc(houseName(house.p))}</h2><div class="prose">${houseBlurb(house)}</div><p style="margin-top:12px"><a class="btn ghost" href="#mgr-${slug(house.p)}" style="text-decoration:none">See all ${house.fs.length} schemes from this house →</a></p></section>`:""}
    <section><div class="band"><div><h3>Want the factsheet for ${esc(f.n.length>40?f.n.slice(0,38)+"…":f.n)}?</h3><p>We'll send the latest one and line this scheme up against two alternatives on the numbers.</p></div><button class="btn" type="button" data-callback="fund:${f.s}">Request a callback →</button></div></section>
    <p class="src">Source: <a href="https://www.altportfunds.com/investments/${f.s}/" target="_blank" rel="noopener">the scheme's page on altportfunds.com</a>, collected 24 September 2026, which cites APMI and the manager. Verify every figure against the scheme's own disclosure document before investing. ${SEBI_NOTE}</p>
   </div></div>`;
  return true;
}

/* ---------- House profile, written from the data ---------- */
function houseBlurb(m){
  const n=m.fs.length,types=[...m.types].map(tname);
  const mix={};m.fs.forEach(f=>f.th.forEach(t=>mix[t]=(mix[t]||0)+1));
  const top=Object.entries(mix).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0].toLowerCase());
  const withR=m.fs.filter(f=>ret(f,5)!=null);
  const beat=withR.filter(f=>alpha(f,5)>0).length;
  const years=m.fs.map(f=>{const l=((f.x&&f.x.launch)||"").match(/(19|20)\d{2}/);return l?+l[0]:null}).filter(Boolean);
  const big=[...m.fs].sort((a,b)=>(b.aum||0)-(a.aum||0))[0];
  const best=withR.length?[...withR].sort((a,b)=>ret(b,5)-ret(a,5))[0]:null;
  const nm=houseName(m.p);
  let p1=`<p><b>${esc(nm)}</b> runs <b>${n}</b> investment approach${n===1?"":"es"} on AltMarket`;
  p1+=types.length>1?`, spanning ${types.slice(0,-1).join(", ")} and ${types[types.length-1]}`:` in ${types[0]||"alternatives"}`;
  if(m.aum)p1+=`, with <b>${fmtCr(m.aum)}</b> of reported assets across them`;
  p1+=years.length?`. The oldest strategy here dates from ${Math.min(...years)}.`:".";
  p1+="</p>";
  let p2="";
  if(top.length)p2+=`<p>The house concentrates on ${top.length>1?top.slice(0,-1).join(", ")+" and "+top[top.length-1]:top[0]} strategies`;
  if(big&&big.aum)p2+=`${top.length?", and its largest single scheme is ":"Its largest single scheme is "}<a href="#fund-${big.s}">${esc(big.n)}</a> at ${fmtCr(big.aum)}`;
  if(p2)p2+=".</p>";
  let p3="";
  if(withR.length>=3){
    const pctBeat=Math.round(beat/withR.length*100);
    p3=`<p>Of the ${withR.length} schemes with a three-year record, <b>${beat}</b> are ahead of their benchmark — ${pctBeat}%. `;
    p3+=pctBeat>=60?`That is a reasonably consistent record across the range, rather than one strong fund carrying the house.`:pctBeat>=40?`That is a mixed record: the range matters more than the house name here, so compare individual schemes rather than assuming a house style.`:`Most of the range has trailed its index over three years, so look closely at which specific scheme you are being shown and why.`;
    if(best)p3+=` The strongest three-year performer is <a href="#fund-${best.s}">${esc(best.n)}</a> at ${pctT(ret(best,5))}.`;
    p3+="</p>";
  }
  return p1+p2+p3+`<p class="src">This profile is generated from the scheme data on AltMarket, not from marketing material. Ownership, history, team size and registered office come from the manager's own disclosure document.</p>`;
}

/* ---------- The AltMarket assistant ---------- */
var CHAT=[],chatBusy=false,chatCtl=null;
function chatOpen(){$("#chatPanel").classList.add("on");$("#chatPanel").setAttribute("aria-hidden","false");setTimeout(()=>$("#chatInput")&&$("#chatInput").focus(),120);if(!CHAT.length)chatGreet()}
function chatClose(){$("#chatPanel").classList.remove("on");$("#chatPanel").setAttribute("aria-hidden","true")}
function chatGreet(){
  chatPush("assistant",`Hello. I can search ${DATA.length.toLocaleString("en-IN")} PMS, AIF, SIF and GIFT City strategies, explain how any of them work, compare them, and arrange a callback or a meeting with a specialist.<div class="chips">${["Small-cap PMS beating its index","Private credit for steady income","Compare the top 3 by 3-year return","Book a call with a specialist"].map(s=>`<button type="button" data-chatq="${esc(s)}">${esc(s)}</button>`).join("")}</div>`);
}
function chatPush(role,html,cls){
  CHAT.push({role,html});
  $("#chatLog").insertAdjacentHTML("beforeend",`<div class="msg ${role} ${cls||""}">${role==="assistant"?'<span class="who">AltMarket</span>':""}<div class="bub">${html}</div></div>`);
  $("#chatLog").scrollTop=$("#chatLog").scrollHeight;
}
function fundLine(f){return `${f.n} — ${houseName(f.p)||"manager not published"} · ${tname(f.t)}${f.th.length?" · "+f.th.join("/"):""} · 1Y ${pctT(ret(f,3))} · 3Y ${pctT(ret(f,5))} · since inception ${pctT(ret(f,8))} · benchmark ${f.b||"not published"}${alpha(f,5)!=null?` · 3Y gap to index ${alpha(f,5)>=0?"+":""}${alpha(f,5).toFixed(1)} pts`:""} · AUM ${fmtCr(f.aum)} · minimum ${f.mn} · id ${f.s}`}
function chatTools(){
  return [
   {name:"search_schemes",description:"Search AltMarket's fund data. Returns matching schemes with returns, benchmark, AUM and id.",
    inputSchema:{type:"object",properties:{text:{type:"string",description:"free text matched against scheme name, house and fund manager"},product:{type:"string",enum:["PMS","AIF","GIFT","SIF","INTL"]},strategy:{type:"string",description:"one of: "+THEMES.join(", ")},period:{type:"string",enum:["1Y","3Y","5Y","SI"],description:"period to judge returns on, default 3Y"},min_return:{type:"number"},beats_benchmark:{type:"boolean"},min_aum_cr:{type:"number"},sort:{type:"string",enum:["return","alpha","aum","name"]},limit:{type:"number"}}},
    execute:a=>{const P={"1Y":3,"3Y":5,"5Y":7,"SI":8}[a.period||"3Y"];
      const st=defaultState();st.period=P;
      if(a.product)st.types.add(a.product);
      if(a.strategy){const t=THEMES.find(x=>x.toLowerCase()===String(a.strategy).toLowerCase())||THEMES.find(x=>x.toLowerCase().includes(String(a.strategy).toLowerCase()));if(t)st.themes.add(t)}
      if(a.text)st.prov=a.text;
      if(a.min_return!=null){st.min=a.min_return;st.data=true}
      if(a.beats_benchmark){st.beat=true;st.data=true}
      if(a.min_aum_cr)st.aum=a.min_aum_cr;
      const L=sortList(filterWith(st),{return:"ret",alpha:"alpha",aum:"aum",name:"az"}[a.sort]||"ret",P);
      const lim=Math.min(a.limit||8,15);
      return {total:L.length,showing:Math.min(lim,L.length),schemes:L.slice(0,lim).map(fundLine)};}},
   {name:"get_scheme",description:"Full detail for one scheme by its id.",
    inputSchema:{type:"object",properties:{id:{type:"string"}},required:["id"]},
    execute:a=>{const f=DATA.find(x=>x.s===a.id);if(!f)return {error:"No scheme with that id."};
      const X=f.x||{};
      return {name:f.n,house:houseName(f.p),manager:f.m||null,product:tname(f.t),strategy:f.th,benchmark:f.b||null,aum_cr:f.aum,minimum:f.mn,launched:X.launch||null,
        returns:{"1M":ret(f,0),"1Y":ret(f,3),"2Y":ret(f,4),"3Y":ret(f,5),"5Y":ret(f,7),since_inception:ret(f,8)},
        benchmark_returns:{"1Y":bret(f,3),"3Y":bret(f,5),"5Y":bret(f,7),since_inception:bret(f,8)},
        fees:{management:X.fee||null,performance:X.carry||null,hurdle:X.hurdle||null,exit_load:X.exit||null},
        top_holdings:f.h||null,sectors:f.sec||null,market_cap_mix:f.mc||null,page:"#fund-"+f.s};}},
   {name:"get_house",description:"Profile of a fund house: how many schemes, total AUM, how consistently they beat their benchmark.",
    inputSchema:{type:"object",properties:{name:{type:"string"}},required:["name"]},
    execute:a=>{const q=String(a.name).toLowerCase();const m=MGR.find(x=>x.p.toLowerCase().includes(q));if(!m)return {error:"No house matched. Try search_schemes with the name as text."};
      const withR=m.fs.filter(f=>ret(f,5)!=null);
      return {house:houseName(m.p),schemes:m.fs.length,aum_cr:m.aum,products:[...m.types].map(tname),median_3y:m.y3,
        beat_benchmark_3y:withR.length?`${withR.filter(f=>alpha(f,5)>0).length} of ${withR.length}`:"no data",
        page:"#mgr-"+slug(m.p),top_schemes:withR.sort((x,y)=>ret(y,5)-ret(x,5)).slice(0,5).map(fundLine)};}},
   {name:"open_page",description:"Show the viewer a page in AltMarket: a scheme, a house, an explainer, a tool, or the screener.",
    inputSchema:{type:"object",properties:{target:{type:"string",description:"a scheme id, a house name, or one of: explore, compare, managers, insights, tax, fee-calculator, growth-calculator, wrapper-quiz, pms, aif, sif, gift-city, contact"}},required:["target"]},
    execute:a=>{const t=String(a.target).trim();
      if(DATA.some(f=>f.s===t)){go("fund-"+t);return {opened:"scheme page for "+t}}
      if(PG(t)||VIEWS.includes(t)){go(t);return {opened:t}}
      const m=MGR.find(x=>x.p.toLowerCase().includes(t.toLowerCase()));
      if(m){go("mgr-"+slug(m.p));return {opened:"house page for "+houseName(m.p)}}
      return {error:"Nothing matched that target."};}},
   {name:"add_to_compare",description:"Put up to four schemes side by side and show the comparison.",
    inputSchema:{type:"object",properties:{ids:{type:"array",items:{type:"string"}}},required:["ids"]},
    execute:a=>{const ids=(a.ids||[]).filter(id=>DATA.some(f=>f.s===id)).slice(0,4);
      if(!ids.length)return {error:"None of those ids matched."};
      cmp=ids;store.set("cmp",cmp);renderTray();go("compare");
      return {comparing:ids.map(id=>DATA.find(f=>f.s===id).n)};}},
   {name:"request_callback",description:"Ask a specialist to call the viewer, or book a meeting slot. Always collect name, email, mobile and city from the viewer first — never invent them. The viewer confirms before anything is saved.",
    inputSchema:{type:"object",properties:{first_name:{type:"string"},last_name:{type:"string"},email:{type:"string"},phone:{type:"string"},city:{type:"string"},interest:{type:"string",description:"what they want to discuss"},preferred_time:{type:"string",description:"e.g. Morning, Afternoon, or a date and time for a meeting"},kind:{type:"string",enum:["callback","meeting"]},note:{type:"string"}},required:["first_name","email","phone","city"]},
    execute:a=>chatConfirmLead(a)}
  ];
}
function chatConfirmLead(a){
  return new Promise(resolve=>{
    const id="cf"+Date.now();
    const rows=[["Name",[a.first_name,a.last_name].filter(Boolean).join(" ")],["Email",a.email],["Mobile",a.phone],["City",a.city],["About",a.interest||"Alternative investments"],["When",a.preferred_time||"Any time"],["Type",a.kind==="meeting"?"Meeting":"Callback"]];
    chatPush("assistant",`<div class="confirm" id="${id}"><b>Please check these details before I send them</b>
     <dl>${rows.map(r=>`<div><dt>${r[0]}</dt><dd>${esc(String(r[1]||"—"))}</dd></div>`).join("")}</dl>
     <label class="consent"><input type="checkbox" id="${id}c"> I agree to be contacted about this enquiry and accept the <a href="#privacy">Privacy Policy</a>.</label>
     <div class="row"><button class="btn" type="button" data-cfok="${id}">Send it</button><button class="btn ghost" type="button" data-cfno="${id}">Cancel</button></div></div>`);
    const box=$("#"+id);
    box.addEventListener("click",async e=>{
      if(e.target.dataset.cfno!=null&&e.target.closest("[data-cfno]")){box.innerHTML="<b>Cancelled.</b> Nothing was sent.";resolve({status:"cancelled_by_viewer"});return}
      if(e.target.closest("[data-cfok]")){
        if(!$("#"+id+"c").checked){box.querySelector(".consent").style.color="var(--down)";return}
        const db=await dbP;
        if(!db){box.innerHTML="<b>Could not send.</b> This view cannot reach AltMarket's request store.";resolve({status:"failed",reason:"no store in this view"});return}
        try{
          await db.collection(a.kind==="meeting"?"appointments":"leads").add({firstName:a.first_name,lastName:a.last_name||"",email:a.email,phone:a.phone,city:a.city,interest:a.interest||"",callTime:a.preferred_time||"Any time",note:a.note||"",source:"assistant",page:current,kind:a.kind||"callback",createdAt:new Date().toISOString(),status:"new",crmStatus:"pending"});
          box.innerHTML=`<b>Sent.</b> A specialist will be in touch on ${esc(a.phone)}, usually within one business day.`;
          store.set("cbDone",1);resolve({status:"saved"});
        }catch(err){box.innerHTML="<b>Could not send.</b> "+(err&&err.code==="not_granted"?"This viewer does not have permission to submit requests.":"Please try the callback form instead.");resolve({status:"failed",reason:(err&&err.code)||"error"})}
      }
    });
  });
}
function chatContext(){
  const f=current.startsWith("fund-")?DATA.find(x=>x.s===current.slice(5)):null;
  const m=current.startsWith("mgr-")?mgrBySlug(current.slice(4)):null;
  return `The viewer is on: ${f?"the scheme page for "+f.n:m?"the house page for "+houseName(m.p):PG(current)?pageTitle(current):current}.`+
   (short.size?` They have ${short.size} scheme(s) shortlisted.`:"")+(cmp.length?` They are comparing ${cmp.length}.`:"");
}
var CHAT_BRIEF=`You are the AltMarket assistant on AltMarket, an Indian alternative-investment research site run by AltMarket, an APMI-registered distributor.

What you do: help people find and understand PMS, AIF, SIF, GIFT City and international strategies; explain how these products work; compare schemes; and arrange a callback or meeting with a specialist.

Rules you must follow:
- Use the tools for every factual claim about a scheme, house or return. Never state a return, fee, AUM or benchmark from memory.
- Always show a return next to its benchmark. Never quote a return alone.
- Never recommend a specific scheme as the right one for someone, never predict returns, and never say anything is safe or guaranteed. You may explain what a strategy does, what it costs and how it has performed against its index.
- You are not an investment, tax or legal adviser. For anything personal, offer a callback with a specialist.
- Alternatives carry real risk of loss and most have lock-ins. Say so when it matters.
- If the data does not have something, say it is not published rather than guessing.
- To book anything, collect first name, email, mobile and city from the viewer in conversation. Never invent details. The viewer sees a confirmation card and consent box before anything is saved.
- Answer in plain English, in a few short paragraphs. Use the viewer's own words back. No emoji, no bold-heavy formatting, no bullet lists longer than five items.
- When you name a scheme, mention that they can open its page, and use open_page if they ask to see it.`;
async function chatSend(text){
  if(chatBusy||!text.trim())return;
  const sample=(window.claude&&window.claude.use)?await window.claude.use("sample").catch(()=>null):null;
  if(!sample){chatPush("assistant","The assistant is not available in this view. Open AltMarket on claude.ai while signed in, or use the callback form and a specialist will help.");return}
  chatPush("user",esc(text));
  $("#chatInput").value="";chatBusy=true;$("#chatSend").disabled=true;
  const holder="m"+Date.now();
  $("#chatLog").insertAdjacentHTML("beforeend",`<div class="msg assistant" id="${holder}"><span class="who">AltMarket</span><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>`);
  $("#chatLog").scrollTop=$("#chatLog").scrollHeight;
  const turns=CHAT.filter(m=>m.role==="user"||m.role==="assistant").slice(-12).map(m=>({role:m.role,content:m.html.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}));
  const input=[{role:"user",content:CHAT_BRIEF+"\n\n"+chatContext()+"\n\nToday is 26 September 2026. Fund data was collected on 24 September 2026."},
   {role:"assistant",content:"Understood. I'll use the tools for every fact and always pair a return with its benchmark."},
   ...turns.slice(0,-1),{role:"user",content:text}];
  chatCtl=new AbortController();
  try{
    const res=await sample(input,{tools:chatTools(),signal:chatCtl.signal,modelTier:"default",
      onText:({text})=>{const el=$("#"+holder);if(el)el.querySelector(".bub").innerHTML=chatFormat(text)}});
    const el=$("#"+holder);
    const html=chatFormat(res.text||"I could not put together an answer. Try rephrasing, or ask for a callback.");
    if(el)el.querySelector(".bub").innerHTML=html;
    CHAT.push({role:"assistant",html});
  }catch(e){
    const el=$("#"+holder),code=e&&e.code;
    const msg=code==="not_granted"?"You'd need to allow the assistant to run for this page. Everything else on AltMarket works without it.":
      code==="rate_limited"?"That was a lot at once. Give it a moment and ask again.":
      code==="cancelled"?"Stopped.":"Something went wrong reaching the assistant. The callback form still works.";
    if(el)el.querySelector(".bub").innerHTML=esc(msg);
    CHAT.push({role:"assistant",html:esc(msg)});
  }finally{chatBusy=false;$("#chatSend").disabled=false;$("#chatLog").scrollTop=$("#chatLog").scrollHeight}
}
function chatFormat(t){
  return esc(t).replace(/#(fund|mgr)-([a-z0-9-]+)/gi,(m,k,v)=>`<a href="#${k}-${v}">${m}</a>`)
   .replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>").replace(/^/,"<p>")+"</p>";
}
