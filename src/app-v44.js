
/* ─── v4.4 — Venture debt ───

   A different kind of entry from everything else on AltMarket. These are
   investment FIRMS, not schemes anyone subscribes to here, so they are kept out
   of Explore, out of Compare and out of the consistency score: a venture fund
   reports IRR, DPI and TVPI on drawn capital over eight to twelve years, which
   cannot be set beside a PMS three-year TWRR without misleading someone.

   AIFs are privately placed, so nothing here names a fund, its size, its
   minimum or its terms. That belongs behind a registration and an eligibility
   check, not on an open page. */

function INVESTORS(){return window.AV_INVESTORS||[]}
function invBySlug(s){return INVESTORS().find(x=>x.s===s)||null}
function invOfType(list){return INVESTORS().filter(x=>list.indexOf(x.t)>=0)}
var VD_TYPES=["Venture Debt"];
var VC_TYPES=["Venture Capital","Corporate Venture Capital"];

function invInitials(n){
  return String(n).replace(/[^A-Za-z0-9 ]/g," ").split(/\s+/).filter(Boolean)
    .slice(0,2).map(w=>w[0]).join("").toUpperCase();
}
function invNum(v){return v==null?"—":Number(v).toLocaleString("en-IN")}
/* the first sentence is enough for a card; the rest is on the firm's own page */
function invBlurb(d,max){
  const s=String(d||"").trim();if(!s)return "";
  const cut=s.slice(0,max||190);
  const stop=cut.lastIndexOf(". ");
  return (stop>80?cut.slice(0,stop+1):cut.replace(/\s+\S*$/,"…"));
}

function invCard(x){
  return `<a class="invcard" href="#investor-${x.s}">
   <div class="invtop"><span class="invmark">${esc(invInitials(x.n))}</span>
    <div><b>${esc(x.n)}</b><span class="invmeta">${esc(x.t)}${x.city?" · "+esc(x.city):""}${x.fy?" · since "+x.fy:""}</span></div></div>
   <p class="invblurb">${esc(invBlurb(x.d,200))}</p>
   <dl class="invstats">
    <div><dt>Companies financed</dt><dd class="num">${invNum(x.pf)}</dd></div>
    <div><dt>Investments made</dt><dd class="num">${invNum(x.inv)}</dd></div>
    <div><dt>Exits</dt><dd class="num">${invNum(x.ex)}</dd></div>
   </dl></a>`;
}

/* ─── the venture debt page ─── */
function vdStats(){
  const L=invOfType(VD_TYPES);
  const sum=k=>L.reduce((a,x)=>a+(x[k]||0),0);
  const years=L.map(x=>x.fy).filter(Boolean);
  return `<div class="factstrip">
   <div><span>Firms listed</span><b class="num">${L.length}</b></div>
   <div><span>Companies financed</span><b class="num">${invNum(sum("pf"))}</b></div>
   <div><span>Exits recorded</span><b class="num">${invNum(sum("ex"))}</b></div>
   <div><span>Lending since</span><b class="num">${years.length?Math.min.apply(null,years):"—"}</b></div>
  </div>`;
}
function vdSection(){
  const L=invOfType(VD_TYPES).sort((a,b)=>(b.pf||0)-(a.pf||0));
  if(!L.length)return `<div class="empty"><p>No venture debt firms listed yet.</p></div>`;
  return `<div class="invgrid">${L.map(invCard).join("")}</div>
   <p class="note">Ordered by number of portfolio companies. Counts describe each firm's own lending activity as recorded in the data AltMarket holds — they are not returns, and they say nothing about what an investor in a firm's fund has earned.</p>`;
}

