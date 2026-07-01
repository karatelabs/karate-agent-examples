/*
 * karate-max enterprise traceability report (Track-2, K-RTM / D75) — the Alpine.js component for the
 * confidence-to-ship scorecard + the Requirements Traceability Matrix + the glossary overlay. Reads
 * window.KARATE_TRACE = { graph, readiness, requirements } (inlined as a <script> data tag, so it works
 * off file://). The risk verdict + provenance come pre-computed from the Java engine (one source of
 * truth, P18) — this file only filters, joins, and renders.
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('traceabilityReport', function () {
    return {
      data: window.KARATE_TRACE || {},
      q: '',
      critFilter: '',
      statusFilter: '',
      provFilter: '',
      expanded: {},
      view: 'matrix',           // 'matrix' (RTM rows) | 'grid' (the req × test cross-grid) | 'tree' (the epic→feature→leaf hierarchy)
      treeCollapsed: {},
      sortKey: '',              // T4: '' = authored order; else a matrix column key
      sortDir: 1,
      glossaryOpen: false,
      riskOrder: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
      crits: ['high', 'medium', 'low'],
      statuses: ['COVERED', 'SIMULATED', 'FAILING', 'NOTRUN', 'NOTCOVERED'],
      provOrder: ['exercised', 'partexercised', 'incidental', 'notexercised'],

      get graph() { return this.data.graph || {}; },
      get readiness() { return this.data.readiness || {}; },
      get reqs() { return this.data.requirements || []; },
      get ready() { return !!this.readiness.ready; },
      // three-state verdict (READY / CONDITIONAL / NOT_READY); fall back to the boolean for old data
      get state() { return this.readiness.state || (this.ready ? 'READY' : 'NOT_READY'); },
      verdictWord: function () { return { READY: 'READY', CONDITIONAL: 'CONDITIONAL', NOT_READY: 'NOT READY' }[this.state] || 'NOT READY'; },
      scorecardClass: function () { return { READY: 'k-sc-ready', CONDITIONAL: 'k-sc-conditional', NOT_READY: 'k-sc-block' }[this.state] || 'k-sc-block'; },
      get verdict() { return this.readiness.verdict || ''; },
      get blockers() { return this.readiness.blockers || []; },
      get total() { return this.reqs.length; },
      get sources() { return this.graph.sources || []; },
      get repoUrl() { return this.data.repoUrl || ''; },
      get karateSummary() { return this.data.karateSummary || ''; },

      // a tiny, offline markdown renderer for requirement prose (EARS shall-statements: **bold**,
      // *italic*, `code`) — escapes HTML first (never inject), no CDN (airgap-safe, reporting.md note 1).
      md: function (s) {
        if (!s) return '';
        var esc = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return esc
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
      },

      // risk per requirement, joined from the canonical readiness assessment (keyed by reqId)
      get riskById() {
        var m = {};
        (this.readiness.requirements || []).forEach(function (r) { m[r.reqId] = r.risk; });
        return m;
      },
      get rows() {
        var self = this, q = this.q.trim().toLowerCase(), cf = this.critFilter, sf = this.statusFilter, pf = this.provFilter, risk = this.riskById;
        var out = this.reqs.filter(function (r) {
          if (cf && (r.criticality || 'medium') !== cf) return false;
          if (sf && r.status !== sf) return false;
          if (pf && self.prov(r) !== pf) return false;
          if (q) {
            var hay = (r.reqId + ' ' + (r.title || r.name || '') + ' ' + (r.body || '')).toLowerCase();
            if (hay.indexOf(q) < 0) return false;
          }
          return true;
        }).map(function (r) { r.risk = risk[r.reqId] || self.riskFor(r.criticality || 'medium', r.status); return r; });
        if (this.sortKey) {
          var k = this.sortKey, d = this.sortDir;
          out = out.slice().sort(function (a, b) {
            var va = self.sortVal(a, k), vb = self.sortVal(b, k);
            return (va < vb ? -1 : va > vb ? 1 : 0) * d;
          });
        }
        return out;
      },

      // ---- T4: column sort (ranked enums sort by severity order, not alphabetically) ----
      sortBy: function (k) {
        if (this.sortKey === k) {
          if (this.sortDir === 1) { this.sortDir = -1; } else { this.sortKey = ''; this.sortDir = 1; }   // 3rd click = authored order
        } else { this.sortKey = k; this.sortDir = 1; }
      },
      sortVal: function (r, k) {
        switch (k) {
          case 'status': return this.statuses.indexOf(r.status);
          case 'req': return String(r.reqId);
          case 'criticality': return this.crits.indexOf(r.criticality || 'medium');
          case 'risk': return this.riskOrder.indexOf(r.risk);
          case 'provenance': return this.provOrder.indexOf(this.prov(r));
          case 'posture': return String(r.posture || '');
          case 'tests': return (r.tests || []).length;
          case 'accept': var n = this.acceptOf(r).length; return n ? this.acceptCovered(r) / n : -1;
          default: return 0;
        }
      },
      sortInd: function (k) { return this.sortKey === k ? (this.sortDir === 1 ? '↑' : '↓') : ''; },

      // ---- the unified 3-source strip ----
      // covered/total/percentage come straight from the baked per-source summary, which counts LEAF
      // items (the engine excludes acceptance-criterion sub-items + non-leaf epics/features — D75 /
      // C-foundation 2c), so the requirements tile already agrees with the matrix + scorecard. We only
      // add the unit word for clarity ("1/4 requirements", "12/20 endpoints").
      srcUnit: function (s) { return { req: 'requirements', openapi: 'endpoints', grpc: 'methods', rules: 'rules' }[s.type] || 'items'; },

      // ---- the two differentiators (T3): the risk heatmap + eval-independence ----
      pct: function (s) { return Math.round((s && s.percentage) || 0); },
      // §2h/D67: the per-source combination-coverage sub-stat baked onto each source by
      // DimensionProjection.attachSourceRollup — the "100%-green" honesty fix (rendered, never re-graded).
      comboPct: function (s) { var c = s && s.combos; return c && c.required ? Math.round(c.covered * 100 / c.required) : 0; },
      comboBarClass: function (s) { var p = this.comboPct(s); return p >= 100 ? 'k-ok' : (p > 0 ? 'k-warn' : 'k-no'); },
      comboTip: function (s) {
        var c = s && s.combos;
        if (!c) return '';
        return c.covered + ' of ' + c.required + ' required combinations tested · '
          + c.untested + ' untested · ' + c.suggested + ' suggested to test next';
      },
      // the risk-matrix cell (mirrors RequirementReadiness.risk — the cells the engine uses)
      riskFor: function (c, s) {
        if (s === 'COVERED') return 'NONE';
        var failing = s === 'FAILING';
        if (c === 'high') return 'HIGH';
        if (c === 'low') return failing ? 'MEDIUM' : 'LOW';
        return failing ? 'HIGH' : 'MEDIUM';
      },
      riskOf: function (r) { return this.riskFor(r.criticality || 'medium', r.status); },
      heatCount: function (cr, st) {
        return this.reqs.filter(function (r) { return (r.criticality || 'medium') === cr && r.status === st; }).length;
      },
      heatClass: function (cr, st) {
        var n = this.heatCount(cr, st);
        return this.riskClass(this.riskFor(cr, st)) + (n ? '' : ' k-cell-empty');
      },
      setFilter: function (cr, st) {
        this.critFilter = (this.critFilter === cr && this.statusFilter === st) ? '' : cr;
        this.statusFilter = (this.statusFilter === st && this.critFilter === '') ? '' : st;
      },
      provCount: function (p) {
        var self = this;
        return this.reqs.filter(function (r) { return self.prov(r) === p; }).length;
      },
      // "looks green, but isn't really": COVERED yet credited only incidentally (no @req= intent anchor)
      get trustGaps() {
        var self = this;
        return this.reqs.filter(function (r) { return r.status === 'COVERED' && self.prov(r) === 'incidental'; });
      },

      readySub: function () {
        if (this.state === 'READY') { return 'All requirements covered — no risk remains.'; }
        if (this.state === 'CONDITIONAL') {
          var g = (this.reqs || []).length - ((this.readiness.counts || {}).NONE || 0);
          return 'Covered core, no high-risk blocker — ' + g + ' requirement' + (g === 1 ? '' : 's') + ' not yet covered.';
        }
        var n = this.blockers.length;
        return n + ' high-risk requirement' + (n === 1 ? '' : 's') + ' must be addressed before release.';
      },
      riskCount: function (r) { return (this.readiness.counts || {})[r] || 0; },

      toggle: function (id) { this.expanded[id] = !this.expanded[id]; },
      isOpen: function (id) { return !!this.expanded[id]; },

      // acceptance criteria for a requirement = its acceptance-criterion child items in the graph
      acceptOf: function (it) {
        var prefix = it.id + '/';
        return (this.graph.items || []).filter(function (i) {
          return i.kind === 'acceptance-criterion' && String(i.id).indexOf(prefix) === 0;
        });
      },
      acceptCovered: function (it) {
        return this.acceptOf(it).filter(function (c) { return c.status === 'COVERED'; }).length;
      },

      // ---- attested evidence (D96, MODEL §2b): @ai machine claims from harness runs ----
      // hits on an item carrying the attested grade — each may bear a {shot, note, t} payload
      attestedHits: function (itemId) {
        return (this.graph.hits || []).filter(function (h) { return h.attested && h.item === itemId; });
      },
      // honest grading (§2f): an item lit ONLY by attested hits is claimed, not proven — flag it @ai
      attestedOnly: function (itemId) {
        var hits = (this.graph.hits || []).filter(function (h) { return h.item === itemId; });
        return hits.length > 0 && hits.every(function (h) { return h.attested; });
      },
      // the evidence rows for a criterion/requirement: {shot?, note?, t?, test} per attested hit
      evidenceOf: function (itemId) {
        return this.attestedHits(itemId)
          .filter(function (h) { return h.evidence; })
          .map(function (h) { var e = Object.assign({}, h.evidence); e.test = h.test; return e; });
      },
      // shot paths are runs-dir-relative (<id>/screenshots/<file>); served by the console's
      // artifact route. Configurable via data.runsBase; on file:// (no server) thumbnails are
      // omitted (no dead images) and the note + run link still render.
      get runsBase() {
        if (this.data.runsBase) return this.data.runsBase;
        return location.protocol.indexOf('http') === 0 ? '/api/artifacts/runs/' : '';
      },
      shotHref: function (e) { return e.shot && this.runsBase ? this.runsBase + e.shot : ''; },
      evTime: function (e) {
        return e.t ? new Date(e.t).toISOString().replace('T', ' ').slice(0, 19) : '';
      },

      // tests: the requirement carries test slugs; look up the test node for status + location
      testNode: function (slug) {
        return (this.graph.tests || []).find(function (t) { return t.id === slug; }) || {};
      },
      testStatus: function (slug) { return this.testNode(slug).status || ''; },
      testName: function (slug) {
        var n = this.testNode(slug).name;
        if (n) return n;
        var i = String(slug).lastIndexOf(':');
        return i >= 0 ? String(slug).slice(i + 1) : String(slug);
      },
      testLoc: function (slug) {
        var t = this.testNode(slug);
        if (!t.feature) return '';
        var f = String(t.feature).split('/').pop();
        return f + (t.line ? ':' + t.line : '');
      },
      // T2 drill-down: deep-link a covering test to its source. Prefer an external repo base when
      // configured (<repoUrl>/<feature>#L<line>); else, when this report sits beside a karate run, the
      // in-report per-feature page (Report.linkFeatureHtml inlines `featureHtml` only when it exists, so
      // there are never dead links). Empty (→ plain text) when neither applies.
      testHref: function (slug) {
        var t = this.testNode(slug);
        if (this.repoUrl && t.feature) {
          return this.repoUrl + String(t.feature).replace(/^\/+/, '') + (t.line ? '#L' + t.line : '');
        }
        return t.featureHtml || '';
      },

      // A1 (D168): a requirement id may carry an external-tracker namespace (`ado:3`, `jira:AUTH-1`).
      // `links` is a resolved { authority: urlTemplate } map (the `{id}` placeholder is substituted) —
      // set from boot.ext('requirements').tracker and persisted into the payload (same offline-safe,
      // opt-inlined shape as repoUrl). Empty / no matching authority → '' → the id renders as plain text.
      get trackerLinks() { return this.data.links || {}; },
      reqHref: function (reqId) {
        if (!reqId) return '';
        var s = String(reqId);
        var colon = s.indexOf(':');
        if (colon < 0) return '';                          // bare id, no authority → no external link
        var tmpl = this.trackerLinks[s.substring(0, colon)];
        if (!tmpl) return '';
        var id = s.substring(colon + 1).split('/')[0];     // drop any /criterion suffix
        return tmpl.split('{id}').join(encodeURIComponent(id));
      },

      // provenance (§2f): incidental (credited via @real= but no @req= anchor) wins; else the exercised level
      prov: function (it) {
        if (it.provenance === 'incidental') return 'incidental';
        return it.exercisedLevel || 'notexercised';
      },

      // ---- T4: CSV export (client-side off the inlined JSON — the "can I get this in Excel?" ask) ----
      // Exports the currently-filtered RTM rows; opens off file:// via a Blob object URL (no network).
      exportCsv: function () {
        var self = this;
        var cols = ['Requirement', 'Title', 'Type', 'Status', 'Criticality', 'Risk', 'Provenance', 'Posture', 'Tests', 'Acceptance'];
        var lines = [cols.map(this.csvCell).join(',')];
        this.rows.forEach(function (r) {
          lines.push([
            r.reqId, r.title || r.name || '', r.type || '', r.status || '',
            r.criticality || 'medium', r.risk || '', self.prov(r), r.posture || '',
            (r.tests || []).length, self.acceptOf(r).length ? (self.acceptCovered(r) + '/' + self.acceptOf(r).length) : ''
          ].map(self.csvCell).join(','));
        });
        var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'traceability-matrix.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
      },
      csvCell: function (v) {
        var s = v == null ? '' : String(v);
        return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      },

      // ---- T4: the epic→feature→leaf hierarchy tree (pure renderer over the req universe) ----
      // requirement items (excluding acceptance-criterion sub-items); ids are `req:`-namespaced while a
      // child's `parent` is the bare parent id — so link parent → the bare reqId.
      get reqUniverse() {
        return (this.graph.items || []).filter(function (i) {
          return String(i.id).indexOf('req:') === 0 && i.kind !== 'acceptance-criterion';
        });
      },
      get tree() {
        var byReqId = {}, nodes = this.reqUniverse.map(function (i) {
          var bare = String(i.id).slice(4);
          var n = { reqId: bare, title: i.name, type: i.type, status: i.status,
                    criticality: i.criticality, parent: i.parent || null, children: [] };
          byReqId[bare] = n; return n;
        });
        var roots = [];
        nodes.forEach(function (n) {
          var p = n.parent && byReqId[n.parent];
          if (p) { p.children.push(n); } else { roots.push(n); }
        });
        return roots;
      },
      // a flat, depth-tagged walk of the tree honouring collapse state (Alpine has no recursive template)
      get treeRows() {
        var self = this, out = [];
        (function walk(nodes, depth) {
          nodes.forEach(function (n) {
            out.push({ node: n, depth: depth, hasKids: n.children.length > 0 });
            if (n.children.length && !self.treeCollapsed[n.reqId]) walk(n.children, depth + 1);
          });
        })(this.tree, 0);
        return out;
      },
      treeToggle: function (reqId) { this.treeCollapsed[reqId] = !this.treeCollapsed[reqId]; },
      treeOpen: function (reqId) { return !this.treeCollapsed[reqId]; },

      // ---- T1: the bidirectional req × test cross-grid (the canonical regulated-industry RTM shape).
      // Columns = the tests covering any currently-filtered row (so the toolbar filters slice the grid
      // too); a cell = that test's own status where it verifies the requirement. Column → source via
      // the same testHref deep link as the drill-down.
      get gridTests() {
        var seen = {}, out = [];
        this.rows.forEach(function (r) {
          (r.tests || []).forEach(function (t) { if (!seen[t]) { seen[t] = true; out.push(t); } });
        });
        return out;
      },
      covers: function (r, slug) { return (r.tests || []).indexOf(slug) >= 0; },

      // ---- T2: gaps & drift — the "find what's missing" worklist (all off the inlined graph) ----
      // uncovered leaf requirements, regardless of criticality (blockers shows only the high-risk cut)
      get gapUncovered() { return this.reqs.filter(function (r) { return r.status === 'NOTCOVERED'; }); },
      // acceptance criteria not yet covered (the §4c sub-items the rollup hides)
      get gapCriteria() {
        return (this.graph.items || []).filter(function (i) {
          return i.kind === 'acceptance-criterion' && i.status !== 'COVERED';
        });
      },
      // drift: linked to tests yet never exercised — declared/claimed coverage that no run backs (§2f)
      get gapDrift() {
        var self = this;
        return this.reqs.filter(function (r) { return (r.tests || []).length > 0 && self.prov(r) === 'notexercised'; });
      },
      // orphan tests: test nodes with no hit on ANY item (cross-source — a test lighting only openapi
      // endpoints is not an orphan)
      get orphanTests() {
        var hit = {};
        (this.graph.hits || []).forEach(function (h) { hit[h.test] = true; });
        return (this.graph.tests || []).filter(function (t) { return !hit[t.id]; });
      },
      get gapCount() { return this.gapUncovered.length + this.gapCriteria.length + this.gapDrift.length + this.orphanTests.length; },
      // a criterion's parent requirement id ('req:ORD-001/1' → 'ORD-001')
      critParent: function (c) {
        var s = String(c.id).replace(/^req:/, '');
        var i = s.indexOf('/');
        return i > 0 ? s.slice(0, i) : s;
      },

      // ---- presentation ----
      // item statuses (COVERED…) and test-node statuses (PASSED…) share the maps — the grid cells and
      // the "Verified by" drill-down pills show the test's own run status
      statusClass: function (s) { return { COVERED: 'k-ok', SIMULATED: 'k-sim', FAILING: 'k-no', NOTRUN: 'k-warn', NOTCOVERED: 'k-no', PASSED: 'k-ok', FAILED: 'k-no', SKIPPED: 'k-warn' }[s] || ''; },
      statusIcon: function (s) { return { COVERED: '✓', SIMULATED: '🧪', FAILING: '✗', NOTRUN: '~', NOTCOVERED: '—', PASSED: '✓', FAILED: '✗', SKIPPED: '~' }[s] || '?'; },
      critClass: function (c) { return { high: 'k-crit-high', medium: 'k-crit-med', low: 'k-crit-low' }[c || 'medium'] || 'k-crit-med'; },
      riskClass: function (r) { return { HIGH: 'k-no', MEDIUM: 'k-warn', LOW: 'k-tag', NONE: 'k-ok' }[r] || 'k-tag'; },
      provClass: function (p) { return { exercised: 'k-ok', partexercised: 'k-warn', incidental: 'k-warn', notexercised: 'k-tag' }[p] || 'k-tag'; },

      // ---- glossary ----
      openGlossary: function (key) {
        this.glossaryOpen = true;
        var self = this;
        this.$nextTick(function () {
          var el = document.getElementById('gloss-' + key);
          if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('k-gloss-hi'); setTimeout(function () { el.classList.remove('k-gloss-hi'); }, 1400); }
        });
      },
      // flat lookup for inline tooltips
      def: function (group, term) {
        var g = (this.glossary.find(function (x) { return x.key === group; }) || {}).terms || [];
        var t = g.find(function (x) { return x.t === String(term).toLowerCase() || x.t === term; });
        return t ? t.t + ' — ' + t.d : '';
      },

      glossary: [
        {
          key: 'status', title: 'Coverage status', intro: 'The derived state of a requirement, from whether its tests ran and passed (MODEL §2c).',
          terms: [
            { t: 'COVERED', cls: 'k-ok', d: 'Verified against the live system — a passing test (and, where acceptance criteria exist, every criterion is covered).' },
            { t: 'SIMULATED', cls: 'k-sim', d: 'Realized by the rule oracle / a simulation (calc.js via calc.req), NOT yet verified against the live system. Positive evidence, but not a live green — a later live run promotes it to COVERED.' },
            { t: 'FAILING', cls: 'k-no', d: 'A linked test ran and failed.' },
            { t: 'NOTRUN', cls: 'k-warn', d: 'Linked to a test that did not run (skipped) — status unknown.' },
            { t: 'NOTCOVERED', cls: 'k-no', d: 'No covering test — or an acceptance criterion is still untested.' }
          ]
        },
        {
          key: 'criticality', title: 'Criticality', intro: 'Authored impact — how bad it is if this requirement fails. Distinct from priority, and stable (it does not churn with planning). Unset defaults to medium.',
          terms: [
            { t: 'high', cls: 'k-crit-high', d: 'Severe impact — any non-covered high requirement blocks release.' },
            { t: 'medium', cls: 'k-crit-med', d: 'Moderate impact (the baseline when unauthored).' },
            { t: 'low', cls: 'k-crit-low', d: 'Minor impact.' }
          ]
        },
        {
          key: 'risk', title: 'Risk', intro: 'Computed, never authored: criticality × the verification gap (MODEL §2c). The verdict is READY only when there are no HIGH risks.',
          terms: [
            { t: 'HIGH', cls: 'k-no', d: 'A high-criticality requirement that is not covered (or any requirement that is FAILING at medium+). A release blocker.' },
            { t: 'MEDIUM', cls: 'k-warn', d: 'Meaningful exposure — e.g. a medium requirement not yet covered.' },
            { t: 'LOW', cls: 'k-tag', d: 'Minor exposure — a low-criticality requirement not yet covered.' },
            { t: 'NONE', cls: 'k-ok', d: 'Covered — no outstanding verification risk.' }
          ]
        },
        {
          key: 'provenance', title: 'Provenance (eval-independence)', intro: 'Is this requirement actually exercised, or just claimed / incidentally hit? (MODEL §2f)',
          terms: [
            { t: 'exercised', cls: 'k-ok', d: 'Anchored to the requirement (@req=) AND really exercised — every criterion ran, or a direct test ran. The trustworthy case.' },
            { t: 'partexercised', cls: 'k-warn', d: 'Some criteria ran (or a direct test ran) while other criteria remain untested.' },
            { t: 'incidental', cls: 'k-warn', d: 'Credited because a realizing artifact (@real=) was observed, but with NO @req= intent anchor — counted and flagged. "Looks covered, but nothing claims to verify it on purpose."' },
            { t: 'notexercised', cls: 'k-tag', d: 'No real eval evidence — claimed but never run, or not covered at all.' }
          ]
        },
        {
          key: 'posture', title: 'Governance posture', intro: 'How independent the verification should be, derived from criticality via policy (MODEL §2f). Higher impact ⇒ stricter independence.',
          terms: [
            { t: 'shared', cls: 'k-tag', d: 'Report-only — the eval may share context with the implementation (default for non-high).' },
            { t: 'attest', cls: 'k-warn', d: 'The eval should be independently attested (default for high-criticality).' },
            { t: 'airgap', cls: 'k-no', d: 'The eval must run fully independent / air-gapped.' }
          ]
        }
      ]
    };
  });
});
