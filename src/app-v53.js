
/* ─── v5.3 — Venture capital ───

   The companion to v4.4. Same rule applies: these are investment FIRMS, not
   schemes anyone subscribes to here, so they stay out of Explore, Compare and
   the consistency score.

   Two things this page refuses to blur.

   First, "venture capital firm" is doing a lot of work in the supplied data.
   Of the firms AltMarket holds, some raise pooled funds that an outside
   investor can commit to; one invests its parent company's own balance sheet
   and takes no outside money at all; and the rest are angel networks,
   accelerators, incubators, syndicate platforms and a government programme,
   where the investor's money goes into a single company at a time rather than
   into a fund. Those are different products with different risk, different
   diligence and different paperwork. They are grouped and labelled, not
   poured into one list of "VCs".

   Second, the counts. A venture firm's investment, portfolio and exit counts
   describe its activity, not its performance — a firm with 300 investments and
   26 exits may have returned four times capital or none of it. Nothing here
   implies otherwise, and the number an investor actually needs (net IRR and
   DPI by vintage) is not public for any of them. */

var VC_FUND_TYPES=["Venture Capital"];
var CVC_TYPES=["Corporate Venture Capital"];
var ECO_TYPES=["Angel Network","Accelerator","Incubator","Syndicate Platform",
               "Family Office Firm","Government Programme"];

/* what each route actually is, in the investor's terms */
var ECO_WHAT={
 "Angel Network":"A membership body that circulates individual deals to its members, who each decide and invest on their own account. You pick the company; there is no fund and no manager carrying a portfolio for you.",
 "Accelerator":"Invests small cheques into very early companies in cohorts, usually alongside a programme of mentoring, in exchange for a fixed stake. Exposure comes through the cohort, and the write-off rate at this stage is the highest in venture.",
 "Incubator":"Builds and funds companies from the idea stage, often from a single sponsor's balance sheet and with no mandate to exit on any timetable. Patient capital, which also means no scheduled return of capital.",
 "Syndicate Platform":"Lets investors co-invest deal by deal behind a lead investor, through a special purpose vehicle for each company. You choose every deal, so the concentration is yours to manage.",
 "Family Office Firm":"A single family's own capital, invested on its own behalf. Listed for reference; it is not raising money from anyone.",
 "Government Programme":"A state challenge or grant programme that funds companies against a policy objective. It takes no outside capital and distributes nothing to investors."
};

/* ── the card's middle stat is lending language on the venture debt page; on
      this one the firm takes equity, so say so ── */
var _invCardVD=invCard;
invCard=function(x){
  if(VD_TYPES.indexOf(x.t)>=0)return _invCardVD(x);
  return `<a class="invcard" href="#investor-${x.s}">
   <div class="invtop"><span class="invmark">${esc(invInitials(x.n))}</span>
    <div><b>${esc(x.n)}</b><span class="invmeta">${esc(x.t)}${x.city?" · "+esc(x.city):""}${x.fy?" · since "+x.fy:""}</span></div></div>
   <p class="invblurb">${esc(invBlurb(x.d,200))}</p>
   <dl class="invstats">
    <div><dt>Companies backed</dt><dd class="num">${invNum(x.pf)}</dd></div>
    <div><dt>Investments made</dt><dd class="num">${invNum(x.inv)}</dd></div>
    <div><dt>Exits</dt><dd class="num">${invNum(x.ex)}</dd></div>
   </dl></a>`;
};

function byPortfolio(L){return L.slice().sort((a,b)=>(b.pf||0)-(a.pf||0))}

/* ── the strip counts the pooled funds only ──
   Mixing a government programme's grantees into "companies backed" would
   inflate a figure a reader will take as venture fund activity. */
function vcStats(){
  const L=invOfType(VC_FUND_TYPES);
  const sum=k=>L.reduce((a,x)=>a+(x[k]||0),0);
  const years=L.map(x=>x.fy).filter(Boolean);
  return `<div class="factstrip">
   <div><span>Venture funds listed</span><b class="num">${L.length}</b></div>
   <div><span>Companies backed</span><b class="num">${invNum(sum("pf"))}</b></div>
   <div><span>Exits recorded</span><b class="num">${invNum(sum("ex"))}</b></div>
   <div><span>Investing since</span><b class="num">${years.length?Math.min.apply(null,years):"—"}</b></div>
  </div>`;
}

function vcGroup(types,note){
  const L=byPortfolio(invOfType(types));
  if(!L.length)return "";
  return `<div class="invgrid">${L.map(invCard).join("")}</div>`+
    (note?`<p class="note">${note}</p>`:"");
}

