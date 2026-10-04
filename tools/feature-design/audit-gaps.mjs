/**
 * Architect audit: DESIGN.md + orchestration.html gaps vs catalog and README.
 * Run: node tools/feature-design/audit-gaps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { features } from './catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const issues = [];

function add(dir, kind, msg) {
  issues.push({ dir, kind, msg });
}

for (const item of features) {
  const dir = item.dir.replaceAll('\\', '/');
  const nodeIds = new Set(item.nodes.map((n) => n.id));
  const used = new Set();
  const storyKeys = Object.keys(item.stories || {});

  if (!item.title) add(dir, 'missing', 'title');
  if (!item.summary || item.summary.trim().length < 40) {
    add(dir, 'thin', `summary too short: ${(item.summary || '').slice(0, 60)}`);
  }
  if (!item.does?.length) add(dir, 'missing', 'does table');
  if (!item.states?.length) add(dir, 'missing', 'states');
  if (!item.mistakes?.length) add(dir, 'missing', 'mistakes');
  if (storyKeys.length < 2) add(dir, 'thin', `only ${storyKeys.length} stories`);
  if (item.nodes.length < 3) add(dir, 'thin', `only ${item.nodes.length} nodes`);

  const pos = new Map();
  for (const n of item.nodes) {
    const key = `${n.x},${n.y}`;
    if (pos.has(key)) add(dir, 'layout', `overlap at ${key}: ${pos.get(key)} & ${n.id}`);
    pos.set(key, n.id);
    if (!n.title || !n.text) add(dir, 'missing', `node ${n.id} missing title/text`);
  }

  for (const [sid, story] of Object.entries(item.stories)) {
    if (!story.label) add(dir, 'missing', `story ${sid} label`);
    if (!story.steps?.length) add(dir, 'missing', `story ${sid} empty steps`);
    if ((story.steps?.length || 0) < 2) add(dir, 'thin', `story ${sid} has <2 steps`);
    for (const [i, step] of (story.steps || []).entries()) {
      if (!step.on?.length) add(dir, 'broken', `${sid}[${i}] no on`);
      if (!step.text || step.text.trim().length < 20) {
        add(dir, 'thin', `${sid}[${i}] short text: ${step.text || ''}`);
      }
      for (const id of [...(step.on || []), ...(step.blocked || [])]) {
        used.add(id);
        if (!nodeIds.has(id)) add(dir, 'broken', `${sid}[${i}] unknown card ${id}`);
      }
      for (const [from, to] of step.edges || []) {
        if (!nodeIds.has(from) || !nodeIds.has(to)) {
          add(dir, 'broken', `${sid}[${i}] bad edge ${from}>${to}`);
        }
      }
    }
  }

  for (const id of nodeIds) {
    if (!used.has(id)) add(dir, 'unused-node', id);
  }

  const abs = path.join(root, item.dir);
  for (const f of ['DESIGN.md', 'orchestration.html', 'README.md']) {
    if (!fs.existsSync(path.join(abs, f))) add(dir, 'missing-file', f);
  }

  const html = fs.readFileSync(path.join(abs, 'orchestration.html'), 'utf8');
  const m = html.match(/window\.__ORCH = (\{[\s\S]*?\});\s*<\/script>/);
  if (!m) add(dir, 'orch', 'no __ORCH payload');
  else {
    try {
      const payload = JSON.parse(m[1]);
      if ((payload.nodes || []).length !== item.nodes.length) {
        add(dir, 'drift', `orch nodes ${payload.nodes.length} vs catalog ${item.nodes.length}`);
      }
      const orchStories = Object.keys(payload.stories || {});
      for (const k of storyKeys) {
        if (!orchStories.includes(k)) add(dir, 'drift', `orch missing story ${k}`);
        const attr = `data-scenario="${k}"`;
        if (!html.includes(attr)) add(dir, 'drift', `button missing for ${k}`);
      }
    } catch (e) {
      add(dir, 'orch', `JSON parse fail: ${e.message}`);
    }
  }

  const design = fs.readFileSync(path.join(abs, 'DESIGN.md'), 'utf8');
  for (const sec of [
    '## 1. What this does',
    '## 2. Who talks to whom',
    '## 3. Flows',
    '## 4. Step by step',
    '## 5. States',
    '## 6. Easy to get wrong',
    '## 7. Files',
  ]) {
    if (!design.includes(sec)) add(dir, 'design-section', `missing ${sec}`);
  }

  const seqMsgs = [...design.matchAll(/->>[^:]+: ([^\n]+)/g)].map((x) => x[1]);
  for (const msg of seqMsgs) {
    // Flag mid-word cuts only (legacy slice(0,90) bug). Complete sentences / first-sentence
    // shortening used by the builder are fine.
    if (/[A-Za-z0-9]$/.test(msg) && msg.length >= 85 && !/[.!?…]/.test(msg.slice(-3))) {
      add(dir, 'truncation', `seq msg looks mid-cut: …${msg.slice(-50)}`);
    }
  }

  const readme = fs.readFileSync(path.join(abs, 'README.md'), 'utf8');
  if (!readme.includes('DESIGN.md')) add(dir, 'readme', 'no DESIGN.md link');
  if (!readme.includes('orchestration.html')) add(dir, 'readme', 'no orchestration.html link');
}

// notification is hand-authored (not in catalog)
const notifDir = 'projects/pixel-ui/src/lib/pixel-notification';
const nd = fs.readFileSync(path.join(root, notifDir, 'DESIGN.md'), 'utf8');
const no = fs.readFileSync(path.join(root, notifDir, 'orchestration.html'), 'utf8');
if (nd.length < 2000) add(notifDir, 'notif', `DESIGN suspiciously short (${nd.length} chars)`);
if (!no.includes('scenario') && !no.includes('__ORCH')) {
  add(notifDir, 'notif', 'orchestration missing scenario wiring');
}
for (const sec of ['## 1.', '## 2.', '## 3.']) {
  if (!nd.includes(sec)) add(notifDir, 'notif', `DESIGN missing ${sec}`);
}

const byKind = {};
for (const i of issues) byKind[i.kind] = (byKind[i.kind] || 0) + 1;
console.log('TOTAL ISSUES', issues.length);
console.log('BY KIND', JSON.stringify(byKind, null, 2));
console.log('\n--- DETAILS ---');
for (const i of issues) {
  console.log(`${i.kind.padEnd(14)} ${path.basename(i.dir).padEnd(28)} ${i.msg}`);
}
console.log(`\nCatalog features: ${features.length} (+ hand-authored notification = 64)`);
