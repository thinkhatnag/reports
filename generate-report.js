import fs from "fs";
import path from "path";

const ALLURE_DIR = path.join(process.cwd(), "allure-results");
const OUT_DIR = path.join(process.cwd(), "reports");
const OUT_FILE = path.join(OUT_DIR, "test-report.html");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const resultFiles = fs
  .readdirSync(ALLURE_DIR)
  .filter((f) => f.endsWith("-result.json"))
  .map((f) => path.join(ALLURE_DIR, f));

console.log("Found:", resultFiles.length, "result files");

function prettifyPackage(raw) {
  const STRIP = new Set([
    "test",
    "spec",
    "english",
    "spanish",
    "es",
    "en",
    "js",
  ]);
  return raw
    .replace(/\.spec\.js$/i, "")
    .replace(/\.js$/i, "")
    .split(/[._\-\/\\]+/)
    .filter((p) => p && !STRIP.has(p.toLowerCase()))
    .join(" ");
}

function extractSuite(raw) {
  if (Array.isArray(raw.labels)) {
    const pkg = raw.labels.find((l) => l.name === "package");
    if (pkg?.value) return prettifyPackage(pkg.value);
  }
  if (raw.fullName?.includes("#")) {
    const file = raw.fullName.split("#")[0].split("/").pop();
    return prettifyPackage(file);
  }
  if (raw.suite?.trim()) return raw.suite.trim();
  return "Ungrouped";
}

function extractIssue(raw) {
  if (Array.isArray(raw.links)) {
    const lnk = raw.links.find((l) => l.type === "issue");
    if (lnk)
      return {
        hasIssue: true,
        issueUrl: lnk.url || null,
        issueName: lnk.name || lnk.url || "Known Issue",
      };
  }
  if (Array.isArray(raw.labels)) {
    const lbl = raw.labels.find((l) => l.name === "issue");
    if (lbl?.value)
      return { hasIssue: true, issueUrl: null, issueName: lbl.value };
  }
  return { hasIssue: false, issueUrl: null, issueName: null };
}

// Merge retries
const merged = new Map();
for (const file of resultFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const key = raw.historyId || raw.fullName || raw.name || file;
    const time = raw.start || 0;
    if (!merged.has(key) || time > merged.get(key).time)
      merged.set(key, { raw, time });
  } catch {}
}

// Build test cases
const testCases = [];
merged.forEach(({ raw }) => {
  const name = raw.name || "Unknown Test";
  const status = raw.status || "unknown";
  const dur = (raw.stop || 0) - (raw.start || 0);
  const err = raw.statusDetails?.message || null;
  const isSpanish = /\s*[-_]Es\s*$/i.test(name);
  const baseTestName = name.replace(/\s*[-_]Es\s*$/i, "").trim();
  const suite = extractSuite(raw);
  const issue = extractIssue(raw);
  testCases.push({
    name,
    baseTestName,
    suite,
    passed: status === "passed",
    skipped: status === "skipped" || status === "pending",
    failed: status === "failed" || status === "broken",
    dur,
    err,
    isSpanish,
    status,
    hasIssue: issue.hasIssue,
    issueUrl: issue.issueUrl,
    issueName: issue.issueName,
  });
});

// Group
const suiteMap = {};
testCases.forEach((t) => {
  if (!suiteMap[t.suite]) suiteMap[t.suite] = {};
  if (!suiteMap[t.suite][t.baseTestName])
    suiteMap[t.suite][t.baseTestName] = { en: null, es: null };
  suiteMap[t.suite][t.baseTestName][t.isSpanish ? "es" : "en"] = t;
});

const suiteList = Object.entries(suiteMap).map(([name, tests]) => {
  const pairs = Object.entries(tests).map(([base, { en, es }]) => ({
    base,
    en,
    es,
  }));
  let total = 0,
    passed = 0,
    failed = 0,
    skipped = 0;
  pairs.forEach(({ en, es }) => {
    const r = en || es;
    total++;
    if (r?.passed) passed++;
    else if (r?.failed) failed++;
    else if (r?.skipped) skipped++;
  });
  return { name, pairs, stats: { total, passed, failed, skipped } };
});

