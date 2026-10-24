
/* ─── v3.9 — portfolio manager profiles, shared by the scheme and house pages ───
   Names come from the scheme data; role, where shown, comes from the house's SEBI
   filing (principal / compliance officer). Biographies, photographs and
   qualifications are NOT in any source Altmarket holds — they are supplied by
   AltMarket through AV_PEOPLE and are never invented here. */

function personRole(name,house){
  const h=houseReg(house);if(!h)return "";
  const same=a=>a&&String(a).replace(/^(mr|ms|mrs|dr)\.?\s*/i,"").toLowerCase().trim()===String(name).replace(/^(mr|ms|mrs|dr)\.?\s*/i,"").toLowerCase().trim();
  if(same(h.principal))return "Principal Officer";
  if(same(h.compliance))return "Compliance Officer";
  return "";
}
/* SEBI files names as "Mr.Gaurav Doshi" — restore the space after the title. */
function tidyName(n){return String(n||"").replace(/^(Mr|Mrs|Ms|Dr)\.(?=\S)/i,"$1. ").replace(/\s+/g," ").trim()}
function personKey(n){return String(n||"").toLowerCase().replace(/^(mr|ms|mrs|dr)\.?\s*/,"").replace(/[^a-z0-9]+/g," ").trim()}
function personProfile(name){
  const P=window.AV_PEOPLE||{};
  return P[personKey(name)]||null;
}
function personCard(name,house,thisScheme){
  const fp=managerFootprint(name), pr=personProfile(name), role=pr&&pr.role||personRole(name,house)||"Fund manager";
  const others=fp.schemes.filter(x=>x.s!==thisScheme);
  const initials=String(name).replace(/^(Mr|Ms|Mrs|Dr)\.?\s*/i,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const avatar=pr&&pr.photo
    ? `<img class="pmphoto" src="${esc(pr.photo)}" alt="" loading="lazy">`
    : `<span class="pmphoto pminitials" aria-hidden="true">${esc(initials||"·")}</span>`;
  const bio=pr&&pr.bio
    ? `<p class="pmbio">${esc(pr.bio)}</p>${pr.credentials?`<p class="pmcred">${esc(pr.credentials)}</p>`:""}`
    : `<p class="pmbio muted">Biography not on file.</p>`;
  return `<article class="pmprofile">
   ${avatar}
   <div class="pmbody">
    <h4>${esc(tidyName(name))}</h4>
    <div class="pmrole">${esc(role)}${house?` · ${esc(houseName(house))}`:""}</div>
    ${bio}
    ${fp.schemes.length?`<dl class="pmstats">
     <div><dt>Schemes</dt><dd class="num">${fp.schemes.length}</dd></div>
     ${fp.houses.length>1?`<div><dt>Houses</dt><dd class="num">${fp.houses.length}</dd></div>`:""}
     ${fp.med3==null?"":`<div><dt>Median 3Y</dt><dd class="num">${fp.med3.toFixed(1)}%</dd></div>`}
    </dl>`:""}
    ${others.length?`<p class="src">Also runs ${others.slice(0,2).map(x=>`<a href="#fund-${x.s}">${esc(x.n.length>28?x.n.slice(0,27)+"…":x.n)}</a>`).join(", ")}${others.length>2?` +${others.length-2}`:""}</p>`:""}
   </div></article>`;
}
function peopleSection(names,house,thisScheme,heading){
  const list=[...new Set(names.filter(Boolean))];
  if(!list.length)return "";
  const anyBio=list.some(n=>personProfile(n));
  return `<section><h2>${heading}</h2>
   <div class="pmgrid">${list.map(n=>personCard(n,house,thisScheme)).join("")}</div>
   ${anyBio?"":`<p class="note">Names are as filed for each scheme. Biographies, photographs and qualifications are not published in the data Altmarket collects, so they are shown only where AltMarket has supplied them.</p>`}</section>`;
}

/* scheme page: replace the plain manager cards with full profiles */
var _rfPeopleBase=renderFund;
renderFund=function(s){
  const ok=_rfPeopleBase(s);if(!ok)return false;
  const f=DATA.find(x=>x.s===s);if(!f)return true;
  const mgrs=fundManagers(f);if(!mgrs.length)return true;
  const secs=[...$("#v-page").querySelectorAll("section")];
  const sec=secs.find(x=>/Who manages it/i.test(((x.querySelector("h2")||{}).innerText)||""));
  if(sec)sec.outerHTML=peopleSection(mgrs,f.p,f.s,"Portfolio manager profile");
  return true;
};

/* house page: same cards, across every named manager at the house */
var _rmPeopleBase=renderManager;
renderManager=function(s){
  const ok=_rmPeopleBase(s);if(!ok)return false;
  const m=mgrBySlug(s);if(!m)return true;
  const names=[...new Set(m.fs.map(f=>f.m).filter(Boolean).flatMap(x=>x.split(/\s*,\s*|\s+and\s+/)).map(x=>x.trim()).filter(x=>x.length>2))];
  const h=houseReg(m.p);
  if(h){ if(h.principal&&!names.some(n=>personKey(n)===personKey(h.principal)))names.unshift(h.principal);
         if(h.compliance&&!names.some(n=>personKey(n)===personKey(h.compliance)))names.push(h.compliance); }
  if(!names.length)return true;
  const secs=[...$("#v-page").querySelectorAll("section")];
  const sec=secs.find(x=>/Named fund managers/i.test(((x.querySelector("h2")||{}).innerText)||""));
  const html=peopleSection(names.slice(0,10),m.p,null,"Portfolio manager profile");
  if(sec)sec.outerHTML=html;
  else{const reg=secs.find(x=>/Registration and firm details/i.test(((x.querySelector("h2")||{}).innerText)||""));
       if(reg)reg.insertAdjacentHTML("beforebegin",html)}
  return true;
};

/* ─── sector donut: sectors and holdings were both bar lists and read as the
   same chart. Sectors become a donut; holdings stay bars. ─── */
function sectorColour(i,n){
  const hue=252+((i%2?1:-1)*Math.ceil(i/2)*11);          // drift either side of the accent
  const light=32+Math.round((i/(Math.max(1,n-1)))*44);   // 32% → 76%
  return "hsl("+((hue+360)%360)+" 62% "+light+"%)";
}
function donut(rows,opts){
  const o=opts||{};
  const data=rows.filter(r=>r[1]>0).slice(0,10);
  if(!data.length)return "";
  const total=data.reduce((a,r)=>a+r[1],0);
  const R=58,r0=36,CX=70,CY=70,C=2*Math.PI*R;
  let acc=0;
  const segs=data.map((d,i)=>{
    const frac=d[1]/total, len=C*frac, off=C*acc; acc+=frac;
    return `<circle class="dseg" cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${sectorColour(i,data.length)}" stroke-width="${R-r0}"
      stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${CX} ${CY})" data-tip="<b>${esc(d[0])}</b> ${d[1].toFixed(1)}%"/>`;
  }).join("");
  const top=data[0];
  return `<div class="donutwrap">
   <svg viewBox="0 0 140 140" class="donut" role="img" aria-label="${esc(o.label||"Breakdown")}">
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="var(--sunk)" stroke-width="${R-r0}"/>
    ${segs}
    <text x="${CX}" y="${CY-2}" text-anchor="middle" font-family="Newsreader,serif" font-weight="300" font-size="22" fill="var(--ink)">${top[1].toFixed(0)}%</text>
    <text x="${CX}" y="${CY+14}" text-anchor="middle" font-size="9" fill="var(--ink3)" font-family="Geist,sans-serif">${esc(top[0].length>16?top[0].slice(0,15)+"…":top[0])}</text>
   </svg>
   <ul class="dlegend">${data.map((d,i)=>`<li><i style="background:${sectorColour(i,data.length)}"></i><span>${esc(d[0])}</span><b class="num">${d[1].toFixed(1)}%</b></li>`).join("")}</ul>
  </div>`;
}
var _rfDonutBase=renderFund;
renderFund=function(s){
  const ok=_rfDonutBase(s);if(!ok)return false;
  const f=DATA.find(x=>x.s===s);if(!f||!f.sec)return true;
  const card=[...$("#v-page").querySelectorAll(".card")].find(c=>/top sectors/i.test(((c.querySelector(".k")||{}).textContent)||""));
  if(card)card.innerHTML=`<span class="k">Top sectors</span>${donut(f.sec,{label:"Sector weights"})}`;
  return true;
};
