
/* ─── v4.8 — shorter first page, and a corrected product taxonomy ───

   1. The screener opens at 20 rows instead of 40.

   2. GIFT City stops being a product of its own. A GIFT City fund is an
      offshore-structured vehicle subscribed in foreign currency, which is a
      route into the market rather than a product class — so it sits under
      International, and "GIFT City" becomes a strategy you can filter on.

   3. AIF categories. Every AIF is legally Category I, II or III, so "AIF
      (other)" is not a real class. Where a scheme's own filing or category
      wording names a category we use it; where the strategy makes it
      unambiguous — a long-short or hedge fund is Cat III, a venture or SME
      fund is Cat I — we infer it. What is left is labelled as not published
      rather than assigned, because Cat II and Cat III are taxed differently
      and guessing would put a tax-relevant claim on the page. */

/* ── 1. first page of results ──
   apply() hard-codes shown=40 at its start, so setting the variable once is not
   enough; the page size has to be reapplied after every filter run. */
var PAGE_SIZE=20;
var _applyPage=apply;
apply=function(scroll){
  const r=_applyPage.apply(this,arguments);
  if(shown>PAGE_SIZE){shown=PAGE_SIZE;renderList()}
  return r;
};
shown=PAGE_SIZE;

/* ── 2 & 3. product taxonomy ── */
var AIF_I=/\b(venture\s+capital|angel|seed\s+fund|sme\s+fund|social\s+venture|infrastructure\s+fund|early[\s-]stage)\b/i;
var AIF_III=/\b(long[\s.-]?short|hedge\s+fund|absolute\s+return|market\s+neutral|arbitrage|pipe\b|derivative)\b/i;

function aifCategory(f){
  /* what the scheme itself publishes */
  const hay=[(f.x&&f.x.cat)||"",f.c||"",f.n,
    ...(f.details||[]).filter(r=>/categor/i.test(r[0])).map(r=>r[1])].join(" ");
  const m=hay.match(/cat(?:egory)?[\s\-]*(iii|ii|i|3|2|1)\b/i);
  if(m){const k=m[1].toLowerCase();return (k==="iii"||k==="3")?"III":(k==="ii"||k==="2")?"II":"I"}
  /* a strategy that only one category permits */
  const txt=[f.n,f.c||"",(f.x&&f.x.obj)||"",(f.th||[]).join(" ")].join(" ");
  if(AIF_III.test(txt))return "III";
  if(AIF_I.test(txt))return "I";
  return "";
}

prodTab=function(f){
  if(f.t==="GIFT"||f.t==="INTL")return "International";
  if(f.t!=="AIF")return tname(f.t);
  const c=aifCategory(f);
  return c?"AIF (Cat "+c+")":"AIF (category not published)";
};

TAB_ORDER=["PMS","AIF (Cat I)","AIF (Cat II)","AIF (Cat III)",
           "AIF (category not published)","SIF","International"];

/* GIFT City is now something you filter for, not a product tab */
var _styleKeysGift=styleKeys;
styleKeys=function(f){
  const o=_styleKeysGift(f);
  if(f.t==="GIFT")o.add("GIFT City");
  return o;
};
if(typeof PICK_STYLES!=="undefined"&&PICK_STYLES.indexOf("GIFT City")<0)
  PICK_STYLES.push("GIFT City");
if(typeof THEMES!=="undefined"&&THEMES.indexOf("GIFT City")<0)THEMES.push("GIFT City");

/* the menu entry moves out of Products and in with the other strategies */
(function(){
  const M=window.AV_MENU;if(!M)return;
  const prod=M.find(g=>g[0]==="Products"),strat=M.find(g=>g[0]==="Strategies");
  if(!prod||!strat)return;
  const i=prod[1].findIndex(x=>x[0]==="gift-city");
  if(i<0)return;
  const entry=prod[1].splice(i,1)[0];
  entry[2]="Offshore funds from India's IFSC";
  if(!strat[1].some(x=>x[0]==="gift-city"))strat[1].push(entry);
})();