const gStats = {
  total: testCases.length,
  passed: testCases.filter((t) => t.passed).length,
  failed: testCases.filter((t) => t.failed).length,
  skipped: testCases.filter((t) => t.skipped).length,
};

const reportDate = new Date().toLocaleString();
const reportTS = new Date().toISOString();

// Safely serialize — no template literal, write as JSON assigned to a var
const dataJson = JSON.stringify({
  suites: suiteList,
  stats: gStats,
  meta: { platform: "iOS", reportDate, reportTS },
});

// ── Write CSS file separately to avoid any escaping issues ────────────────────
const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f8f9fb;--sf:#ffffff;--sf2:#f4f6f8;--sf3:#e8ebf0;
  --bd:#d4d9e1;--bd2:#b0b8c8;
  --tx:#1a202c;--txm:#4a5568;--txd:#cbd5e0;
  --pass:#16a34a;--pass-bg:rgba(22,163,74,.08);
  --fail:#dc2626;--fail-bg:rgba(220,38,38,.08);
  --skip:#d97706;--skip-bg:rgba(217,119,6,.08);
  --nr:#64748b;--nr-bg:rgba(100,116,139,.08);
  --issue:#d97706;--iss-bg:rgba(217,119,6,.12);
  --acc:#2563eb;
  --r:6px;--rl:10px;
  --mono:'Courier New',monospace;
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--tx);padding:20px;min-height:100vh}
.page{max-width:1300px;margin:0 auto}
.hdr{padding:22px 26px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.hdr h1{font-size:19px;font-weight:700;letter-spacing:-.3px;font-family:var(--mono)}
.hdr h1 span{color:var(--acc)}
.hdr-meta{margin-top:5px;font-size:11px;color:var(--txm);font-family:var(--mono)}
.back{font-size:11px;color:var(--txm);text-decoration:none;border:1px solid var(--bd);padding:5px 11px;border-radius:var(--r);transition:.15s}
.back:hover{color:var(--tx);border-color:var(--bd2)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
.sc{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:15px 16px;position:relative;overflow:hidden}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--acc);border-radius:var(--rl) var(--rl) 0 0}
.sc.p::before{background:var(--pass)}.sc.f::before{background:var(--fail)}.sc.s::before{background:var(--skip)}
.sc-lbl{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--txm);margin-bottom:6px;font-family:var(--mono)}
.sc-val{font-size:32px;font-weight:700;font-family:var(--mono);line-height:1}
.sc.p .sc-val{color:var(--pass)}.sc.f .sc-val{color:var(--fail)}.sc.s .sc-val{color:var(--skip)}
.legend{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:10px 16px;margin-bottom:10px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.leg-ttl{font-size:10px;font-family:var(--mono);font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--txm);margin-right:4px}
.leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--txm)}
.lb{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;font-family:var(--mono)}
.lb.p{background:var(--pass-bg);color:var(--pass);border:1px solid var(--pass)}
.lb.f{background:var(--fail-bg);color:var(--fail);border:1px solid var(--fail)}
.lb.s{background:var(--skip-bg);color:var(--skip);border:1px solid var(--skip)}
.lb.nr{background:var(--nr-bg);color:var(--nr);border:1px solid var(--nr)}
.lb.iss{background:var(--iss-bg);color:var(--issue);border:1px solid var(--issue);font-weight:900;width:17px;height:17px;padding:0;border-radius:50%;font-size:11px}
.toolbar{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between}
.fg,.eg{display:flex;gap:5px;flex-wrap:wrap;align-items:center}
.flbl{font-size:10px;color:var(--txm);font-family:var(--mono);font-weight:700;letter-spacing:.4px;text-transform:uppercase;margin-right:2px}
.fbtn{padding:4px 11px;border-radius:100px;border:1px solid var(--bd);background:transparent;color:var(--txm);font-size:11px;font-family:var(--mono);font-weight:700;cursor:pointer;transition:.15s}
.fbtn:hover{border-color:var(--bd2);color:var(--tx)}
.fbtn.on{background:var(--sf3);color:var(--tx);border-color:var(--bd2)}
.fbtn[data-f="passed"].on{background:var(--pass-bg);color:var(--pass);border-color:var(--pass)}
.fbtn[data-f="failed"].on{background:var(--fail-bg);color:var(--fail);border-color:var(--fail)}
.fbtn[data-f="skipped"].on{background:var(--skip-bg);color:var(--skip);border-color:var(--skip)}
.fbtn[data-f="notrun"].on{background:var(--nr-bg);color:var(--nr);border-color:var(--nr)}
.fbtn[data-f="issue"].on{background:var(--iss-bg);color:var(--issue);border-color:var(--issue)}
.cbtn{padding:4px 11px;border-radius:var(--r);border:1px solid var(--bd);background:transparent;color:var(--txm);font-size:11px;font-family:var(--mono);cursor:pointer;transition:.15s}
.cbtn:hover{border-color:var(--bd2);color:var(--tx);background:var(--sf2)}
.sind{font-size:10px;font-family:var(--mono);color:var(--pass);opacity:0;margin-left:6px;transition:opacity .3s}
.sind.show{opacity:1}
.suites{display:flex;flex-direction:column;gap:7px}
.sblock{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden;transition:border-color .15s}
.sblock:hover{border-color:var(--bd2)}
.sblock.gone{display:none}
.shdr{display:flex;align-items:center;gap:11px;padding:12px 16px;cursor:pointer;user-select:none;transition:background .15s;flex-wrap:wrap}
.shdr:hover{background:var(--sf2)}
.chev{width:16px;height:16px;flex-shrink:0;color:var(--txm);transition:transform .2s;display:flex;align-items:center;justify-content:center}
.sblock.open .chev{transform:rotate(90deg)}
.sname{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--tx);flex:1;min-width:0;word-break:break-word}
.pills-c,.pills-e{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.sblock.open .pills-c{display:none}
.pills-e{display:none}
.sblock.open .pills-e{display:flex}
.pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:100px;font-size:10px;font-weight:700;font-family:var(--mono)}
.pill.t{background:var(--sf3);color:var(--txm);border:1px solid var(--bd)}
.pill.p{background:var(--pass-bg);color:var(--pass);border:1px solid rgba(31,209,122,.2)}
.pill.f{background:var(--fail-bg);color:var(--fail);border:1px solid rgba(240,80,110,.2)}
.pill.s{background:var(--skip-bg);color:var(--skip);border:1px solid rgba(245,192,67,.2)}
.sbody{display:none;border-top:1px solid var(--bd)}
.sblock.open .sbody{display:block}
.ttbl{width:100%;border-collapse:collapse}
.ttbl thead th{padding:8px 14px;text-align:left;font-size:10px;font-weight:700;font-family:var(--mono);text-transform:uppercase;letter-spacing:.5px;color:var(--txm);background:var(--sf2);border-bottom:1px solid var(--bd)}
.ttbl tbody tr{border-bottom:1px solid var(--bd);transition:background .1s}
.ttbl tbody tr:last-child{border-bottom:none}
.ttbl tbody tr:hover{background:var(--sf2)}
.ttbl tbody tr.hide{display:none}
.ttbl td{padding:10px 14px;vertical-align:middle}
.tname{font-size:12px;color:var(--tx);font-weight:500;min-width:200px;max-width:370px;word-break:break-word;line-height:1.5}
.iss-wrap{display:inline-block;position:relative;vertical-align:middle;margin-left:6px}
.ib{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:var(--iss-bg);border:1.5px solid var(--issue);color:var(--issue);font-size:10px;font-weight:900;cursor:pointer;flex-shrink:0;text-decoration:none;transition:background .15s}
.ib:hover,.ib.open{background:rgba(245,192,67,.32)}
.iss-drop{display:none;position:absolute;left:0;top:calc(100% + 5px);min-width:220px;max-width:340px;background:#ffffff;border:1px solid var(--issue);border-radius:6px;z-index:40;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.iss-drop.show{display:block}
.iss-drop-hdr{display:flex;align-items:center;justify-content:space-between;padding:7px 10px 5px;border-bottom:1px solid rgba(245,192,67,.2)}
.iss-drop-title{font-size:10px;font-weight:700;font-family:'Courier New',monospace;color:var(--issue);text-transform:uppercase;letter-spacing:.5px}
.iss-drop-close{font-size:12px;color:var(--txm);cursor:pointer;line-height:1;padding:0 2px}
.iss-drop-close:hover{color:var(--tx)}
.iss-drop-body{padding:8px 10px}
.iss-drop-text{font-size:11px;color:#422006;font-family:'Courier New',monospace;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.iss-drop-link{display:inline-block;margin-top:6px;font-size:10px;color:var(--acc);text-decoration:none;font-family:'Courier New',monospace}
.iss-drop-link:hover{text-decoration:underline}
.sb{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;font-family:var(--mono);white-space:nowrap}
.sb.passed{background:var(--pass-bg);color:var(--pass);border:1px solid rgba(31,209,122,.25)}
.sb.failed{background:var(--fail-bg);color:var(--fail);border:1px solid rgba(240,80,110,.25);cursor:help;position:relative}
.sb.skipped{background:var(--skip-bg);color:var(--skip);border:1px solid rgba(245,192,67,.25)}
.sb.not-run{background:var(--nr-bg);color:var(--nr);border:1px solid rgba(62,77,122,.25)}
.err-tip{display:none;position:absolute;left:0;top:calc(100% + 5px);min-width:220px;max-width:340px;background:#ffffff;color:#991b1b;border:1px solid rgba(220,38,38,.35);padding:7px 10px;border-radius:6px;font-size:10px;white-space:pre-wrap;word-break:break-word;z-index:30;font-weight:400;line-height:1.5;pointer-events:none;font-family:'Courier New',monospace;box-shadow:0 4px 12px rgba(0,0,0,.1)}
.sb.failed:hover .err-tip{display:block}
.ci{width:100%;min-width:150px;padding:5px 9px;background:var(--sf2);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-size:11px;transition:.15s}
.ci:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 2px rgba(79,127,255,.12)}
.nores{text-align:center;padding:40px;color:var(--txm);font-family:var(--mono);font-size:12px;display:none}
.nores.show{display:block}
.exp-row{margin-top:12px;display:flex;gap:10px;align-items:center}
.exp-btn{padding:7px 18px;background:var(--acc);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;font-family:var(--mono);cursor:pointer;transition:opacity .15s}
.exp-btn:hover{opacity:.85}
.footer{margin-top:28px;text-align:center;font-size:11px;font-family:var(--mono);color:var(--txd)}
`;

// ── Write the JS separately too — no escaping issues ─────────────────────────
const js = `
var D = ${dataJson};

function sc(t){
  if(!t)return'not-run';
  if(t.skipped)return'skipped';
  if(t.passed)return'passed';
  if(t.failed)return'failed';
  return'not-run';
}
function sl(t){
  if(!t)return'N/R';
  if(t.skipped)return'SKIP';
  if(t.passed)return'PASS';
  if(t.failed)return'FAIL';
  return'N/R';
}
function slIcon(t){
  if(!t)return'&mdash; N/R';
  if(t.skipped)return'&#8855; SKIP';
  if(t.passed)return'&#10003; PASS';
  if(t.failed)return'&#10007; FAIL';
  return'&mdash; N/R';
}
function issHtml(t,uid){
  if(!t||!t.hasIssue)return'';
  var text=(t.issueName||'Known Issue').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var linkHtml=t.issueUrl
    ? '<a class="iss-drop-link" href="'+t.issueUrl+'" target="_blank" rel="noopener">&#128279; Open in tracker</a>'
    : '';
  return(
    '<span class="iss-wrap" id="issw-'+uid+'">'+
      '<span class="ib" onclick="toggleIss(this,event)">!</span>'+
      '<div class="iss-drop" id="issd-'+uid+'">'+
        '<div class="iss-drop-hdr">'+
          '<span class="iss-drop-title">&#9888; Known Issue</span>'+
          '<span class="iss-drop-close" onclick="closeIss(this,event)">&times;</span>'+
        '</div>'+
        '<div class="iss-drop-body">'+
          '<div class="iss-drop-text">'+text+'</div>'+
          linkHtml+
        '</div>'+
      '</div>'+
    '</span>'
  );
}
function toggleIss(btn,e){
  e.stopPropagation();
  var drop=btn.nextElementSibling;
  var isOpen=drop.classList.contains('show');
  document.querySelectorAll('.iss-drop.show').forEach(function(d){d.classList.remove('show');});
  document.querySelectorAll('.ib.open').forEach(function(b){b.classList.remove('open');});
  if(!isOpen){drop.classList.add('show');btn.classList.add('open');}
}
function closeIss(closeBtn,e){
  e.stopPropagation();
  var drop=closeBtn.closest('.iss-drop');
  drop.classList.remove('show');
  drop.previousElementSibling.classList.remove('open');
}
document.addEventListener('click',function(){
  document.querySelectorAll('.iss-drop.show').forEach(function(d){d.classList.remove('show');});
  document.querySelectorAll('.ib.open').forEach(function(b){b.classList.remove('open');});
});
function errTip(t){
  if(!t||!t.failed||!t.err)return'';
  var safe=t.err.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return'<span class="err-tip">'+safe+'</span>';
}

var suitesCont=document.getElementById('suites');
var rowIdx=0;

D.suites.forEach(function(suite,si){
  var name=suite.name, pairs=suite.pairs, stats=suite.stats;
  var block=document.createElement('div');
  block.className='sblock';
  block.setAttribute('data-si',si);

  var failPill=stats.failed ?'<span class="pill f">&#10007; '+stats.failed+' failed</span>':'';
  var skipPill=stats.skipped?'<span class="pill s">&#8855; '+stats.skipped+' skipped</span>':'';

  block.innerHTML=
    '<div class="shdr" onclick="toggle('+si+')">'+
      '<div class="chev"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 1.5L6.5 4.5L2 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
      '<div class="sname">'+name+'</div>'+
      '<div class="pills-c">'+
        '<span class="pill t">'+stats.total+' tests</span>'+
        '<span class="pill p">&#10003; '+stats.passed+'</span>'+
      '</div>'+
      '<div class="pills-e">'+
        '<span class="pill t">'+stats.total+' total</span>'+
        '<span class="pill p">&#10003; '+stats.passed+' passed</span>'+
        failPill+skipPill+
      '</div>'+
    '</div>';

  var body=document.createElement('div');
  body.className='sbody';

  var table=document.createElement('table');
  table.className='ttbl';
  table.innerHTML='<thead><tr><th>Test Case</th><th>English</th><th>Spanish</th><th>Comments</th></tr></thead>';

  var tbody=document.createElement('tbody');

  pairs.forEach(function(pair){
    var base=pair.base, en=pair.en, es=pair.es;
    var key=rowIdx++;
    var enSC=sc(en), esSC=sc(es);
    var anyIssue=(en&&en.hasIssue)||(es&&es.hasIssue);

    var tr=document.createElement('tr');
    tr.setAttribute('data-k',key);
    tr.setAttribute('data-en',enSC);
    tr.setAttribute('data-es',esSC);
    tr.setAttribute('data-iss',anyIssue?'1':'0');

    tr.innerHTML=
      '<td class="tname">'+base+(issHtml(en,'en'+key)||issHtml(es,'es'+key))+'</td>'+
      '<td><span class="sb '+enSC+'">'+slIcon(en)+errTip(en)+'</span></td>'+
      '<td><span class="sb '+esSC+'">'+slIcon(es)+errTip(es)+'</span></td>'+
      '<td><input class="ci" type="text" data-k="'+key+'" placeholder="Add comment" oninput="saveC('+key+',this.value)"/></td>';

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  body.appendChild(table);
  block.appendChild(body);
  suitesCont.appendChild(block);
});

document.getElementById('sTotal').textContent=D.stats.total;
document.getElementById('sPassed').textContent=D.stats.passed;
document.getElementById('sFailed').textContent=D.stats.failed;
document.getElementById('sSkipped').textContent=D.stats.skipped;
document.getElementById('hdrMeta').textContent='Platform: '+D.meta.platform+'  |  Generated: '+D.meta.reportDate;

function toggle(si){
  document.querySelector('.sblock[data-si="'+si+'"]').classList.toggle('open');
}
function expandAll(){
  document.querySelectorAll('.sblock:not(.gone)').forEach(function(b){b.classList.add('open');});
}
function collapseAll(){
  document.querySelectorAll('.sblock').forEach(function(b){b.classList.remove('open');});
}

function setF(f){
  document.querySelectorAll('.fbtn').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-f')===f);});
  var vis=0;
  document.querySelectorAll('.sblock').forEach(function(block){
    var hits=0;
    block.querySelectorAll('tbody tr').forEach(function(row){
      var enS=row.getAttribute('data-en'), esS=row.getAttribute('data-es'), iss=row.getAttribute('data-iss');
      var show=
        f==='all'    ?true:
        f==='passed' ?(enS==='passed' ||esS==='passed'):
        f==='failed' ?(enS==='failed' ||esS==='failed'):
        f==='skipped'?(enS==='skipped'||esS==='skipped'):
        f==='notrun' ?(enS==='not-run'||esS==='not-run'):
        f==='issue'  ?(iss==='1'):true;
      row.classList.toggle('hide',!show);
      if(show)hits++;
    });
    var hide=hits===0;
    block.classList.toggle('gone',hide);
    if(!hide){vis++;block.classList.add('open');}
  });
  document.getElementById('nores').classList.toggle('show',vis===0);
}

function saveC(k,v){
  try{
    localStorage.setItem('c_'+k,v);
    var el=document.getElementById('sind');
    el.classList.add('show');
    clearTimeout(el._t);
    el._t=setTimeout(function(){el.classList.remove('show');},1800);
  }catch(e){}
}
function loadC(){
  document.querySelectorAll('.ci').forEach(function(inp){
    var v=localStorage.getItem('c_'+inp.getAttribute('data-k'));
    if(v)inp.value=v;
  });
}
function exportCSV(){
  function esc(s){return'"'+String(s).replace(/"/g,'""')+'"';}
  var rows=[['Suite','Test Case','Issue','English','Spanish','Comment']];
  var k=0;
  D.suites.forEach(function(suite){
    suite.pairs.forEach(function(pair){
      var en=pair.en,es=pair.es;
      var iss=(en&&en.hasIssue)||(es&&es.hasIssue)?((en&&en.issueName)||(es&&es.issueName)||'yes'):'';
      var comment=localStorage.getItem('c_'+k)||'';
      rows.push([suite.name,pair.base,iss,sl(en),sl(es),comment]);
      k++;
    });
  });
  var csv=rows.map(function(r){return r.map(esc).join(',');}).join('\\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='test-report-'+D.meta.reportTS.split('T')[0]+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
window.addEventListener('load',loadC);
`;

// ── Assemble HTML by concatenation — zero template literal escaping ───────────
const html = [
  "<!DOCTYPE html>",
  '<html lang="en">',
  "<head>",
  '<meta charset="UTF-8"/>',
  '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>',
  "<title>iOS Test Report</title>",
  "<style>",
  css,
  "</style>",
  "</head>",
  "<body>",
  '<div class="page">',

  '<div class="hdr">',
  "  <div><h1>&#128241; iOS Test Report <span>v2</span></h1>",
  '  <div class="hdr-meta" id="hdrMeta">Loading&hellip;</div></div>',
  '  <a href="index.html" class="back">&larr; Dashboard</a>',
  "</div>",

  '<div class="stats">',
  '  <div class="sc"><div class="sc-lbl">Total</div><div class="sc-val" id="sTotal">0</div></div>',
  '  <div class="sc p"><div class="sc-lbl">&#10003; Passed</div><div class="sc-val" id="sPassed">0</div></div>',
  '  <div class="sc f"><div class="sc-lbl">&#10007; Failed</div><div class="sc-val" id="sFailed">0</div></div>',
  '  <div class="sc s"><div class="sc-lbl">&#8855; Skipped</div><div class="sc-val" id="sSkipped">0</div></div>',
  "</div>",

  '<div class="legend">',
  '  <span class="leg-ttl">Legend</span>',
  '  <div class="leg-item"><span class="lb p">&#10003; PASS</span> Test passed</div>',
  '  <div class="leg-item"><span class="lb f">&#10007; FAIL</span> Test failed</div>',
  '  <div class="leg-item"><span class="lb s">&#8855; SKIP</span> Skipped</div>',
  '  <div class="leg-item"><span class="lb nr">&mdash; N/R</span> Not run</div>',
  '  <div class="leg-item"><span class="lb iss">!</span> Known issue &mdash; click to see full issue text</div>',
  "</div>",

  '<div class="toolbar">',
  '  <div class="fg">',
  '    <span class="flbl">Filter:</span>',
  '    <button class="fbtn on" data-f="all"     onclick="setF(\'all\')">All</button>',
  '    <button class="fbtn"    data-f="passed"  onclick="setF(\'passed\')">&#10003; Pass</button>',
  '    <button class="fbtn"    data-f="failed"  onclick="setF(\'failed\')">&#10007; Fail</button>',
  '    <button class="fbtn"    data-f="skipped" onclick="setF(\'skipped\')">&#8855; Skip</button>',
  '    <button class="fbtn"    data-f="notrun"  onclick="setF(\'notrun\')">&mdash; Not Run</button>',
  '    <button class="fbtn"    data-f="issue"   onclick="setF(\'issue\')">! Issues</button>',
  "  </div>",
  '  <div class="eg">',
  '    <button class="cbtn" onclick="expandAll()">Expand All</button>',
  '    <button class="cbtn" onclick="collapseAll()">Collapse All</button>',
  '    <span class="sind" id="sind">&#10003; Saved</span>',
  "  </div>",
  "</div>",

  '<div class="suites" id="suites"></div>',
  '<div class="nores" id="nores">No tests match the current filter.</div>',

  '<div class="exp-row">',
  '  <button class="exp-btn" onclick="exportCSV()">&#128229; Export CSV</button>',
  "</div>",

  '<div class="footer">WebdriverIO + Appium + Allure &mdash; iOS Automated Test Report</div>',
  "</div>",

  "<script>",
  js,
  "<\/script>",
  "</body>",
  "</html>",
].join("\n");

fs.writeFileSync(OUT_FILE, html);
console.log("Report written to:", OUT_FILE);
console.log(
  "Suites:",
  suiteList.length,
  "| Total:",
  gStats.total,
  "| Pass:",
  gStats.passed,
  "| Fail:",
  gStats.failed,
  "| Skip:",
  gStats.skipped,
);

// ── Generate index.html dashboard ────────────────────────────────────────────
const indexHtml = [
  "<!DOCTYPE html>",
  '<html lang="en">',
  "<head>",
  '<meta charset="UTF-8"/>',
  '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>',
  "<title>Test Reports Dashboard</title>",
  "<style>",
  "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",
  'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8f9fb;color:#1a202c;padding:40px 20px;min-height:100vh}',
  ".page{max-width:900px;margin:0 auto}",
  ".hdr{text-align:center;margin-bottom:40px}",
  '.hdr h1{font-size:32px;font-weight:700;font-family:"Courier New",monospace;margin-bottom:10px;color:#1a202c}',
  '.hdr p{font-size:14px;color:#4a5568;font-family:"Courier New",monospace}',
  ".reports{display:grid;gap:16px}",
  ".card{background:#ffffff;border:1px solid #d4d9e1;border-radius:10px;padding:24px 28px;transition:all .2s;cursor:pointer;text-decoration:none;display:block}",
  ".card:hover{border-color:#b0b8c8;background:#f4f6f8;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}",
  ".card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}",
  '.card-title{font-size:18px;font-weight:600;color:#1a202c;font-family:"Courier New",monospace}',
  ".card-icon{font-size:24px;color:#4a5568}",
  '.card-meta{font-size:12px;color:#4a5568;font-family:"Courier New",monospace;margin-bottom:14px}',
  ".card-stats{display:flex;gap:14px;flex-wrap:wrap}",
  '.stat{display:flex;align-items:center;gap:6px;font-size:13px;font-family:"Courier New",monospace}',
  ".stat-dot{width:8px;height:8px;border-radius:50%}",
  ".stat.total .stat-dot{background:#2563eb}",
  ".stat.pass .stat-dot{background:#16a34a}",
  ".stat.fail .stat-dot{background:#dc2626}",
  ".stat.skip .stat-dot{background:#d97706}",
  ".stat-val{font-weight:700}",
  ".stat.total{color:#4a5568}",
  ".stat.pass{color:#16a34a}",
  ".stat.fail{color:#dc2626}",
  ".stat.skip{color:#d97706}",
  '.footer{margin-top:60px;text-align:center;font-size:12px;color:#a0aec0;font-family:"Courier New",monospace}',
  "</style>",
  "</head>",
  "<body>",
  '<div class="page">',
  '<div class="hdr">',
  "  <h1>📊 Test Reports Dashboard</h1>",
  "  <p>iOS Mobile Testing — WebdriverIO + Appium + Allure</p>",
  "</div>",
  '<div class="reports">',
  '  <a href="test-report-v2.html" class="card">',
  '    <div class="card-top">',
  '      <div class="card-title">📱 Latest Test Run</div>',
  '      <div class="card-icon">→</div>',
  "    </div>",
  '    <div class="card-meta">Generated: ' + reportDate + "</div>",
  '    <div class="card-stats">',
  '      <div class="stat total"><span class="stat-dot"></span><span class="stat-val">' +
    gStats.total +
    "</span> total</div>",
  '      <div class="stat pass"><span class="stat-dot"></span><span class="stat-val">' +
    gStats.passed +
    "</span> passed</div>",
  '      <div class="stat fail"><span class="stat-dot"></span><span class="stat-val">' +
    gStats.failed +
    "</span> failed</div>",
  '      <div class="stat skip"><span class="stat-dot"></span><span class="stat-val">' +
    gStats.skipped +
    "</span> skipped</div>",
  "    </div>",
  "  </a>",
  "</div>",
  '<div class="footer">',
  "  Automated Test Reporting • v2.0",
  "</div>",
  "</div>",
  "</body>",
  "</html>",
].join("\n");

const INDEX_FILE = path.join(OUT_DIR, "index.html");
fs.writeFileSync(INDEX_FILE, indexHtml);
console.log("Index written to:", INDEX_FILE);
