
/* ─── v4.3 — Consistency Score and category league tables ───

   What this is, and what it deliberately is not.

   A scheme files a time-weighted return for up to nine periods, and its own
   benchmark for the same nine. That is everything SEBI's monthly report gives
   us: point-in-time figures, no NAV series. So we can say how often a manager
   beat the index they chose, by how much, and over how long a record — and we
   cannot compute Sharpe, drawdown, volatility or capture ratios, because every
   one of those needs the month-by-month path we do not have.

   We score what we can verify and say plainly what we cannot. */

var SCORE_MIN=4;           // fewer than four comparable periods is not a record
var SCORE_W={win:.5,margin:.3,depth:.2};
var MARGIN_LO=-5,MARGIN_HI=15;   // median excess, in percentage points

function scoreOf(f){
  if(!f||!f.r||!f.br)return null;
  let n=0,wins=0;const ex=[];
  for(let i=0;i<9;i++){
    const a=f.r[i],b=f.br[i];
    if(a==null||b==null)continue;
    if(implausible(f,i))continue;          // a filed figure we would not print
    n++;if(a>b)wins++;ex.push(a-b);
  }
  if(n<SCORE_MIN)return null;
  const win=wins/n;
  const med=median(ex);
  const margin=Math.max(0,Math.min(1,(med-MARGIN_LO)/(MARGIN_HI-MARGIN_LO)));
  const depth=n/9;
  const total=100*(SCORE_W.win*win+SCORE_W.margin*margin+SCORE_W.depth*depth);
  return {total:Math.round(total*10)/10,win,wins,n,med,margin,depth};
}
/* computed once, then cached on the fund */
function sc(f){
  if(f.__sc===undefined)f.__sc=scoreOf(f);
  return f.__sc;
}
function scoreBand(v){return v>=70?"a":v>=55?"b":v>=40?"c":"d"}

function scorePill(f,opts){
  const s=sc(f);
  if(!s)return `<span class="scorepill none" title="Fewer than ${SCORE_MIN} periods with both a filed return and its benchmark">—</span>`;
  const o=opts||{};
  return `<span class="scorepill s-${scoreBand(s.total)}"${o.plain?"":` data-tip="<b>Consistency ${s.total.toFixed(1)}</b><br>Ahead of its index in ${s.wins} of ${s.n} filed periods<br>Median lead ${s.med>=0?"+":""}${s.med.toFixed(1)} pts"`}>${s.total.toFixed(0)}</span>`;
}

/* the breakdown, shown on a strategy page so the number is never a black box */
function scoreCard(f){
  const s=sc(f);
  if(!s)return `<div class="card scorecard"><span class="k">AltMarket consistency score</span>
   <p class="muted">Not scored. This scheme files fewer than ${SCORE_MIN} periods with both a return and its benchmark, which is too short a record to judge consistency from.</p></div>`;
  const bar=(label,frac,detail)=>`<div class="sbar"><div class="sbtop"><span>${label}</span><b class="num">${detail}</b></div>
    <div class="trk"><i class="growx" style="width:${Math.round(frac*100)}%"></i></div></div>`;
  return `<div class="card scorecard">
   <div class="sctop">
    <div><span class="k">AltMarket consistency score</span>
     <div class="scbig s-${scoreBand(s.total)}">${s.total.toFixed(1)}<small>/ 100</small></div></div>
    <p class="scsum">Ahead of its own benchmark in <b>${s.wins} of ${s.n}</b> filed periods, by a median of <b>${s.med>=0?"+":""}${s.med.toFixed(1)} pts</b>.</p>
   </div>
   ${bar("Consistency · 50%",s.win,s.wins+" of "+s.n+" periods ahead")}
   ${bar("Margin · 30%",s.margin,(s.med>=0?"+":"")+s.med.toFixed(1)+" pts median")}
   ${bar("Length of record · 20%",s.depth,s.n+" of 9 periods filed")}
   <p class="src">Built only from figures the manager filed with SEBI and the benchmark it chose. It does not measure risk: Sharpe ratio, drawdown and volatility need a monthly NAV series, which the monthly report does not publish. <a href="#consistency-score">How this is calculated</a></p>
  </div>`;
}

/* ─── league tables ─── */
/* Categories are the ones an investor actually chooses between. A scheme can
   appear in more than one where its own filings place it in both. */
/* A league table needs size as well as a record: a scheme running three crore
   can top any ranking on a rounding error. Below the floor a scheme still gets
   a score on its own page, it is simply not ranked against others. */
var LEAGUE_MIN_AUM=25;
var LEAGUE_MIN_ROWS=5;
var LEAGUES=[
 {k:"smid",   n:"Small & mid cap",      f:f=>f.t==="PMS"&&(styleKeys(f).has("Small cap")||styleKeys(f).has("Mid cap"))},
 {k:"multi",  n:"Multi cap & flexi cap",f:f=>f.t==="PMS"&&styleKeys(f).has("Multi / flexi")},
 {k:"large",  n:"Large cap",            f:f=>f.t==="PMS"&&styleKeys(f).has("Large cap")},
 {k:"value",  n:"Value & quant",        f:f=>f.t==="PMS"&&(styleKeys(f).has("Value")||styleKeys(f).has("Quant"))},
 {k:"thematic",n:"Thematic",            f:f=>f.t==="PMS"&&styleKeys(f).has("Thematic")},
 {k:"debt",   n:"Credit & debt",        f:f=>styleKeys(f).has("Credit & debt")}
];
var LEAGUE_TAB="smid";

