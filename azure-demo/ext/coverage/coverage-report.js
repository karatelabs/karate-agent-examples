/*
 * karate-max standalone coverage report (Track-2) — the Alpine.js component doing the reactive
 * heavy lifting (filter by source/status/text, expandable drill-down). Reads the karate-trace/v1
 * graph from window.KARATE_COVERAGE_DATA (inlined as a <script> data tag, so it works off file://,
 * loaded from disk and never over the network). Vanilla helpers where they read clearer.
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('coverageReport', function () {
    return {
      data: window.KARATE_COVERAGE_DATA || {},
      q: '',
      sourceFilter: '',
      statusFilter: '',
      expanded: {},

      get sources() { return this.data.sources || []; },
      get allItems() { return this.data.items || []; },
      get hits() { return this.data.hits || []; },
      get karateSummary() { return this.data.karateSummary || ''; },

      // A1 (D168): a requirement id (`req:ORD-001`) → an external-tracker click-through, when a provider
      // is configured (ADO Story / Jira / git heading). `links` is a resolved { authority: urlTemplate }
      // map keyed on the requirement namespace, inlined into the coverage data global (same offline-safe
      // shape as the RTM). Empty / no matching authority → '' → the id renders as plain text. Mirrors the
      // RTM's reqHref so both artifacts link the same way (hyperlinks-to-source-of-truth everywhere).
      get trackerLinks() { return this.data.links || {}; },
      // bare-id → the requirement item (for the git provider's per-requirement sourceFile + heading anchor)
      get reqItemById() {
        var m = {};
        (this.data.items || []).forEach(function (i) {
          if (i.kind === 'req') m[String(i.id).replace(/^req:/, '')] = i;
        });
        return m;
      },
      reqHref: function (id) {
        if (!id) return '';
        var s = String(id);
        var colon = s.indexOf(':');
        var authority = colon < 0 ? 'req' : s.substring(0, colon);
        var tmpl = this.trackerLinks[authority];
        if (!tmpl) return '';
        var local = colon < 0 ? s : s.substring(colon + 1);
        var localId = local.split('/')[0];                 // drop any /criterion suffix
        var url = tmpl.split('{id}').join(encodeURIComponent(localId));
        // the git provider (E8/D168) needs the item's stamped source file + heading anchor (the id alone
        // can't fill {file}/{anchor}); no sourceFile ⇒ plain text (fail-soft). Mirrors the RTM's reqHref.
        if (url.indexOf('{file}') >= 0 || url.indexOf('{anchor}') >= 0) {
          var it = this.reqItemById[localId];
          if (!it || !it.sourceFile) return '';
          var file = String(it.sourceFile).split('/').map(encodeURIComponent).join('/');
          url = url.split('{file}').join(file).split('{anchor}').join(it.anchor || '');
        }
        return url;
      },

      // diagnostics (carried in the same graph): calls that matched no spec op, and spec-load lint
      get unmatched() { return this.data.unmatched || []; },
      get warnings() {
        var out = [];
        (this.sources || []).forEach(function (s) {
          (s.warnings || []).forEach(function (w) {
            out.push({ source: s.namespace || s.type, type: w.type, endpoint: w.endpoint, message: w.message });
          });
        });
        return out;
      },

      // the main list: real items only (acceptance criteria show nested under their requirement)
      get listItems() {
        return this.allItems.filter(function (i) { return i.kind !== 'acceptance-criterion'; });
      },
      get visibleTotal() { return this.listItems.length; },
      get rows() {
        var q = this.q.trim().toLowerCase();
        var src = this.sourceFilter, st = this.statusFilter;
        return this.listItems.filter(function (i) {
          if (src && i.source !== src) return false;
          if (st && i.status !== st) return false;
          if (q) {
            var hay = (i.id + ' ' + (i.name || '') + ' ' + (i.path || '') + ' ' + (i.method || '')).toLowerCase();
            if (hay.indexOf(q) < 0) return false;
          }
          return true;
        });
      },

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
      // §2h: the per-source marginal input-adequacy sub-stat (DimensionProjection.marginalRollup) — how many
      // input equivalence classes were exercised. The headline signal for the zero-authoring spec grade.
      inputPct: function (s) { var i = s && s.inputs; return i && i.total ? Math.round(i.covered * 100 / i.total) : 0; },
      inputBarClass: function (s) { var p = this.inputPct(s); return p >= 100 ? 'k-ok' : (p > 0 ? 'k-warn' : 'k-no'); },
      inputTip: function (s) {
        var i = s && s.inputs;
        if (!i) return '';
        return i.covered + ' of ' + i.total + ' input equivalence classes exercised across '
          + i.axes + ' dimension(s)';
      },
      toggle: function (id) { this.expanded[id] = !this.expanded[id]; },
      isOpen: function (id) { return !!this.expanded[id]; },

      // drill-down sources
      criteria: function (item) {
        var prefix = item.id + '/';
        return this.allItems.filter(function (i) {
          return i.kind === 'acceptance-criterion' && i.id.indexOf(prefix) === 0;
        });
      },
      hitsFor: function (id) {
        return this.hits.filter(function (h) { return h.item === id; });
      },

      // §2h coverage dimensions (D118): the GRADED projection baked in by Report.generate (marginal
      // coveredProportion per axis + the cross/point block) — rendered, never re-graded here.
      get dimensions() { return this.data.dimensions || []; },
      dimsFor: function (id) {
        return this.dimensions.find(function (d) { return d.id === id; }) || null;
      },
      // the per-axis marginal rows of a dimension item, as a render-friendly list
      axisList: function (d) {
        if (!d || !d.axes) return [];
        return Object.keys(d.axes).map(function (k) {
          var a = d.axes[k];
          return { name: k, closed: !!a.closed, coveredProportion: a.coveredProportion,
                   seen: a.seen || [], gaps: a.gaps || [], kind: a.kind || null, source: a.source || null };
        });
      },
      // §2h: the muted `kind · provenance` tag beside an axis name — the kind (cardinality/string/enum/…)
      // and where its universe came from (the OpenAPI spec vs a rulebook). Auto-derived; render-only.
      axisTag: function (ax) {
        if (!ax || !ax.kind) return '';
        var src = ax.source === 'spec' ? 'from spec'
                : (ax.source && ax.source.indexOf('rule:') === 0) ? 'from rules' : ax.source;
        return src ? ax.kind + ' · ' + src : ax.kind;
      },
      crossOf: function (id) {
        var d = this.dimsFor(id);
        return d && d.cross ? d.cross : null;
      },
      // §2h/D67 covering-array deck (the "which cells to test next" companion to the cross gaps),
      // baked by Report.generate at the criticality-selected strength — rendered read-only.
      get covering() { return this.data.covering || []; },
      deckFor: function (id) {
        return this.covering.find(function (c) { return c.id === id; }) || null;
      },
      // a strength t → its combinatorial name (t=1 marginal, t=2 pairwise, else N-way)
      strengthLabel: function (t) {
        return t === 1 ? 'marginal' : (t === 2 ? 'pairwise' : (t + '-way'));
      },
      // the at-a-glance DIMS-column rollup (computed in Java — Coverage.dimensions): {kind, coveredProportion, gaps}
      dimRollupFor: function (id) {
        var d = this.dimsFor(id);
        return d && d.rollup ? d.rollup : null;
      },
      dimCellTip: function (id) {
        var r = this.dimRollupFor(id);
        if (!r) return '';
        if (r.coveredProportion < 0) return 'dimensions bound but no closed axis observed';
        var what = r.kind === 'cross' ? 'required combinations' : 'input dimensions';
        return what + ': ' + this.pctOf(r.coveredProportion) + '% covered'
          + (r.gaps > 0 ? ' · ' + r.gaps + ' gap' + (r.gaps === 1 ? '' : 's') : ' · complete');
      },
      // a percent (0..100) from a coveredProportion; -1 (open/ungradeable) renders as 0-width
      pctOf: function (p) { return Math.round((p < 0 ? 0 : p) * 100); },
      barClass: function (p) { return p >= 1 ? 'k-ok' : (p > 0 ? 'k-warn' : 'k-no'); },
      // a cross cell {tier:'gold', region:'EU'} → "gold × EU"
      cellText: function (cell) {
        return Object.keys(cell).map(function (k) { return cell[k]; }).join(' × ');
      },

      // labels
      label: function (it) {
        if (it.kind === 'req') return it.name || '';  // id shown in the k-reqid badge alongside
        if (it.method) return (it.path || it.name || it.id);
        return it.name || it.id;
      },
      hitLabel: function (h) {
        if (h.method && h.path) return h.method + ' ' + h.path + (h.status ? ' → ' + h.status : '');
        if (h.service) return h.service + '/' + h.method + (h.status ? ' → ' + h.status : '');
        if (h.key) return h.key;
        return h.kind;
      },
      testName: function (slug) {
        if (!slug) return '';
        var i = String(slug).lastIndexOf('::');
        return i >= 0 ? slug.slice(i + 2) : slug;
      },
      statusClass: function (s) {
        return { COVERED: 'k-ok', SIMULATED: 'k-sim', FAILING: 'k-no', NOTRUN: 'k-warn', NOTCOVERED: 'k-no' }[s] || '';
      },
      statusIcon: function (s) {
        return { COVERED: '✓', SIMULATED: '🧪', FAILING: '✗', NOTRUN: '~', NOTCOVERED: '—' }[s] || '?';
      }
    };
  });
});
