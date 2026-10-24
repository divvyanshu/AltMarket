
/* ─── v3.7 — tiered fee schedule and a fund-details block for closed-ended funds ─── */

function feeTierTable(f){
  const F=f.fees;if(!F||!F.tiers||!F.tiers.length)return "";
  const multi=F.tiers.length>1;
  return `<div class="ptable feetiers"><table>
   <thead><tr>${multi?"<th>Class</th>":""}<th>Capital commitment</th><th class="r">Fixed management fee (p.a.)</th><th class="r">Performance fee</th><th class="r">Hurdle</th></tr></thead>
   <tbody>${F.tiers.map(t=>`<tr>${multi?`<td><b>${esc(t.cls||"—")}</b></td>`:""}<td>${esc(t.commit||"—")}</td><td class="num r">${esc(t.mgmt||"—")}</td><td class="num r">${esc(t.perf||"—")}</td><td class="num r">${esc(t.hurdle||"—")}</td></tr>`).join("")}</tbody></table></div>
   ${F.setup||F.exit?`<div class="feextra">${F.setup?`<div><span>Set-up fee</span><b>${esc(F.setup)}</b></div>`:""}${F.exit?`<div><span>Exit load</span><b>${esc(F.exit)}</b></div>`:""}</div>`:""}
   <p class="note">${esc(F.note||"Confirm the applicable class and the exact schedule in the fund's own documents before committing.")} A performance fee is charged only on returns above the hurdle.</p>`;
}
function fundDetailsTable(f){
  if(!f.details||!f.details.length)return "";
  return `<div class="ptable detailtable"><table><tbody>${f.details.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>`;
}
function targetBlock(f){
  if(!f.target)return "";
  return `<div class="targetcard"><div><span class="k">Manager's target</span><b>${esc(f.target.irr||"—")}</b><em>stated objective, not a forecast</em></div>
   <p>${esc(f.target.note||"")}</p></div>`;
}
function mixBar(f){
  if(!f.mix||!f.mix.length)return "";
  const rows=f.mix.filter(r=>r[1]>0);if(!rows.length)return "";
  const C={Unlisted:"var(--s1)",Listed:"var(--s3)",Debt:"var(--s4)",Equity:"var(--s2)"};
  return `<div class="card"><span class="k">Asset structure</span>
   <div class="stack" style="margin-top:10px">${rows.map(r=>`<i style="flex:${r[1]};background:${C[r[0]]||"var(--ink3)"}" data-tip="${esc(r[0])} ${r[1]}%"></i>`).join("")}</div>
   <div class="stackl">${f.mix.map(r=>`<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${C[r[0]]||"var(--ink3)"};margin-right:5px"></i>${esc(r[0])} <b class="num">${r[1]}%</b></span>`).join("")}</div></div>`;
}

/* Rebuild the fees section so a tiered schedule replaces the flat one when present,
   and slot the fund-details block in after the approach. */
/* Wrap, don't redeclare: a `function renderFund` here would hoist over the base
   version and the wrapper would call itself. */
var _renderFundBase=renderFund;
renderFund=function(s){
  const ok=_renderFundBase(s);if(!ok)return false;
  const f=DATA.find(x=>x.s===s);if(!f)return true;
  const body=$("#v-page .pbody");if(!body)return true;
  const secs=[...body.querySelectorAll("section")];
  const find=re=>secs.find(x=>re.test(((x.querySelector("h2")||{}).innerText)||""));

  if(f.fees&&f.fees.tiers&&f.fees.tiers.length){
    const sec=find(/Fees and exit load/i);
    if(sec)sec.innerHTML=`<h2>Fees and exit load</h2>${feeTierTable(f)}
      <p class="note">Fees compound against you exactly as returns compound for you. The <a href="#fee-calculator">fee calculator</a> shows what each model costs over your holding period.</p>`;
  }
  if(f.details&&f.details.length){
    const anchor=find(/Investment approach/i)||find(/Investment objective/i);
    const html=`<section><h2>Fund details</h2>${fundDetailsTable(f)}${targetBlock(f)}${f.mix?`<div style="margin-top:14px">${mixBar(f)}</div>`:""}</section>`;
    if(anchor)anchor.insertAdjacentHTML("afterend",html);
    else body.insertAdjacentHTML("afterbegin",html);
  }
  return true;
};
