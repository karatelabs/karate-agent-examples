#!/usr/bin/env node
// The README-embeddable proof badges — one shields-style flat SVG per published number, plus one JSON file
// a shields.io dynamic badge can read. Written beside the engine's own ext/governance/pages/governance-badge.svg
// so the org README embeds every number by a path that never moves.
//
// Nothing here is computed: each value is read off the grade (governance-data.js) and the pair
// (contract-data.js) the engine just rendered, with the HTML report's own formatting — a percentage is
// floored except at a true 1.0, and a score is green/amber/red at 0.9/0.7 — so a badge and the page it
// links to can never disagree. The SVG shape copies the engine's GovernanceBadge.
//
// usage: node proof-badges.js <reports dir>     (e.g. policy-api/target/karate-reports)
'use strict';
const fs = require('fs');
const path = require('path');

const reports = process.argv[2];
if (!reports) { console.error('usage: node proof-badges.js <reports dir>'); process.exit(2); }

const GREEN = '#4c1', AMBER = '#dfb317', RED = '#e05d44', GREY = '#9f9f9f', BLUE = '#007ec6';
const CHAR_PX = 6.5, PAD_PX = 10;

/** A rendered report's data file assigns one window global; evaluate it with a stand-in window. */
function load(rel, key) {
  const file = path.join(reports, rel);
  if (!fs.existsSync(file)) return null;
  const win = {};
  new Function('window', fs.readFileSync(file, 'utf8'))(win);
  return win[key] || null;
}

const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const width = text => Math.ceil(String(text).length * CHAR_PX) + 2 * PAD_PX;

function svg(label, value, colour, title) {
  const lw = width(label), vw = width(value), total = lw + vw;
  const t = escape(title || `${label}: ${value}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${t}">`
    + `<title>${t}</title>`
    + '<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/>'
    + '<stop offset="1" stop-opacity=".1"/></linearGradient>'
    + `<g shape-rendering="crispEdges"><rect width="${lw}" height="20" fill="#555"/>`
    + `<rect x="${lw}" width="${vw}" height="20" fill="${colour}"/></g>`
    + `<rect width="${total}" height="20" fill="url(#s)"/>`
    + '<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="11">'
    + `<text x="${Math.floor(lw / 2)}" y="14">${escape(label)}</text>`
    + `<text x="${lw + Math.floor(vw / 2)}" y="14">${escape(value)}</text></g></svg>\n`;
}

// the governance page's own pct() and scoreClass()
const pct = v => typeof v === 'number' ? (v >= 1 ? 100 : Math.min(99, Math.floor(v * 100))) + '%' : 'not measured';
const scoreColour = v => typeof v !== 'number' ? GREY : v >= 0.9 ? GREEN : v >= 0.7 ? AMBER : RED;
const verdictColour = v => ({ READY: GREEN, CONDITIONAL: AMBER })[v] || RED;

const grade = load('ext/governance/governance-data.js', 'KARATE_GOVERNANCE');
const pair = load('ext/contract/contract-data.js', 'KARATE_PAIR');
if (!grade && !pair) { console.log('proof-badges: no governance or contract data under ' + reports + ' — nothing to badge'); process.exit(0); }

const out = path.join(reports, 'ext/governance/pages');
fs.mkdirSync(out, { recursive: true });
const values = { schemaVersion: 1 };
const badges = [];
const emit = (file, label, value, colour, title) => {
  fs.writeFileSync(path.join(out, file), svg(label, value, colour, title));
  badges.push(`${file}  ${label}: ${value}`);
};

if (grade) {
  const dim = k => grade.dimensions && grade.dimensions[k] && grade.dimensions[k].measured !== false
    ? grade.dimensions[k].score : null;
  const index = typeof grade.index === 'number' ? grade.index : null;
  const design = dim('design'), proven = dim('provenness');
  emit('governance-index.svg', 'governance index', pct(index), verdictColour(grade.verdict),
    `governance index: ${pct(index)} · ${grade.verdict || 'not graded'}`);
  emit('governance-design.svg', 'design', pct(design), scoreColour(design));
  emit('governance-provenness.svg', 'proven-ness', pct(proven), scoreColour(proven));
  Object.assign(values, { index: pct(index), verdict: grade.verdict || null, design: pct(design), provenness: pct(proven) });
}

if (pair) {
  const o = pair.outcomes || {};
  const total = Object.values(o).reduce((n, v) => n + (typeof v === 'number' ? v : 0), 0);
  const agreed = o.agreed || 0;
  const cc = pair.claim && pair.claim.claimCoverage;
  const untested = cc && Array.isArray(cc.notexercised) ? cc.notexercised.length : null;
  const date = typeof pair.mintedAt === 'string' ? pair.mintedAt.slice(0, 10) : null;
  emit('contract-matched.svg', 'contract scenarios', `${agreed}/${total} matched`,
    total > 0 && agreed === total ? GREEN : total === 0 ? GREY : RED);
  emit('contract-untested.svg', 'operations not tested', untested === null ? 'not measured' : String(untested),
    untested === null ? GREY : untested === 0 ? GREEN : AMBER,
    untested ? `operations not tested: ${untested} · ${cc.notexercised.join(', ')}` : undefined);
  emit('contract-last-run.svg', 'last contract run', date || 'never', date ? BLUE : GREY,
    `last contract run: ${pair.mintedAt || 'never'}`);
  Object.assign(values, { contractMatched: agreed, contractScenarios: total, notTested: untested, lastContractRun: date });
}

fs.writeFileSync(path.join(out, 'proof-badges.json'), JSON.stringify(values, null, 2) + '\n');
console.log('proof-badges: wrote to ' + out + '\n  ' + badges.concat('proof-badges.json').join('\n  '));
