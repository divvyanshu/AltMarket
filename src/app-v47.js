
/* ─── v4.7 — make Back work, and come back where you left off ───

   Routing wrote every navigation with history.replaceState, so the app never
   created a history entry of its own. Opening a scheme from the screener and
   pressing Back did not return to the results — it left the site. And because
   go() scrolls to the top unless told otherwise, even returning through the nav
   dropped a visitor at the top of the page with their place in the list gone.

   Filters were never the problem: `state` lives in memory and survives hash
   navigation within a page load. Only the history entry, the scroll offset and
   the number of rows paged in were being thrown away. */

var SCROLL_AT=Object.create(null);   // view id -> scroll offset
var SHOWN_AT=0;                      // rows paged into the screener when we left
var NAV_BACK=false;                  // true while answering the browser's own navigation

/* Scheme and firm pages always open at the top. Lists are what you return to. */
function keepsPlace(id){
  return id==="explore"||id==="managers"||id==="compare"||id==="leaders";
}

var _goPlace=go;
go=function(id,noScroll){
  const from=current;

  if(from&&from!==id){
    if(keepsPlace(from))SCROLL_AT[from]=window.scrollY||document.documentElement.scrollTop||0;
    if(from==="explore")SHOWN_AT=shown;
  }

  /* Push a real entry before the base router replaces it with the same hash,
     so the net effect is a push and Back has somewhere to return to. When the
     user presses Back the hash has already moved, so nothing is pushed and we
     do not fight the browser. */
  if(!NAV_BACK&&from&&from!==id&&("#"+id)!==location.hash){
    try{history.pushState(null,"","#"+id)}catch(e){}
  }

  /* Restore the rows before the base router renders, so a deep offset has
     something to land on. `shown` is reset by apply(), never by go(). */
  if(id==="explore"&&SHOWN_AT>shown)shown=SHOWN_AT;

  const r=_goPlace(id,noScroll);

  if(id==="explore"&&SHOWN_AT>40)renderList();

  const y=SCROLL_AT[id];
  if(!noScroll&&keepsPlace(id)&&y>0){
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,y)));
  }
  return r;
};

/* A fresh filter run starts a new list, so the remembered depth no longer
   applies — otherwise returning would re-expand rows the filter had dropped. */
var _applyPlace=apply;
apply=function(scroll){SHOWN_AT=0;SCROLL_AT.explore=0;return _applyPlace.apply(this,arguments)};

/* scrollIntoView({behavior:"smooth"}) is a no-op in some embedded browsers, so
   a goal card could apply its filters while the page never moved. Fall back to
   an instant scroll when the smooth one has not taken effect. */
var _toScreenerPlace=toScreener;
toScreener=function(fn){
  const r=_toScreenerPlace.apply(this,arguments);
  const sec=$("#screenerSec");
  if(sec)setTimeout(()=>{
    const target=sec.getBoundingClientRect().top+window.scrollY-8;
    if(Math.abs(window.scrollY-target)>120)window.scrollTo(0,target);
  },420);
  return r;
};

/* The router's own hashchange listener ignores an empty hash, so pressing Back
   to the entry the page was first loaded on left the previous view on screen.
   Route that to the screener, and do not push while doing it — otherwise Back
   would need pressing twice. */
addEventListener("hashchange",function(){
  if(location.hash)return;
  if(current==="explore")return;
  NAV_BACK=true;
  try{go("explore")}finally{NAV_BACK=false}
});
/* A hash that does map to a view is handled by the base listener, which calls
   go(); suppress the push there too so Back keeps unwinding. */
addEventListener("popstate",function(){
  NAV_BACK=true;
  setTimeout(()=>{NAV_BACK=false},0);
});
