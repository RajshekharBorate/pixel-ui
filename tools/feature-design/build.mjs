/**
 * Writes DESIGN.md + orchestration.html for every catalog feature.
 * pixel-notification is not in the catalog and is left untouched.
 *
 * Run: node tools/feature-design/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { features } from './catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const playerDir = path.join(root, 'projects/pixel-ui/src/lib/shared/orchestration');
const sourceHtml = path.join(
  root,
  'projects/pixel-ui/src/lib/pixel-notification/orchestration.html',
);

function extractPlayer() {
  const html = fs.readFileSync(sourceHtml, 'utf8');
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  fs.mkdirSync(playerDir, { recursive: true });
  const cssPath = path.join(playerDir, 'player.css');
  if (!fs.existsSync(cssPath)) fs.writeFileSync(cssPath, style.trim() + '\n', 'utf8');
  // player.js is maintained here. Do not overwrite it from the notification page.
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function mermaidLabel(value) {
  return String(value).replaceAll('"', "'").replaceAll(';', ',').replaceAll(':', ' -');
}

/**
 * Sequence arrows use a short complete phrase when possible.
 * Full step prose stays in §3 Flows — never cut mid-word.
 */
function seqMessage(step) {
  const raw = mermaidLabel(step.label || step.text);
  if (step.label) return raw;
  const firstSentence = raw.match(/^.*?[.!?](?:\s|$)/);
  if (firstSentence && firstSentence[0].trim().length >= 24) {
    return firstSentence[0].trim();
  }
  return raw;
}

function designMarkdown(item, files) {
  const byId = Object.fromEntries(item.nodes.map((node) => [node.id, node]));
  const edgeSet = new Map();
  for (const story of Object.values(item.stories)) {
    for (const step of story.steps) {
      for (const [from, to] of step.edges || []) {
        edgeSet.set(`${from}>${to}`, [from, to]);
      }
    }
  }
  const flowLines = ['flowchart LR'];
  for (const node of item.nodes) {
    flowLines.push(`  ${node.id}["${mermaidLabel(node.title)}"]`);
  }
  for (const [from, to] of edgeSet.values()) {
    flowLines.push(`  ${from} --> ${to}`);
  }

  const storyBlocks = Object.values(item.stories)
    .map((story) => {
      const steps = story.steps
        .map((step, index) => `${index + 1}. ${step.text.replaceAll(';', ',')}`)
        .join('\n');
      return `### ${story.label}\n\n${steps}`;
    })
    .join('\n\n');

  const sequences = Object.values(item.stories)
    .map((story) => {
      const used = [];
      const seen = new Set();
      for (const step of story.steps) {
        for (const id of step.on) {
          if (!seen.has(id) && byId[id]) {
            seen.add(id);
            used.push(id);
          }
        }
      }
      const participants = used
        .map((id) => `  participant ${id} as ${JSON.stringify(mermaidLabel(byId[id].title))}`)
        .join('\n');
      const messages = story.steps
        .map((step) => {
          const edge = step.edges?.[0];
          const from = edge?.[0] && byId[edge[0]] ? edge[0] : step.on[0];
          const to = edge?.[1] && byId[edge[1]] ? edge[1] : step.on[1] || step.on[0];
          return `  ${from}->>${to}: ${seqMessage(step)}`;
        })
        .join('\n');
      return `### ${story.label}\n\n\`\`\`mermaid\nsequenceDiagram\n${participants}\n${messages}\n\`\`\``;
    })
    .join('\n\n');

  const does = item.does.map((line) => `| ${line[0]} | ${line[1]} |`).join('\n');
  const mistakes = item.mistakes.map((line) => `- ${line}`).join('\n');
  const states = item.states.map((line) => `- ${line}`).join('\n');
  const fileList = files.map((name) => `- \`${name}\``).join('\n');

  return `# ${item.title} — design

This page explains **${item.title}** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the \`src/lib\` folder so the shared player script can load).

## 1. What this does, and what it does not

${item.summary}

| This piece does | It does not |
| --- | --- |
${does}

## 2. Who talks to whom

\`\`\`mermaid
${flowLines.join('\n')}
\`\`\`

## 3. Flows

${storyBlocks}

## 4. Step by step

${sequences}

## 5. States

${states}

## 6. Easy to get wrong

${mistakes}

## 7. Files

${fileList}

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
`;
}

function orchestrationHtml(item, cssHref, jsHref) {
  const stories = {};
  const labels = [];
  for (const [id, story] of Object.entries(item.stories)) {
    stories[id] = story.steps;
    labels.push([id, story.label]);
  }
  const buttons = labels
    .map(
      ([id, label], index) =>
        `          <button type="button" data-scenario="${esc(id)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(label)}</button>`,
    )
    .join('\n');
  const payload = JSON.stringify({ nodes: item.nodes, stories });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(item.title)} orchestration</title>
  <link rel="stylesheet" href="${cssHref}" />
</head>
<body>
  <header>
    <h1>${esc(item.title)} orchestration</h1>
    <div class="bar">
      <div class="scenarios-block">
        <p class="group-label" id="scenario-label">Which story to play</p>
        <div class="scenarios" role="group" aria-labelledby="scenario-label">