function leagueQualify(L){
  return DATA.filter(f=>L.f(f)&&(f.aum||0)>=LEAGUE_MIN_AUM&&sc(f));
}
function leagueRows(L,limit){
  return leagueQualify(L).map(f=>({f,s:sc(f)}))
    .sort((a,b)=>b.s.total-a.s.total).slice(0,limit||10);
}
function leagueTable(L){
  const rows=leagueRows(L,10);
  if(!rows.length)return `<div class="empty"><p>No scheme in ${esc(L.n)} files enough periods against a benchmark to be scored yet.</p></div>`;
  const pool=DATA.filter(L.f).length,scored=leagueQualify(L).length;
  return `<div class="ptable leaguetable"><table>
   <thead><tr><th class="r">#</th><th>Investment approach</th><th>House</th><th class="r">Score</th>
    <th class="r">Periods ahead</th><th class="r">Median lead</th><th class="r">3Y</th><th class="r">AUM (₹)</th></tr></thead>
   <tbody>${rows.map((x,i)=>{
     const f=x.f,s=x.s;
     return `<tr data-open="${f.s}" tabindex="0" role="button" aria-label="${esc(f.n)}">
      <td class="num r rank">${i+1}</td>
      <td data-l="Approach"><b>${esc(deCaps(f.n))}</b><div class="stybadges">${styleTags(f,2)}</div></td>
      <td data-l="House">${esc(houseName(f.p)||f.m||"—")}</td>
      <td class="r" data-l="Score">${scorePill(f)}</td>
      <td class="num r" data-l="Periods ahead">${s.wins} / ${s.n}</td>
      <td class="num r" data-l="Median lead"><span style="color:var(--${s.med>=0?"up":"down"})">${s.med>=0?"+":""}${s.med.toFixed(1)}</span></td>
      <td class="num r" data-l="3Y">${ret(f,5)==null?'<span class="na">NA</span>':pctT(ret(f,5))}</td>
      <td class="num r" data-l="AUM (₹)">${f.aum!=null?esc(fmtCr(f.aum)):'<span class="na">NA</span>'}</td>
     </tr>`}).join("")}</tbody></table></div>
   <p class="note">${scored.toLocaleString("en-IN")} of ${pool.toLocaleString("en-IN")} ${esc(L.n.toLowerCase())} schemes qualify: at least ${SCORE_MIN} periods filed against a benchmark and at least ₹${LEAGUE_MIN_AUM} crore under management. The rest appear in <a href="#explore">Explore</a> but are not ranked here.</p>`;
}
function leagueSection(){
  const live=LEAGUES.filter(x=>leagueQualify(x).length>=LEAGUE_MIN_ROWS);
  if(!live.some(x=>x.k===LEAGUE_TAB))LEAGUE_TAB=(live[0]||LEAGUES[0]).k;
  const L=live.find(x=>x.k===LEAGUE_TAB)||LEAGUES[0];
  const aifScored=DATA.filter(f=>f.t==="AIF"&&sc(f)).length,aifAll=DATA.filter(f=>f.t==="AIF").length;
  return `<div class="prodtabs leaguetabs" role="tablist">${live.map(x=>
    `<button type="button" role="tab" data-league="${x.k}" aria-selected="${x.k===LEAGUE_TAB}">${esc(x.n)}<span>${leagueQualify(x).length}</span></button>`).join("")}</div>
   <div id="leagueWrap">${leagueTable(L)}</div>
   <p class="oddnote">Every table here is a portfolio management service. SEBI's monthly report covers portfolio managers, so a PMS files its return and its benchmark each month — an AIF does not. Only ${aifScored} of the ${aifAll} AIFs on AltMarket publish a benchmark alongside their returns, and one GIFT City scheme does, which is far too few to rank. Until AltMarket collects benchmark data for those products directly from the managers, ranking them would mean inventing the comparison.</p>`;
}