/* ─── a firm's own page ─── */
function invSocials(x){
  const L=[["Website",x.web?(/^https?:/.test(x.web)?x.web:"https://"+x.web):null,x.web],
           ["LinkedIn",x.li,"LinkedIn"],["Facebook",x.fb,"Facebook"],
           ["X / Twitter",x.tw,"X"],["Instagram",x.ig,"Instagram"]].filter(r=>r[1]);
  if(!L.length)return "";
  return `<div class="invlinks">${L.map(r=>
    `<a href="${esc(r[1])}" target="_blank" rel="noopener nofollow"><span>${esc(r[0])}</span>${esc(String(r[2]).replace(/^https?:\/\//,"").replace(/\/$/,""))}</a>`).join("")}</div>`;
}
function renderInvestor(x){
  const isVD=VD_TYPES.indexOf(x.t)>=0;
  const back=isVD?["venture-debt","Venture debt"]:["venture-capital","Venture capital"];
  const rows=[["Investments made",invNum(x.inv)],["Portfolio companies",invNum(x.pf)],
    ["Exits",invNum(x.ex)],["Founded",x.fy||"—"],["Team size",x.emp?invNum(x.emp):"—"],
    ["Based in",[x.city,x.state,x.country].filter(Boolean).join(", ")||"—"]];
  $("#v-page").innerHTML=`<div class="wrap">
   <div class="crumb" style="padding-top:26px"><a href="#explore">Home</a><span>/</span><a href="#${back[0]}">${esc(back[1])}</a><span>/</span><span>${esc(x.n)}</span></div>
   <div class="phero" style="padding-bottom:0">
    <h1>${esc(x.n)}</h1>
    <p class="lede">${esc(x.t)}${x.city?" · "+esc(x.city):""}${x.fy?" · founded "+x.fy:""}</p>
   </div>
   <div class="factstrip" style="margin-top:22px">${rows.slice(0,4).map(r=>`<div><span>${esc(r[0])}</span><b class="num">${esc(String(r[1]))}</b></div>`).join("")}</div>
   <div class="pbody">
    <section><h2>About the firm</h2><div class="prose"><p>${esc(x.d)}</p></div></section>
    <section><h2>Firm details</h2>
     <div class="ptable"><table><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="num">${esc(String(r[1]))}</td></tr>`).join("")}</tbody></table></div>
     ${invSocials(x)}
    </section>
    <section>${invDisclaimer()}</section>
    <section><div class="band"><div><h3>Interested in ${esc(x.n.split(/\s+/).slice(0,2).join(" "))}?</h3>
     <p>Tell us your ticket size and horizon. If the firm is raising and you qualify as an eligible investor, we will introduce you and share the offering document directly.</p></div>
     <button class="btn" type="button" data-callback="investor:${esc(x.s)}">Register your interest →</button></div></section>
    <p class="src">Firm profile supplied by AltMarket. Verify all details with the firm before acting on them.</p>
   </div></div>`;
  return true;
}

function invDisclaimer(){
  return `<div class="card oddnote" style="margin:0">
   <b>What this page is and is not.</b>
   <p>${esc("This is a profile of an investment firm, not a scheme you can subscribe to on AltMarket. Investment, portfolio and exit counts describe what the firm itself has done; they are not an investor's return and must not be read as performance.")}</p>
   <p>${esc("Funds raised by these firms are typically SEBI-registered Alternative Investment Funds, which are privately placed. We therefore do not publish fund names, sizes, minimum commitments, fees or targets on an open page. Those are shared only with investors who register and qualify.")}</p>
   <p>${esc("Venture returns are measured as net IRR, DPI and TVPI on capital drawn over eight to twelve years. They are not time-weighted returns and are not comparable with the PMS and AIF figures elsewhere on AltMarket, which is why these firms do not appear in Explore, Compare or the league tables.")}</p>
  </div>`;
}

/* ─── register the page ─── */
(function(){
  const P=window.AV_PAGES;if(!P)return;
  P["venture-debt"]={g:"Products",eyebrow:"Growth lending to startups",
   h1:"Venture debt in <em>India</em>",
   lede:"Loans to venture-backed companies that have already raised equity — repaid from cash flow, secured against assets, and usually carrying a small equity kicker. A shorter, senior-ranking way into the startup economy than owning the equity itself.",
   s:[{t:"vdstats"},
      {t:"prose",h:"What an investor is actually buying",b:"<p>A venture debt fund lends to companies that have recently raised equity from institutional investors. The borrower gets money without giving up more ownership; the lender gets contracted interest, a repayment schedule measured in years rather than a decade, and a claim that ranks ahead of every shareholder if things go wrong.</p><p>For an investor in the fund, that changes the shape of the return. Venture equity is a power-law business: most holdings return nothing and one or two pay for the fund. Venture debt is a credit business — returns come from interest collected across the whole book, and the job of the manager is to avoid losses rather than to find a single outlier. The upside is capped by the coupon. The downside is cushioned by security, seniority and a shorter life.</p><p>That profile makes it one of the few private-market strategies a conservative family office can underwrite without taking a blind-pool view on technology.</p>"},
      {t:"split",h:"Is it right for you?",
       good:["You want private-market exposure without a ten-year lock-up","You would rather have contracted income than a chance at an outlier","You can commit capital in drawdowns over two to three years","You can assess a credit manager's underwriting and recovery record"],
       bad:["You need the money back on a fixed date","You expect the multiples that venture equity occasionally delivers","A single commitment would be a large share of your investable wealth","You are not comfortable holding an unlisted, unrated credit exposure"]},
      {t:"vdfirms",h:"Venture debt firms"},
      {t:"prose",h:"How to judge one",b:"<p>Three things separate venture debt managers, and none of them is the headline yield. The first is <b>underwriting</b> — whose equity rounds they will lend behind, and how much of the loan is covered by security rather than optimism. The second is <b>recovery</b> — what actually happened to the loans that went bad, which is the number managers are slowest to volunteer and the one worth asking for. The third is <b>structure</b> — how the warrants or equity kicker are valued, whether the fund uses leverage, and how the waterfall shares the upside.</p><p>Ask for the loss history by vintage, not the gross portfolio yield. A book that has never been tested through a funding winter tells you less than a smaller one that has.</p>"},
      {t:"invnote"}],
   rel:["aif-cat-2","private-credit","venture","aif"]};

  const M=window.AV_MENU,prod=M&&M.find(g=>g[0]==="Products");
  if(prod&&!prod[1].some(i=>i[0]==="venture-debt"))
    prod[1].push(["venture-debt","Venture debt","Growth lending to startups"]);
})();

var _secVD=renderSection;
renderSection=function(s){
  if(s.t==="vdstats")return vdStats();
  if(s.t==="vdfirms")return `<h2>${esc(s.h||"Firms")}</h2>${vdSection()}`;
  if(s.t==="invnote")return invDisclaimer();
  return _secVD(s);
};

/* firm pages get their own route */
var _goInv=go;
go=function(id,noScroll){
  if(typeof id==="string"&&id.indexOf("investor-")===0){
    const x=invBySlug(id.slice(9));
    if(!x)return _goInv("venture-debt",noScroll);
    setMenu(false);closeFund();
    $$(".view").forEach(v=>v.hidden=v.id!=="v-page");
    renderInvestor(x);
    current=id;
    $$("[data-nav]").forEach(a=>a.setAttribute("aria-current","false"));
    $("#bandWrap").hidden=true;
    renderTray();
    if(!noScroll)window.scrollTo(0,0);
    try{if(("#"+id)!==location.hash)history.replaceState(null,"","#"+id)}catch(e){}
    observePlay();
    return;
  }
  return _goInv(id,noScroll);
};
