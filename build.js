/* Assembles src/* into index.html. Run: node build.js */
const fs=require("fs"),p=require("path");
const R=f=>fs.readFileSync(p.join(__dirname,"src",f),"utf8");
let app=R("app.js");
// app.js is one IIFE. The modules go at the /*MODULES*/ marker — inside the IIFE so they
// share scope, but before the init block, so their consts exist when init runs.
// Later function declarations win, so app-v32 intentionally overrides earlier versions.
if(!app.includes("/*MODULES*/"))throw new Error("app.js: /*MODULES*/ marker not found");
const MODULES=["app-extra.js","app-v32.js","app-v33.js","app-v34.js","app-v37.js","app-v39.js","app-v41.js","app-v42.js","app-v43.js","investors.js","app-v44.js"];
app=app.replace("/*MODULES*/",()=>MODULES.map(R).join("\n"));
const out=R("shell.html")
  .replace("/*BASE_CSS*/",()=>R("base.css"))
  .replace("/*EXTRA_CSS*/",()=>R("extra.css"))
  .replace("/*PAGES_JS*/",()=>R("pages.js"))
  .replace("/*APP_JS*/",()=>app);
for(const tok of ["/*BASE_CSS*/","/*EXTRA_CSS*/","/*PAGES_JS*/","/*APP_JS*/"])
  if(out.includes(tok))throw new Error("unreplaced token "+tok);
fs.writeFileSync(p.join(__dirname,"index.html"),out);
console.log("index.html",(out.length/1024).toFixed(0)+"KB");