/* new section type + page */
var _secBase=renderSection;
renderSection=function(s){
  if(s.t==="league")return `<h2>${esc(s.h||"Category leaders")}</h2>${leagueSection()}`;
  if(s.t==="scoremath")return scoreMathHTML();
  return _secBase(s);
};
function scoreMathHTML(){
  const scored=DATA.filter(f=>sc(f)).length;
  return `<h2>How the score is calculated</h2>
  <div class="prose"><p>Three things, weighted. Each is taken only from periods where the scheme filed <b>both</b> a return and the benchmark it chose, and where the filed figure is plausible for the product.</p></div>
  <div class="ptable"><table><thead><tr><th>Component</th><th>Weight</th><th>What it measures</th><th>Scale</th></tr></thead><tbody>
   <tr><td>Consistency</td><td class="num">50%</td><td>Share of filed periods in which the scheme is ahead of its own benchmark</td><td>0% ahead scores 0, every period ahead scores full</td></tr>
   <tr><td>Margin</td><td class="num">30%</td><td>Median excess return over the benchmark across those periods</td><td>−5 pts or worse scores 0, +15 pts or better scores full</td></tr>
   <tr><td>Length of record</td><td class="num">20%</td><td>How many of the nine periods the scheme actually files</td><td>Four periods is the minimum; nine scores full</td></tr>
  </tbody></table></div>
  <div class="prose"><p>A scheme filing fewer than four comparable periods is <b>not scored</b> rather than scored low — a short record is an absence of evidence, not evidence of weakness. ${scored.toLocaleString("en-IN")} of the ${DATA.length.toLocaleString("en-IN")} schemes on AltMarket meet the bar today.</p>
  <h3>What it does not measure</h3>
  <p>It is not a risk-adjusted score. Sharpe ratio, maximum drawdown, volatility and upside/downside capture all require a month-by-month NAV series. SEBI's Portfolio Manager Monthly Report publishes point-in-time time-weighted returns and nothing else, so those measures cannot be derived from it. Any platform quoting them for the whole market is using data it has licensed elsewhere or estimating. We would rather show you a narrower number you can check than a broader one you cannot.</p>
  <p>Nor does the weighting know anything about your situation. A thematic fund that beats its index in seven of nine periods may still be the wrong holding for someone who needs the money in two years. The score ranks managers against the benchmark they picked — it does not rank them against your plan.</p></div>`;
}

/* register the page */
(function(){
  const P=window.AV_PAGES;if(!P)return;
  P["consistency-score"]={g:"Learn",eyebrow:"Methodology",
   h1:"The AltMarket <em>consistency score</em>",
   lede:"One number for how reliably a manager has beaten the benchmark it chose — built only from what was filed with SEBI, with the arithmetic published so you can check it.",
   s:[{t:"scoremath"},
      {t:"prose",h:"Why consistency and not the headline return",b:"<p>A single strong year is the easiest thing in this market to find and the least useful thing to buy. The spread between the best and worst scheme in a category is wide enough that last year's leader is often this year's laggard, and a table sorted on one-year return will reorder itself completely every twelve months.</p><p>Beating the index repeatedly, across periods that cover different market conditions, is harder to do by luck. That is what this score measures, and it is why a scheme with a +9 pt median lead across nine periods will outrank one that put up a single spectacular year.</p>"}],
   rel:["approach","reading-returns","compare-wrappers"]};
  P["leaders"]={g:"Learn",eyebrow:"Updated with each SEBI monthly filing",
   h1:"Category <em>leaders</em>",
   lede:"The most consistent schemes in each category, ranked on how often and by how much they beat their own benchmark — not on last year's headline number.",
   s:[{t:"league",h:"Ranked by consistency score"},
      {t:"prose",h:"How to read these tables",b:"<p>Each table ranks only the schemes in that category with at least four periods filed against a benchmark. <b>Periods ahead</b> is the raw count behind the score; <b>median lead</b> is how far ahead it typically was, in percentage points. A scheme can lead on score while trailing on three-year return, which usually means it has been steadier rather than hotter.</p><p>Categories come from each scheme's own filings and published category wording. Where a manager publishes neither, the scheme appears in Explore but not in a league table.</p>"}],
   rel:["consistency-score","approach","pms"]};
  /* add to the Learn menu, before the glossary */
  const M=window.AV_MENU;const learn=M&&M.find(g=>g[0]==="Learn");
  if(learn&&!learn[1].some(i=>i[0]==="leaders")){
    learn[1].splice(1,0,["leaders","Category leaders","Most consistent in each category"],
                        ["consistency-score","Consistency score","How we rank, and what it misses"]);
  }
})();

document.addEventListener("click",function(e){
  const t=e.target.closest("[data-league]");
  if(!t)return;
  LEAGUE_TAB=t.dataset.league;
  t.parentElement.querySelectorAll("[data-league]").forEach(b=>b.setAttribute("aria-selected",b===t));
  const L=LEAGUES.find(x=>x.k===LEAGUE_TAB)||LEAGUES[0];
  const w=$("#leagueWrap");if(w)w.innerHTML=leagueTable(L);
},true);

/* put the score on the strategy page, under the performance section */
var _rfScoreBase=renderFund;
renderFund=function(s){
  const ok=_rfScoreBase(s);if(!ok)return false;
  const f=DATA.find(x=>x.s===s);if(!f)return true;
  if(!sc(f))return true;
  const secs=[...$("#v-page").querySelectorAll("section")];
  const perf=secs.find(x=>/performance|how it has done|against/i.test(((x.querySelector("h2")||{}).innerText)||""));
  const host=perf||secs[0];
  if(host)host.insertAdjacentHTML("afterend",`<section>${scoreCard(f)}</section>`);
  return true;
};
