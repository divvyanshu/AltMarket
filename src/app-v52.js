
/* ─── v5.2 — say what Market pulse is made of, and when ───

   The section carried one static line claiming 1,202 strategies. That number
   was hardcoded and had drifted — the real figure moves every time the data is
   rebuilt or the screener's universe changes. Worse, the only date on the page
   was the day the listing was scraped, while the returns in both charts come
   from SEBI's monthly report for an earlier month. A reader comparing "74% beat
   their index" against today's market had no way to know how stale it was.

   The note is now computed: the month the returns were filed for, how many
   strategies are behind the charts, the basis of the figures, and the line SEBI
   requires. */

function pulseAsOfMonth(){
  const p=(window.__FUNDS_META&&window.__FUNDS_META.sebiAsOf)||"";
  return p?perLabel(p):"";
}
function pulseSample(){
  return DATA.filter(f=>f.r&&f.r.some(v=>v!=null&&v!==0)).length;
}

function pulseProvenance(){
  const month=pulseAsOfMonth(),n=pulseSample();
  const when=month?`as filed for <b>${esc(month)}</b>`:"as most recently filed";
  return `Returns are those each manager filed with SEBI in its Portfolio Manager Monthly Report, ${when} — `+
    `time-weighted, annualised beyond one year, net of fees and before your own tax, `+
    `and each set against the benchmark the scheme itself chose. `+
    `Built from the ${n.toLocaleString("en-IN")} strategies that publish a return history. `+
    `Performance information shown here is not verified by SEBI.`;
}

function refreshPulseNote(){
  const grid=$("#pulse");if(!grid)return;
  const note=grid.parentElement&&grid.parentElement.querySelector(".note");
  if(note)note.innerHTML=pulseProvenance();
  /* and a dateline on each chart, where the claim is actually made */
  if(!pulseAsOfMonth())return;
  grid.querySelectorAll(".ccard").forEach(card=>{
    const foot=card.querySelector(".foot");
    if(foot&&!/as at/i.test(foot.textContent))
      foot.insertAdjacentHTML("beforeend",` <span class="asat">As at ${esc(pulseAsOfMonth())}.</span>`);
  });
}

var _renderPulseMeta=renderPulse;
renderPulse=function(){
  const r=_renderPulseMeta.apply(this,arguments);
  refreshPulseNote();
  return r;
};
