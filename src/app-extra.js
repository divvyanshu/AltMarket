
/* ─── v3.1: tax, registry, people ─── */
var SEBI_NOTE="Performance information shown here is not verified by SEBI.";
function TAX(){return window.AV_TAX||[]}
function FIRM(){return window.AV_FIRM||{}}
function taxMatrixHTML(){
  return `<h2>Who pays the tax, and when</h2><div class="ptable"><table><thead><tr><th>Wrapper</th><th>Taxed in whose hands</th><th>Long-term listed equity</th><th>Short-term listed equity</th><th>At fund level</th></tr></thead><tbody>${TAX().map(r=>`<tr><td>${esc(r.v)}<br><span class="tag ${r.pass?"p-pass":"p-fund"}">${r.pass?"Pass-through":"Fund pays"}</span></td><td>${esc(r.who)}</td><td class="num">${r.ltcg==null?"By residency":r.ltcg+"%"}</td><td class="num">${r.stcg==null?"By residency":r.stcg+"%"}</td><td>${esc(r.fundLevel)}</td></tr><tr class="notes"><td colspan="5">${esc(r.note)}</td></tr>`).join("")}</tbody></table></div>
  <h3 class="subh">Surcharge, and the cap that saves you</h3><div class="ptable"><table><thead><tr><th>Total income</th><th>Surcharge</th><th>Effective long-term rate on listed equity</th></tr></thead><tbody>${(window.AV_SURCHARGE||[]).map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="num">${r[2]}</td></tr>`).join("")}</tbody></table></div>
  <p class="note">Rates as at September 2026, for resident individuals holding listed equity through the wrappers shown, plus 4% cess. A summary for orientation, not tax advice: residency, income mix and the fund's own structure all change the answer.</p>`;
}
function taxCalcHTML(){return `<h2>What ₹1 crore keeps, after tax</h2><p class="prose" style="margin-bottom:16px">One gross return, four wrappers. The gap is mostly about <b>when</b> tax is paid: money taxed every year stops compounding, money taxed at exit keeps working.</p>
 <div class="calc"><form id="taxForm">${rng("txAmt","Investment (₹ lakh)",25,1000,25,100,"")}${rng("txRet","Gross return a year",5,30,1,18,"%")}${rng("txYrs","Years held",1,15,1,7,"")}${rng("txTurn","PMS: share of gains realised each year",0,100,10,40,"%")}</form>
 <div class="calcout"><div class="ccard play" id="txChart"></div><div class="ptable" id="txTable"></div><p class="note">A simplification: it assumes listed-equity gains, one lump sum, no fees, and that long-term gains at exit are taxed at 12.5%. Your own position will differ.</p></div></div>`}