function vcFunds(){
  if(!invOfType(VC_FUND_TYPES).length)
    return `<div class="empty"><p>No venture capital firms listed yet.</p></div>`;
  return vcGroup(VC_FUND_TYPES,
    "Ordered by number of portfolio companies. These firms raise pooled funds, "+
    "almost always as SEBI-registered Category I AIFs, which an eligible investor can commit to. "+
    "Counts describe each firm's own investing activity — they are not returns.");
}

function vcCorporate(){
  if(!invOfType(CVC_TYPES).length)return "";
  return `<h3 class="invgroup">Corporate venture capital</h3>
   <p class="note nmt">A company investing its own balance sheet in startups, for strategic reasons as much as financial ones. There is no fund to commit to and no outside investors, so this is listed for reference rather than as a route in.</p>
   ${vcGroup(CVC_TYPES,"")}`;
}

function vcEcosystem(){
  const L=byPortfolio(invOfType(ECO_TYPES));
  if(!L.length)return "";
  const kinds=[];
  ECO_TYPES.forEach(t=>{
    const n=L.filter(x=>x.t===t).length;
    if(n)kinds.push(`<div><dt>${esc(t)}<span class="ecoN">${n}</span></dt><dd>${esc(ECO_WHAT[t]||"")}</dd></div>`);
  });
  return `<h3 class="invgroup">Other routes into the startup economy</h3>
   <p class="note nmt">These are not venture funds, and the difference matters: in most of them your money goes into one company at a time, chosen by you, with no manager diversifying across a portfolio and no fund structure behind it.</p>
   <dl class="ecolist">${kinds.join("")}</dl>
   ${vcGroup(ECO_TYPES,"Ordered by number of portfolio companies. Where a firm takes no outside capital, the counts describe its own programme, not an opportunity to invest.")}`;
}

/* ─── register the page ─── */
(function(){
  const P=window.AV_PAGES;if(!P)return;
  P["venture-capital"]={g:"Products",eyebrow:"Equity in India's startups",
   h1:"Venture capital in <em>India</em>",
   lede:"Minority equity in companies too young to be valued by any conventional measure, bought on the chance that one in twenty is worth a great deal. The widest spread of outcomes in private markets, and the longest wait to find out which one you own.",
   s:[{t:"vcstats"},
      {t:"prose",h:"The power law, and what it does to you",b:"<p>A venture fund of twenty-five companies does not produce an average. Roughly half return nothing, a handful give back the money they took, and one or two produce almost all of the gain. The fund's return is the story of those one or two — which means the only question that matters at the point of committing is whether this manager gets into the rounds where they turn up.</p><p>That shape has three consequences an investor feels directly. <b>Diversification is not optional</b>: a single startup is a coin flip, and a portfolio is the only thing that turns the power law from a gamble into a strategy. <b>Early marks are close to meaningless</b>: a fund can report a rising valuation for years on the strength of one later round priced by somebody else, and keep reporting it until the day the company is written off. And <b>the money comes back late</b>, if it comes back — capital is drawn down over two to four years, and distributions typically begin in year six or after.</p><p>The strategy itself, and how it sits inside an AIF Category I wrapper, is on the <a href=\"#venture\">venture capital strategy page</a>. This page is the directory of firms.</p>"},
      {t:"vcfunds",h:"Venture capital firms"},
      {t:"vcmore"},
      {t:"split",h:"Is it right for you?",
       good:["You can leave the money alone for ten years and would not notice if you could not reach it","You are committing an amount you could write off entirely without changing your plans","You want to own companies that will never be listed while they are still cheap","You can fund drawdowns across several years and keep the cash ready for calls"],
       bad:["You need income, or a date on which the capital comes back","You would read a rising reported valuation as money you have made","This commitment would be more than a small single-digit share of your investable wealth","You intend to judge the fund on anything that happens in its first four years"]},
      {t:"prose",h:"How to judge a venture manager",b:"<p><b>Ask for DPI, not TVPI.</b> DPI is cash actually returned against cash drawn; TVPI includes the manager's own valuation of what it still holds. A fund can carry a flattering TVPI for a decade and distribute very little. For any fund older than six years, DPI by vintage is the question — and a manager who redirects you to gross multiples or to one famous holding has answered a different one.</p><p><b>Ask what the firm gets to see.</b> Returns in venture come from access before anything else. Which rounds does the firm lead, who brings it deals, and what did it pass on that later became obvious? A firm that mostly follows into priced rounds is buying the same companies as everyone else, later and higher.</p><p><b>Ask about reserves and dilution.</b> Winners need funding again and again. A firm that spends its whole fund on first cheques gets diluted out of its best company by investors who arrive later with more money. Reserve policy is where a good portfolio quietly becomes a mediocre return.</p><p><b>Ask who is actually investing.</b> Venture performance attaches to individual partners far more than to firms. If the partners who made the track record have left, the track record left with them.</p><p><b>Then read the terms.</b> A management fee charged on committed capital across a twelve-year life is a large number in total, and the hurdle, the catch-up and whether carry is taken deal by deal or on the whole fund decide how much of a good outcome reaches you. Our <a href=\"#carry-explained\">worked example of carry</a> shows what each variant costs.</p>"},
      {t:"invnote"}],
   rel:["aif-cat-1","venture","venture-debt","carry-explained"]};

  const M=window.AV_MENU,prod=M&&M.find(g=>g[0]==="Products");
  if(prod&&!prod[1].some(i=>i[0]==="venture-capital")){
    const at=prod[1].findIndex(i=>i[0]==="venture-debt");
    const row=["venture-capital","Venture capital","Equity in India's startups"];
    if(at>=0)prod[1].splice(at,0,row);else prod[1].push(row);
  }
})();

