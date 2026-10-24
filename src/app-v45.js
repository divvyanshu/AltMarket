
/* ─── v4.5 — lead capture that survives outside the artifact ───

   The callback form used to write only to the artifact's own database, which
   exists solely inside the Claude artifact runtime. Deployed anywhere else it
   failed closed and told the visitor to open the site on claude.ai, so every
   enquiry from the live site was lost.

   Order of preference now:
     1. AV_FIRM.leadEndpoint — an HTTPS form endpoint (Web3Forms, Formspree…)
     2. the artifact database, when the page is running inside the artifact
     3. a pre-filled email to the firm, so a lead is never silently dropped

   Validation and the success screen are unchanged. */

function leadCfg(){
  const F=window.AV_FIRM||{};
  const url=String(F.leadEndpoint||"").trim();
  return {url:/^https:\/\//i.test(url)?url:"",key:String(F.leadAccessKey||"").trim(),
          email:String(F.contactEmail||"").trim()};
}

/* what the firm actually reads in the inbox — flat, labelled, no JSON blobs */
function leadPayload(d,cfg){
  const body={
    subject:`AltMarket callback — ${d.firstName}${d.lastName?" "+d.lastName:""} (${d.interest})`,
    name:`${d.firstName} ${d.lastName}`.trim(),
    email:d.email, phone:d.phone, city:d.city,
    interest:d.interest, best_time_to_call:d.callTime,
    came_from:d.source, page:d.page,
    shortlisted:(d.shortlist&&d.shortlist.length)?d.shortlist.join(", "):"none",
    submitted_at:d.createdAt
  };
  if(/web3forms/i.test(cfg.url)){
    body.access_key=cfg.key;
    body.from_name="AltMarket website";
    if(cfg.email)body.replyto=d.email;
  }
  return body;
}

async function sendLeadHTTP(d,cfg){
  const r=await fetch(cfg.url,{method:"POST",
    headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify(leadPayload(d,cfg))});
  if(!r.ok)throw Object.assign(new Error("HTTP "+r.status),{code:"http_"+r.status});
  /* Web3Forms answers 200 with {success:false} when the key is wrong */
  let j=null;try{j=await r.json()}catch(e){}
  if(j&&j.success===false)throw Object.assign(new Error(j.message||"rejected"),{code:"rejected"});
  return true;
}

function leadMailto(d,cfg){
  const lines=[`Name: ${d.firstName} ${d.lastName}`.trim(),`Email: ${d.email}`,`Phone: ${d.phone}`,
    `City: ${d.city}`,`Interested in: ${d.interest}`,`Best time to call: ${d.callTime}`,
    d.shortlist&&d.shortlist.length?`Shortlisted: ${d.shortlist.join(", ")}`:""].filter(Boolean);
  return `mailto:${cfg.email}?subject=${encodeURIComponent("Callback request — "+d.firstName)}`+
         `&body=${encodeURIComponent(lines.join("\n"))}`;
}

function leadDone(form,d){
  store.set("cbDone",1);
  form.parentElement.innerHTML=`<div class="mdone"><div class="ok">✓</div>
   <h4 style="font-family:var(--serif);font-weight:300;font-size:30px;margin:0">Thank you, ${esc(d.firstName)}.</h4>
   <p style="margin:0;color:var(--ink2)">A specialist will call you on <b>${esc(d.phone)}</b>${d.callTime!=="Any time"?" in the "+esc(d.callTime.split(" ")[0].toLowerCase()):""}, usually within one business day.</p>
   <p class="src" style="margin:0">Meanwhile, shortlist funds with ☆ and we'll go through them together.</p>
   <button class="btn ghost" type="button" data-cbclose>Continue exploring</button></div>`;
}

submitLead=async function(form){
  const p=form.id.replace("form",""),g=id=>$("#"+p+id),msg=g("msg");msg.textContent="";
  $$("#"+form.id+" .err").forEach(e=>e.classList.remove("err"));
  const bad=[];const need=(id,ok)=>{if(!ok){bad.push(id);g(id).classList.add("err")}};
  need("first",g("first").value.trim().length>0);
  need("email",/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g("email").value.trim()));
  const digits=g("phone").value.replace(/\D/g,"");
  need("phone",g("cc").value==="+91"?/^[6-9]\d{9}$/.test(digits):digits.length>=7&&digits.length<=15);
  need("city",g("city").value.trim().length>1);need("interest",!!g("interest").value);
  if(bad.length){
    msg.textContent=bad.includes("phone")&&bad.length===1?"Enter a valid mobile number (10 digits for India).":
      bad.includes("email")&&bad.length===1?"Enter a valid email address.":"Please complete the highlighted fields.";
    g(bad[0]).focus();return;
  }
  if(!g("consent").checked){msg.textContent="Please tick the consent box so we can contact you.";return}

  const btn=form.querySelector("button[type=submit]"),label="Request my callback →";
  btn.disabled=true;btn.textContent="Sending…";
  const d={firstName:g("first").value.trim(),lastName:g("last").value.trim(),
    email:g("email").value.trim(),phone:g("cc").value+" "+digits,city:g("city").value.trim(),
    interest:g("interest").value,callTime:g("time").value,
    source:cbSource||(p==="ct-"?"contact-page":"modal"),page:current,
    shortlist:[...short].slice(0,10),createdAt:new Date().toISOString(),
    status:"new",crmStatus:"pending"};
  const cfg=leadCfg();

  if(cfg.url){
    try{await sendLeadHTTP(d,cfg);leadDone(form,d);
      /* keep a copy in the artifact store too when one happens to be there */
      try{const db=await dbP;if(db)await db.collection("leads").add(d)}catch(e){}
      return;
    }catch(e){
      msg.textContent=e&&e.code==="rejected"
        ? "We couldn't submit that request. Please email us instead — the details are below."
        : "The request didn't go through. Check your connection and try again.";
      btn.disabled=false;btn.textContent=label;
      if(cfg.email)msg.insertAdjacentHTML("beforeend",
        ` <a href="${esc(leadMailto(d,cfg))}">Email ${esc(cfg.email)}</a>`);
      return;
    }
  }

  let db=null;try{db=await dbP}catch(e){}
  if(db){
    try{await db.collection("leads").add(d);leadDone(form,d);return}
    catch(e){const c=e&&e.code;
      msg.textContent=c==="not_granted"||c==="permission_denied"
        ? "Your access to this page doesn't allow sending requests. Ask the owner for 'can interact' access."
        : c==="rate_limited" ? "Too many requests just now. Wait a minute and try again."
        : "The request didn't go through. Check your connection and try again.";
      btn.disabled=false;btn.textContent=label;return}
  }

  /* nothing configured — hand the visitor a pre-filled email rather than a dead end */
  if(cfg.email){
    msg.innerHTML=`Online submission isn't set up on this copy of the site. `+
      `<a href="${esc(leadMailto(d,cfg))}">Send these details to ${esc(cfg.email)}</a> and we'll call you back.`;
  } else {
    msg.textContent="Online submission isn't set up on this copy of the site.";
  }
  btn.disabled=false;btn.textContent=label;
};