function taxSim(A,r,y,turn){
  const out=[];let v=A,unreal=0;
  for(let t=0;t<y;t++){const g=v*r;v+=g;const real=g*turn;unreal+=g-real;v-=real*0.20}
  v-=unreal*0.125;out.push({k:"PMS",v,d:"Taxed on every sale the manager makes, then 12.5% on what is left at exit"});
  let a=A*Math.pow(1+r,y);a-=(a-A)*0.125;out.push({k:"AIF Cat I / II",v:a,d:"Pass-through: nothing taxed until you exit, then 12.5%"});
  out.push({k:"SIF",v:a,d:"Mutual fund treatment: 12.5% on redemption"});
  let c=A;for(let t=0;t<y;t++)c+=c*r*(1-0.4274);
  out.push({k:"AIF Cat III",v:c,d:"The fund pays maximum marginal rate each year, so less capital compounds"});
  return out.sort((x,z)=>z.v-x.v);
}
function taxCalcRun(){
  const f=$("#taxForm");if(!f)return;
  const draw=()=>{
    $$("#taxForm input[type=range]").forEach(i=>$("#"+i.id+"o").textContent=i.value+(i.dataset.unit||""));
    const A=+$("#txAmt").value*1e5,r=+$("#txRet").value/100,y=+$("#txYrs").value,turn=+$("#txTurn").value/100;
    const res=taxSim(A,r,y,turn),gross=A*Math.pow(1+r,y),mx=Math.max(...res.map(x=>x.v),gross);
    const W=560,rh=48,H=res.length*rh+56,L=118,R=100,pw=W-L-R,gx=L+gross/mx*pw;
    const bars=res.map((x,k)=>{const w=x.v/mx*pw,cagr=(Math.pow(x.v/A,1/y)-1)*100;
      return `<g data-tip="<b>${esc(x.k)}</b><br>${esc(x.d)}"><text x="0" y="${k*rh+25}" font-size="12.5" fill="var(--ink)" font-family="Geist,sans-serif">${esc(x.k)}</text><text x="0" y="${k*rh+40}" font-size="10.5" fill="var(--ink3)" font-family="Geist Mono,monospace">${cagr.toFixed(1)}% net a year</text><rect class="growx" style="animation-delay:${k*90}ms" x="${L}" y="${k*rh+14}" width="${Math.max(2,w)}" height="20" rx="4" fill="${k===0?"var(--acc)":"var(--bench)"}"/><text x="${L+w+8}" y="${k*rh+29}" font-size="12" font-family="Geist Mono,monospace" fill="var(--ink)">${inr(x.v)}</text></g>`}).join("");
    $("#txChart").innerHTML=`<h4>${esc(res[0].k)} keeps the most here</h4><p class="c">₹${(A/1e5).toFixed(0)} lakh at ${$("#txRet").value}% gross for ${y} year${y>1?"s":""}. Before any tax it would be ${inr(gross)}.</p><svg viewBox="0 0 ${W} ${H}"><line x1="${gx}" x2="${gx}" y1="6" y2="${H-30}" stroke="var(--ink3)" stroke-dasharray="3 3"/><text x="${gx}" y="${H-16}" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Geist,sans-serif">before tax</text>${bars}</svg>`;
    $("#txTable").innerHTML=`<table><thead><tr><th>Wrapper</th><th>After tax</th><th>Tax paid</th><th>Share of the gross gain kept</th></tr></thead><tbody>${res.map(x=>`<tr><td>${esc(x.k)}</td><td class="num">${inr(x.v)}</td><td class="num">${inr(gross-x.v)}</td><td class="num">${((x.v-A)/(gross-A)*100).toFixed(0)}%</td></tr>`).join("")}</tbody></table>`;
  };
  f.addEventListener("input",draw);draw();
}
function peopleHTML(){const F=FIRM(),ok=s=>s&&!/^\[/.test(s);
  return `<h2>Who you will speak to</h2><div class="grid2"><div class="card"><span class="k">Your point of contact</span><h4>${esc(F.contactName)}</h4><p>Investor relations. Use the form above and she will call you back, or write to her directly.</p><p class="sel">${esc(F.contactEmail)}</p>${ok(F.phone)?`<p class="sel">${esc(F.phone)}</p>`:""}</div>
  <div class="card"><span class="k">What we are</span><h4>A distributor, not an adviser</h4><p>AltMarket distributes PMS, AIF and other alternative products. We do not manage money and we do not give personalised investment advice. Our registration details appear in the footer of every page.</p>${ok(F.address)?`<p class="sel">${esc(F.address)}</p>`:""}</div></div>`}

/* Registry — internal tracker backed by the artifact database */
function registryStatus(due){if(!due)return["none","No date set"];
  const diff=Math.round((new Date(due)-new Date("2026-09-24"))/864e5);
  return diff<0?["gap",Math.abs(diff)+" days overdue"]:diff<=7?["part","Due in "+diff+" day"+(diff===1?"":"s")]:["ok","Due "+new Date(due).toLocaleDateString("en-IN",{day:"numeric",month:"short"})]}
async function registryRun(){
  const root=$("#registryRoot");if(!root)return;
  const db=await dbP;
  if(!db){root.innerHTML=`<div class="empty"><p>The registry needs this artifact's database, which this view cannot reach. Open AltMarket on claude.ai while signed in.</p></div>`;return}
  const col=db.collection("registry");
  const paint=rows=>{
    rows.sort((a,b)=>String(a.nextDue||"9999").localeCompare(String(b.nextDue||"9999")));
    const late=rows.filter(r=>registryStatus(r.nextDue)[0]==="gap").length;
    root.innerHTML=`<div class="regbar"><div><span class="k">Schemes tracked</span><b class="num">${rows.length}</b></div><div><span class="k">Factsheets overdue</span><b class="num" style="color:${late?"var(--down)":"var(--up)"}">${late}</b></div><button class="btn" type="button" data-reg-add>Add a scheme</button></div>
    ${rows.length?`<div class="ptable"><table><thead><tr><th>Scheme</th><th>House</th><th>Category</th><th>SEBI registration</th><th>Factsheet</th><th></th></tr></thead><tbody>${rows.map(r=>{const [s,t]=registryStatus(r.nextDue);return `<tr><td>${esc(r.scheme||"—")}</td><td>${esc(r.house||"—")}</td><td>${esc(r.category||"—")}</td><td class="num">${esc(r.sebiReg||"—")}</td><td><span class="pill p-${s}">${esc(t)}</span></td><td><button class="btn ghost" type="button" data-reg-del="${esc(r.id)}" style="padding:3px 8px;font-size:12px">Remove</button></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty"><p>No schemes tracked yet. Add the funds your team follows and the registry will flag each factsheet as it falls due.</p></div>`}
    <div id="regForm"></div><p class="note">Held in this artifact's own database. Only people who can edit the artifact can change it, and investors browsing the site never see this page.</p>`;
  };
  try{col.onSnapshot(s=>paint(s.docs.map(d=>Object.assign({id:d.id},d.data()))),()=>paint([]))}catch(e){paint([])}
  root.addEventListener("click",async e=>{
    const add=e.target.closest("[data-reg-add]"),del=e.target.closest("[data-reg-del]");
    if(add){$("#regForm").innerHTML=`<form class="cbform regadd" id="regAdd">
      <label class="fl"><span>Scheme name</span><input id="rgScheme"></label>
      <label class="fl"><span>Fund house</span><input id="rgHouse"></label>
      <label class="fl"><span>Category</span><select id="rgCat"><option>AIF Cat I</option><option>AIF Cat II</option><option selected>AIF Cat III</option><option>PMS</option><option>SIF</option><option>GIFT City</option></select></label>
      <label class="fl"><span>SEBI registration</span><input id="rgReg" placeholder="IN/AIF3/…"></label>
      <label class="fl full"><span>Next factsheet due</span><input id="rgDue" type="date"></label>
      <div class="msg full" id="rgMsg"></div><button class="btn full" type="submit">Add to registry</button></form>`;
      $("#regAdd").addEventListener("submit",async ev=>{ev.preventDefault();
        const rec={scheme:$("#rgScheme").value.trim(),house:$("#rgHouse").value.trim(),category:$("#rgCat").value,sebiReg:$("#rgReg").value.trim(),nextDue:$("#rgDue").value,updatedAt:new Date().toISOString()};
        if(!rec.scheme||!rec.house){$("#rgMsg").textContent="Scheme name and fund house are both needed.";return}
        try{await col.add(rec);$("#regForm").innerHTML="";toast("Added to the registry")}
        catch(err){$("#rgMsg").textContent="Could not save. You need edit access to this artifact."}});
      return}
    if(del){try{await db.doc("registry/"+del.dataset.regDel).delete();toast("Removed from the registry")}catch(err){toast("You need edit access to change the registry")}}
  });
}
