
/* ─── v5.1 — two different things that both looked like "ask" ───

   The hero bar and the floating button read as the same feature and are not.
   The bar turns your words into filters on the table — deterministic, no model
   involved, and the chips it produces are editable. The floating button opens
   a generative assistant that writes answers.

   The assistant also needs the Claude artifact runtime. On any other host
   window.claude is undefined, so every question came back with "open AltMarket
   on claude.ai" — a button that cannot do its job. Where the runtime is absent
   the assistant is removed rather than left to fail in front of a visitor; the
   callback button beside it already covers "I want to talk to someone". */

/* Deliberately a structural test, not a capability probe. Whether window.claude
   exists is a fact about the host and cannot flicker; whether a capability call
   succeeds can fail transiently, and removing the assistant on a transient
   failure would be worse than the dead end it is meant to prevent. Where the
   runtime is present the assistant stays, and v3.3 still reports at send time
   if the capability itself is unavailable. */
function hasArtifactRuntime(){
  return !!(window.claude&&typeof window.claude.use==="function");
}

function dropAssistant(){
  const fab=$(".chatfab"),panel=$("#chatPanel");
  if(fab)fab.remove();
  if(panel)panel.remove();
}

/* say what each one does, where the user is about to use it */
function labelSearchAndAssistant(){
  const form=$("#askForm");
  if(form&&!$("#askKind")){
    const ex=$("#examples");
    const note='<p class="src askkind" id="askKind">Turns what you type into filters on the table below. '+
               'You can edit or remove any of them afterwards.</p>';
    (ex||form).insertAdjacentHTML(ex?"beforebegin":"afterend",note);
  }
  const input=$("#ask");
  if(input)input.setAttribute("aria-label","Describe what you are looking for; this filters the table");

  const sub=$("#chatSub");
  if(sub&&!/AI/.test(sub.textContent))
    sub.textContent="AI assistant · "+sub.textContent;
  const open=$("#chatOpen");
  if(open)open.setAttribute("aria-label","Ask the AltMarket AI assistant");
  const label=$(".chatfab .cflabel");
  if(label&&!/AI/.test(label.textContent))label.textContent="Ask AltMarket AI";
}

if(!hasArtifactRuntime())dropAssistant();
labelSearchAndAssistant();

/* app.js rewrites the assistant's subtitle once the fund data lands, which
   wiped the "AI assistant" prefix. The labelling is idempotent, so reapply it
   after each render rather than racing the load. */
var _applyLabel=apply;
apply=function(){const r=_applyLabel.apply(this,arguments);labelSearchAndAssistant();return r};