${buttons}
        </div>
      </div>
      <div class="transport-block">
        <p class="group-label" id="playback-label">Playback</p>
        <div class="transport" role="group" aria-labelledby="playback-label">
          <button type="button" id="play" class="primary">Play</button>
          <button type="button" id="pause">Pause</button>
          <button type="button" id="prev">Previous</button>
          <button type="button" id="next">Next step</button>
          <button type="button" id="restart">Start over</button>
        </div>
      </div>
    </div>
    <div class="legend" aria-label="How to read the cards">
      <div class="legend-item">
        <i class="legend-card hot" aria-hidden="true"></i>
        <span><strong>Now</strong><small>Active in this step</small></span>
      </div>
      <div class="legend-item">
        <i class="legend-card done" aria-hidden="true"></i>
        <span><strong>Done</strong><small>Already covered</small></span>
      </div>
      <div class="legend-item">
        <i class="legend-card waiting" aria-hidden="true"></i>
        <span><strong>Later</strong><small>In this story, not yet</small></span>
      </div>
      <div class="legend-item">
        <i class="legend-card blocked" aria-hidden="true"></i>
        <span><strong>Skipped</strong><small>Does not run now</small></span>
      </div>
      <div class="legend-item">
        <i class="legend-card dim" aria-hidden="true"></i>
        <span><strong>Off-stage</strong><small>Not in this story</small></span>
      </div>
    </div>
    <ol class="order" id="order" aria-label="Step order"></ol>
  </header>
  <main>
    <div class="stage-wrap">
      <div class="stage" id="stage">
        <svg class="wires" id="wires" aria-hidden="true"></svg>
        <div class="signals" id="signals" aria-hidden="true"></div>
      </div>
      <div class="caption" aria-live="polite">
        <div class="step-label" id="stepLabel">Step 1</div>
        <p class="focus-line" id="focusLine"></p>
        <p id="stepText"></p>
      </div>
      <p class="hint">Numbers on the cards are the step order for this story. A card with two numbers is used twice. The list above the map is the same order. Click a number to jump there.</p>
    </div>
  </main>
  <script>
    window.__ORCH = ${payload};
  </script>
  <script src="${jsHref}"></script>
</body>
</html>
`;
}

function linkReadme(dir) {
  const file = path.join(dir, 'README.md');
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes('DESIGN.md')) return;
  const marker = '\n## ';
  const idx = text.indexOf(marker);
  if (idx < 0) return;
  const sentence =
    '\n\nPlain-language design and every user flow live in [DESIGN.md](./DESIGN.md). Step through them in [orchestration.html](./orchestration.html).\n';
  text = text.slice(0, idx) + sentence + text.slice(idx);
  fs.writeFileSync(file, text, 'utf8');
}

function listFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => !name.endsWith('.spec.ts') && name !== 'README.md' && name !== 'DESIGN.md' && name !== 'orchestration.html' && name !== 'PLAN.md')
    .sort();
}

extractPlayer();
const seen = new Set();
for (const item of features) {
  if (seen.has(item.dir)) throw new Error(`Duplicate feature: ${item.dir}`);
  seen.add(item.dir);
  if (item.dir.includes('pixel-notification')) throw new Error('Do not regenerate notification');
  const dir = path.join(root, item.dir);
  if (!fs.existsSync(path.join(dir, 'README.md'))) throw new Error(`Missing README: ${item.dir}`);
  const cssHref = path.relative(dir, path.join(playerDir, 'player.css')).replaceAll('\\', '/');
  const jsHref = path.relative(dir, path.join(playerDir, 'player.js')).replaceAll('\\', '/');
  const files = listFiles(dir);
  fs.writeFileSync(path.join(dir, 'DESIGN.md'), designMarkdown(item, files), 'utf8');
  fs.writeFileSync(path.join(dir, 'orchestration.html'), orchestrationHtml(item, cssHref, jsHref), 'utf8');
  linkReadme(dir);
  const usedNodes = new Set();
  const storyCount = Object.keys(item.stories).length;
  if (storyCount < 2) {
    throw new Error(`${item.dir} needs at least 2 stories (has ${storyCount})`);
  }
  for (const story of Object.values(item.stories)) {
    if (!story.steps?.length || story.steps.length < 2) {
      throw new Error(`${item.dir} story "${story.label}" needs at least 2 steps`);
    }
    for (const step of story.steps) {
      for (const id of [...step.on, ...(step.blocked || [])]) {
        usedNodes.add(id);
        if (!item.nodes.some((node) => node.id === id)) {
          throw new Error(`${item.dir} story "${story.label}" uses unknown card "${id}"`);
        }
      }
      for (const [from, to] of step.edges || []) {
        usedNodes.add(from);
        usedNodes.add(to);
        if (!item.nodes.some((node) => node.id === from) || !item.nodes.some((node) => node.id === to)) {
          throw new Error(`${item.dir} story "${story.label}" has a bad arrow ${from}>${to}`);
        }
      }
    }
  }
  for (const node of item.nodes) {
    if (!usedNodes.has(node.id)) {
      throw new Error(`${item.dir} card "${node.id}" is never used in any story`);
    }
  }
}

const playerReadme = `# Shared orchestration player

The step-through pages (\`orchestration.html\` next to each component and service) share this player.

- \`player.css\` — card, wire, and caption styles
- \`player.js\` — story playback, arrows, and lines that stay outside the cards

Each page sets \`window.__ORCH\` (\`nodes\` and \`stories\`) and then loads \`player.js\`.

Open a page by serving \`projects/pixel-ui/src/lib\` (a \`file://\` open often blocks the shared script). \`pixel-notification/orchestration.html\` is the original self-contained page and does not use this folder.
`;
fs.writeFileSync(path.join(playerDir, 'README.md'), playerReadme, 'utf8');
console.log(`Wrote ${features.length} feature pairs.`);