var _secVC=renderSection;
renderSection=function(s){
  if(s.t==="vcstats")return vcStats();
  if(s.t==="vcfunds")return `<h2>${esc(s.h||"Firms")}</h2>${vcFunds()}`;
  if(s.t==="vcmore")return vcCorporate()+vcEcosystem();
  return _secVC(s);
};

/* ─── the firm page's disclaimer has to match the firm ───

   v4.4 wrote one disclaimer for two venture debt lenders, and its middle
   paragraph says the firm's funds are privately placed AIFs shared only with
   registered investors. On iDEX that is simply false — a government challenge
   programme raises nothing and distributes nothing — and on an angel network
   or a syndicate platform it describes the wrong structure: the investor's
   money goes into one company through a special purpose vehicle, not into a
   pooled fund. Each of those is a different answer to "what could I actually
   buy here", so the paragraph is rewritten per firm. */

var INV_RAISES={
 "Family Office Firm":"This is a single family's own capital, invested on its own behalf. The firm is not raising money from outside investors, and nothing here is an opportunity to invest.",
 "Government Programme":"This is a government programme funded from public money against a policy objective. It does not accept outside capital and makes no distributions to investors.",
 "Corporate Venture Capital":"This firm invests its parent company's own balance sheet. There is no fund to commit to and no outside investors, so it is listed for reference rather than as a route in.",
 "Angel Network":"Members of a network invest in individual companies on their own account, usually through a special purpose vehicle for each deal, rather than committing to a pooled fund. That means you choose every company and carry the concentration yourself — there is no manager spreading your money across a portfolio.",
 "Syndicate Platform":"Investors here co-invest deal by deal behind a lead investor, through a special purpose vehicle for each company, rather than committing to a pooled fund. You choose every company and carry the concentration yourself.",
 "Accelerator":"Cohort programmes invest small amounts into very early companies for a fixed stake. Where the firm raises an outside fund, it is typically a SEBI-registered Alternative Investment Fund and privately placed, so fund names, sizes, minimums, fees and targets are shared only with investors who register and qualify."
};
INV_RAISES["Incubator"]="An incubator builds and funds companies from the idea stage, often from a single sponsor's own balance sheet and with no mandate to exit on any timetable. Where it does raise outside money, the vehicle is typically a SEBI-registered Alternative Investment Fund and privately placed, so fund names, sizes, minimums, fees and targets are shared only with investors who register and qualify. Patient capital of this kind may also carry no scheduled return of capital at all.";

function invRaisesLine(t){
  return INV_RAISES[t]||
    "Funds raised by these firms are typically SEBI-registered Alternative Investment Funds, which are privately placed. We therefore do not publish fund names, sizes, minimum commitments, fees or targets on an open page. Those are shared only with investors who register and qualify.";
}

function fixInvDisclaimer(x){
  const box=$("#v-page .oddnote");if(!box)return;
  const ps=box.querySelectorAll("p");
  if(ps[1])ps[1].textContent=invRaisesLine(x.t);
}

var _renderInvType=renderInvestor;
renderInvestor=function(x){
  const r=_renderInvType.apply(this,arguments);
  try{fixInvDisclaimer(x)}catch(e){}
  return r;
};
