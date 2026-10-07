

document.addEventListener('alpine:init', function () {
  Alpine.data('coverageReport', function () {
    return {
      data: window.KARATE_COVERAGE_DATA || {},
      q: '',
      sourceFilter: '',
      statusFilter: '',
      expanded: {},

       
       
       
      get sources() { return (this.data.sources || []).filter(function (s) { return (s.namespace || s.type) !== 'rules'; }); },
      get allItems() { return (this.data.items || []).filter(function (i) { return i.kind !== 'rule-scenario' && i.source !== 'rules'; }); },
      get hits() { return this.data.hits || []; },
      get karateSummary() { return this.data.karateSummary || ''; },

       
       
       
       
      get ruleCoverage() { return this.data.ruleCoverage || []; },
       
      rulePct: function (r) { return r && r.total ? Math.round((r.used || 0) * 100 / r.total) : 0; },
      ruleBarClass: function (r) { var p = this.rulePct(r); return p >= 100 ? 'k-ok' : (p > 0 ? 'k-warn' : 'k-no'); },
       
       
      ruleArms: function (r) {
        var rank = { notused: 0, notreached: 1, used: 2 };
        return (r.arms || []).slice().sort(function (a, b) {
          var d = (rank[a.status] === undefined ? 9 : rank[a.status]) - (rank[b.status] === undefined ? 9 : rank[b.status]);
          if (d !== 0) return d;
          if ((a.line || 0) !== (b.line || 0)) return (a.line || 0) - (b.line || 0);
          return (a.outcome === b.outcome) ? 0 : (a.outcome ? -1 : 1);
        });
      },
      armBadge: function (s) { return s === 'used' ? 'CHECKED' : s === 'notused' ? 'NOT CHECKED' : 'UNREACHABLE'; },
      armClass: function (s) { return s === 'used' ? 'k-arm-used' : s === 'notused' ? 'k-arm-notused' : 'k-arm-notreached'; },
       
      ruleUnlabeled: function (r) { return (r.arms || []).filter(function (a) { return !a.label; }).length; },

       
       
       
       
      get readiness() { return this.data.readiness || null; },
       
       
      get hasTraceability() { return !!this.data.hasTraceability; },
       
       
       
      get traceabilityHref() { return this.data.traceabilityHref || '../../traceability/pages/traceability.html'; },
      get readyState() { var r = this.readiness; return r ? (r.state || (r.ready ? 'READY' : 'NOT_READY')) : ''; },
       
      readyWord: function () {
        return { READY: 'Ready to ship', CONDITIONAL: 'Ship with caution', NOT_READY: 'Not ready to ship' }[this.readyState] || '';
      },
      readyClass: function () {
        return { READY: 'k-sc-ready', CONDITIONAL: 'k-sc-conditional', NOT_READY: 'k-sc-block' }[this.readyState] || '';
      },
       
      readyVerdict: function () { return (this.readiness && this.readiness.verdict) || ''; },
       
      get oracleOnlyCount() {
        return ((this.readiness && this.readiness.requirements) || [])
          .filter(function (r) { return (r.oracleOnly || r.refusalOnly || r.modelOnly) && r.coverage === 'COVERED'; }).length;
      },
       
       
      get refusalOnlyCount() {
        return ((this.readiness && this.readiness.requirements) || [])
          .filter(function (r) { return r.refusalOnly && r.coverage === 'COVERED'; }).length;
      },
       
       
      get notassertedCount() {
        return ((this.readiness && this.readiness.requirements) || [])
          .filter(function (r) { return r.notasserted && !r.oracleOnly && !r.refusalOnly && !r.modelOnly && r.coverage === 'COVERED'; }).length;
      },
       
      get assertionStrength() {
        return this.data.assertionStrength
          || (this.readiness && this.readiness.assertionStrength)
          || (this.data.runEvidence && this.data.runEvidence.assertionStrength) || null;
      },
      strengthLine: function () {
        var a = this.assertionStrength;
        return a ? (a.graded || 0) + ' graded · ' + (a.ungraded || 0) + ' ungraded · ' + (a.notasserted || 0) + ' notasserted' : '';
      },
       
      readyStatusCounts: function () {
        var c = { COVERED: 0, FAILING: 0, NOTRUN: 0, NOTCOVERED: 0 };
        ((this.readiness && this.readiness.requirements) || []).forEach(function (r) {
          if (c[r.coverage] !== undefined) c[r.coverage]++;
        });
        return c;
      },

       
       
       
       
       
       
       
      get operationItems() {
        return this.listItems.filter(function (i) { return i.kind !== 'req'; });
      },
      statusSplit: function (items) {
        var c = { COVERED: 0, FAILING: 0, NOTRUN: 0, NOTCOVERED: 0 };
        items.forEach(function (i) { if (c[i.status] !== undefined) c[i.status]++; });
        return c;
      },
       
      sumSource: function (key, num, den) {
        var s = 0, t = 0;
        (this.sources || []).forEach(function (src) {
          var b = src[key];
          if (b) { s += (b[num] || 0); t += (b[den] || 0); }
        });
        return { covered: s, total: t };
      },
       
      get openAxisCount() {
        var n = 0;
        this.dimensions.forEach(function (d) {
          if (!d.axes) return;
          Object.keys(d.axes).forEach(function (k) {
            if (k !== 'response' && d.axes[k] && d.axes[k].closed === false) n++;
          });
        });
        return n;
      },
       
      axisCards: function () {
        var cards = [];
        var mk = function (key, label, ask, help, total, segs) {
          var good = segs.length ? segs[0].n : 0;
          return { key: key, label: label, ask: ask, help: help, total: total,
                   pct: total ? Math.round(good * 100 / total) : 0, segments: segs };
        };
         
         
        var reqRows = (this.readiness && this.readiness.requirements) || null;
        var rc = reqRows
          ? reqRows.reduce(function (a, r) { if (a[r.coverage] !== undefined) a[r.coverage]++; return a; },
              { COVERED: 0, FAILING: 0, NOTRUN: 0, NOTCOVERED: 0 })
          : this.statusSplit(this.listItems.filter(function (i) { return i.kind === 'req'; }));
         
         
         
        var reqOracleOnly = reqRows
          ? this.oracleOnlyCount
          : this.listItems.filter(function (i) { return i.kind === 'req' && (i.oracleOnly || i.refusalOnly || i.modelOnly) && i.status === 'COVERED'; }).length;
        var reqRefusalOnly = reqRows
          ? this.refusalOnlyCount
          : this.listItems.filter(function (i) { return i.kind === 'req' && i.refusalOnly && i.status === 'COVERED'; }).length;
        var reqNotasserted = reqRows
          ? this.notassertedCount
          : this.listItems.filter(function (i) { return i.kind === 'req' && i.notasserted && !i.oracleOnly && !i.refusalOnly && !i.modelOnly && i.status === 'COVERED'; }).length;
        var reqTotal = reqRows ? reqRows.length : this.listItems.filter(function (i) { return i.kind === 'req'; }).length;
        if (reqTotal) {
          cards.push(mk('req', 'Requirements', "requirements we've actually tested", 'model.coverage.axis.req',
            reqTotal, [
              { cls: 'k-seg-ok', n: Math.max(0, rc.COVERED - reqOracleOnly - reqNotasserted), title: 'covered (tested & passed)' },
              { cls: 'k-seg-sim', n: reqOracleOnly, title: 'the rules realize it, but nothing outside the rulebook checked it'
                  + (reqRefusalOnly ? ' — ' + reqRefusalOnly + ' of them only because the shape refuses what it must' : '') },
              { cls: 'k-seg-sim', n: reqNotasserted, title: 'covered by tests that assert nothing — a lock on a value or shape clears it' },
              { cls: 'k-seg-bad', n: rc.FAILING, title: 'a test is failing' },
              { cls: 'k-seg-none', n: rc.NOTRUN + rc.NOTCOVERED, title: 'not tested yet' }
            ]));
        }
         
        var rcov = this.ruleCoverage;
        if (rcov.length) {
          var used = 0, tot = 0, reach = 0;
          rcov.forEach(function (r) { used += (r.used || 0); tot += (r.total || 0); reach += (r.reachable || 0); });
          cards.push(mk('rules', 'Rule branches', "yes/no paths in our rules we've checked", 'model.coverage.axis.rules',
            tot, [
              { cls: 'k-seg-ok', n: used, title: 'checked by a saved scenario' },
              { cls: 'k-seg-none', n: reach - used, title: 'reachable but no scenario checks it — add data' },
              { cls: 'k-seg-bad', n: tot - reach, title: 'never reached — dead branch or unbuildable input' }
            ]));
        }
         
        var ops = this.operationItems;
        if (ops.length) {
          var oc = this.statusSplit(ops);
          cards.push(mk('actions', 'Actions tested', "system actions we've exercised", 'model.coverage.axis.actions',
            ops.length, [
              { cls: 'k-seg-ok', n: oc.COVERED, title: 'exercised & passed' },
              { cls: 'k-seg-bad', n: oc.FAILING, title: 'a test is failing' },
              { cls: 'k-seg-none', n: oc.NOTRUN + oc.NOTCOVERED, title: 'not exercised' }
            ]));
        }
         
        var inp = this.sumSource('inputs', 'covered', 'total');
        var openAx = this.openAxisCount;
        if (inp.total || openAx) {
          cards.push(mk('inputs', 'Field values', 'meaningfully-different input values we tried', 'model.coverage.axis.inputs',
            inp.total, [
              { cls: 'k-seg-ok', n: inp.covered, title: 'value tried' },
              { cls: 'k-seg-none', n: inp.total - inp.covered, title: 'value never tried' }
            ]));
          cards[cards.length - 1].note = openAx ? (openAx + (openAx === 1 ? ' field' : ' fields') + " can't be scored yet") : '';
        }
         
        var cmb = this.sumSource('combos', 'covered', 'required');
        if (cmb.total) {
          cards.push(mk('combos', 'Risky combinations', 'risky value combinations we tried together', 'model.coverage.axis.combos',
            cmb.total, [
              { cls: 'k-seg-ok', n: cmb.covered, title: 'combination tried' },
              { cls: 'k-seg-none', n: cmb.total - cmb.covered, title: 'combination not tried' }
            ]));
        }
         
         
         
        var ep = this.sumSource('errorPaths', 'covered', 'total');
        if (ep.total) {
          cards.push(mk('errors', 'Error paths', 'actions whose failure modes we exercised', 'model.coverage.axis.errors',
            ep.total, [
              { cls: 'k-seg-ok', n: ep.covered, title: 'produced at least one error outcome' },
              { cls: 'k-seg-none', n: ep.total - ep.covered, title: 'happy-path only — no failure mode ever produced' }
            ]));
        }
        return cards;
      },
       
       
       
      errorPathCoverage: function () {
        var self = this;
        var bySource = {};
        (this.data.items || []).forEach(function (it) {
          if (!it.outcome) return;    
          var box = bySource[it.source] || (bySource[it.source] = {
            source: it.source, total: 0, tested: 0, rows: [], worklist: [] });
          box.total++;
          if (it.outcome.tested) box.tested++;
          var never = it.outcome.declaredUntested || [];
           
          var label = (it.method && !self.protoBadge(it) ? it.method + ' ' : '') + self.label(it);
          box.rows.push({ id: it.id, label: label, tested: !!it.outcome.tested,
                          seen: self.observedStatuses(it), errors: it.outcome.errors || [], never: never });
          never.forEach(function (c) { box.worklist.push({ item: label, ask: c }); });
           
          if (!it.outcome.tested && !never.length) box.worklist.push({ item: label, ask: 'any error' });
        });
        return Object.keys(bySource).map(function (k) {
          var box = bySource[k];
           
          box.rows.sort(function (a, b) {
            var ra = a.never.length ? 0 : (a.tested ? 2 : 1);
            var rb = b.never.length ? 0 : (b.tested ? 2 : 1);
            return ra - rb;
          });
          return box;
        });
      },
       
       
      observedStatuses: function (it) {
        var out = [];
        ['statusCodes', 'grpcStatuses', 'kafkaStatuses'].forEach(function (k) {
          if (it[k]) Object.keys(it[k]).forEach(function (s) { out.push(String(s)); });
        });
        return out;
      },
       
      neverProduced: function (it) { return (it.outcome && it.outcome.declaredUntested) || []; },
       
      happyOnly: function (it) { return !!(it.outcome && it.outcome.tested === false); },
      segWidth: function (seg, total) { return total ? (seg.n * 100 / total) + '%' : '0%'; },

       
       
       
       
       
      get itemSourceMap() {
        var m = {};
        (this.data.items || []).forEach(function (i) { m[i.id] = i.source; });
        return m;
      },
       
       
      closingValue: function (field, missed) {
        return (field.examples && field.examples[missed] != null) ? field.examples[missed] : missed;
      },
      inputCoverage: function () {
        var srcOf = this.itemSourceMap, self = this;
        var bySource = {};    
        this.dimensions.forEach(function (d) {
          if (!d.axes) return;
          var src = srcOf[d.id] || String(d.id).split(':')[0];
          var grp = bySource[src] || (bySource[src] = {});
          Object.keys(d.axes).forEach(function (field) {
            if (field === 'response') return;    
            var a = d.axes[field];
            var f = grp[field] || (grp[field] = { field: field, universe: {}, covered: {}, examples: {}, kind: a.kind || null, source: a.source || null, closed: false });
            if (!f.kind && a.kind) f.kind = a.kind;
            if (!f.source && a.source) f.source = a.source;
            if (a.closed) {
              f.closed = true;
              var gap = {}; (a.gaps || []).forEach(function (g) { gap[String(g)] = true; });
              (a.universe || []).forEach(function (u) {
                var k = String(u);
                f.universe[k] = u;
                if (!gap[k]) f.covered[k] = u;
              });
              if (a.examples) Object.keys(a.examples).forEach(function (k) { f.examples[k] = a.examples[k]; });
            }
          });
        });
        var out = [];
        Object.keys(bySource).forEach(function (src) {
          var fields = [], tried = 0, total = 0, openFields = [];
          Object.keys(bySource[src]).forEach(function (name) {
            var f = bySource[src][name];
            if (!f.closed || !Object.keys(f.universe).length) { openFields.push(name); return; }
            var triedVals = [], missedVals = [];
            Object.keys(f.universe).forEach(function (k) {
              if (f.covered[k] !== undefined) triedVals.push(f.universe[k]);
              else missedVals.push({ label: f.universe[k], value: self.closingValue(f, k) });
            });
            tried += triedVals.length; total += Object.keys(f.universe).length;
            fields.push({ field: name, kind: f.kind, source: f.source, tag: self.axisTag(f),
                          tried: triedVals, missed: missedVals });
          });
          if (!fields.length && !openFields.length) return;
          var worklist = [];
          fields.forEach(function (f) { f.missed.forEach(function (m) { worklist.push({ field: f.field, value: m.value }); }); });
          out.push({ source: src, fields: fields, openFields: openFields,
                     tried: tried, total: total, missed: total - tried, worklist: worklist });
        });
        return out;
      },

       
       
       
       
       
      get trackerLinks() { return this.data.links || {}; },
       
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
        var localId = local.split('/')[0];                  
        var url = tmpl.split('{id}').join(encodeURIComponent(localId));
         
         
        if (url.indexOf('{file}') >= 0 || url.indexOf('{anchor}') >= 0) {
          var it = this.reqItemById[localId];
          if (!it || !it.sourceFile) return '';
          var file = String(it.sourceFile).split('/').map(encodeURIComponent).join('/');
          url = url.split('{file}').join(file).split('{anchor}').join(it.anchor || '');
        }
        return url;
      },

       
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

       
       
       
       
       
      get listItems() {
        return this.allItems.filter(function (i) {
          return i.kind !== 'acceptance-criterion' && !i.container;
        });
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

       
       
      toggle: function (id) { this.expanded[id] = !this.expanded[id]; },
      isOpen: function (id) { return !!this.expanded[id]; },

       
      criteria: function (item) {
        var prefix = item.id + '/';
        return this.allItems.filter(function (i) {
          return i.kind === 'acceptance-criterion' && i.id.indexOf(prefix) === 0;
        });
      },
      hitsFor: function (id) {
        return this.hits.filter(function (h) { return h.item === id; });
      },

       
       
      get dimensions() { return this.data.dimensions || []; },
      dimsFor: function (id) {
        return this.dimensions.find(function (d) { return d.id === id; }) || null;
      },
       
      axisList: function (d) {
        if (!d || !d.axes) return [];
        return Object.keys(d.axes).map(function (k) {
          var a = d.axes[k];
          return { name: k, closed: !!a.closed, coveredProportion: a.coveredProportion,
                   seen: a.seen || [], gaps: a.gaps || [], kind: a.kind || null, source: a.source || null };
        });
      },
       
       
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
       
       
      get covering() { return this.data.covering || []; },
      deckFor: function (id) {
        return this.covering.find(function (c) { return c.id === id; }) || null;
      },
       
      strengthLabel: function (t) {
        return t === 1 ? 'marginal' : (t === 2 ? 'pairwise' : (t + '-way'));
      },
       
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
       
      pctOf: function (p) { return Math.round((p < 0 ? 0 : p) * 100); },
      barClass: function (p) { return p >= 1 ? 'k-ok' : (p > 0 ? 'k-warn' : 'k-no'); },
       
       
      cellText: function (cell) {
        return Object.keys(cell).map(function (k) {
          var v = cell[k];
          if (v === true) return k;
          if (v === false) return 'no ' + k;
          return v;
        }).join(' · ');
      },

       
       
      srcType: function (it) {
        var ns = it.source, list = this.sources || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i].namespace === ns) return list[i].type;
        }
        return ns;
      },
       
       
       
      protoBadge: function (it) {
        var t = this.srcType(it);
        if (t === 'grpc') return 'GRPC';
        if (t === 'kafka') return 'KAFKA';
        if (t === 'mcp') return 'MCP';
        return '';
      },
       
      label: function (it) {
        if (it.kind === 'req') return it.name || '';   
        if (it.method) return (it.path || it.name || it.id);
         
         
        if (it.rulebook && it.name) {
          var pre = it.rulebook + ': ';
          return it.name.indexOf(pre) === 0 ? it.name.slice(pre.length) : it.name;
        }
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
        var n = (this.testsById[slug] || {}).name;
        if (n) return n;
        var i = String(slug).lastIndexOf(':');
        return i >= 0 ? String(slug).slice(i + 1) : String(slug);
      },
      get testsById() {
        var m = {};
        (this.data.tests || []).forEach(function (t) { m[t.id] = t; });
        return m;
      },
       
       
      testsOf: function (item) {
        var self = this, seen = {}, out = [];
        var ids = [item.id].concat(this.criteria(item).map(function (c) { return c.id; }));
        ids.forEach(function (id) {
          self.hitsFor(id).forEach(function (h) { if (!seen[h.test]) { seen[h.test] = true; out.push(h.test); } });
        });
        return out;
      },
      testStatus: function (slug) { return (this.testsById[slug] || {}).status || ''; },
       
      outcomeStatus: function (s) { return { PASSED: 'COVERED', FAILED: 'FAILING', SKIPPED: 'NOTRUN' }[s] || ''; },
       
       
      histOpen: {},
      histToggle: function (id) { this.histOpen[id] = !this.histOpen[id]; },
      histIsOpen: function (id) { return !!this.histOpen[id]; },
      historyOf: function (slug) {
        return (this.data.executions || []).filter(function (e) { return e.test === slug; })
          .sort(function (a, b) { return (b.startedAt || 0) - (a.startedAt || 0) || String(b.id).localeCompare(String(a.id)); });
      },
       
      execTime: function (e) {
        if (!e.startedAt) return '';
        var d = new Date(e.startedAt), p = function (n) { return (n < 10 ? '0' : '') + n; }, zone = '';
        try {
          zone = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(d)
            .filter(function (x) { return x.type === 'timeZoneName'; }).map(function (x) { return x.value; })[0] || '';
        } catch (err) { zone = ''; }
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':'
          + p(d.getMinutes()) + ':' + p(d.getSeconds()) + (zone ? ' ' + zone : '');
      },
      execStatus: function (e) { return { passed: 'PASSED', failed: 'FAILED' }[e.outcome] || 'SKIPPED'; },
      execGrade: function (e) {
        var p = e.assertedProportion;
        return (p === undefined || p === null || p < 0) ? '' : 'asserted ' + p;
      },
      execProv: function (e) {
        var p = e.provenance || {};
        return ['build', 'env', 'origin'].filter(function (k) { return p[k]; }).map(function (k) { return k + ' ' + p[k]; });
      },
       
      get runsBase() {
        if (this.data.runsBase) return this.data.runsBase;
        return location.protocol.indexOf('http') === 0 ? '/api/artifacts/runs/' : '';
      },
      execReportHref: function (e) {
        var r = e.artifacts && e.artifacts.report;
        return r && this.runsBase ? this.runsBase + r : '';
      },
      hasFinding: function (e, kind) { return (e.findings || []).some(function (f) { return f.kind === kind; }); },
      execWhy: function (e) {
        if (e.selected) return 'current';
        if (e.retired) return 'retired';
        if (e.lifecycle === 'running') return this.hasFinding(e, 'unfinalizedRun') ? 'unfinalized' : 'pending';
        if (e.supersededBy) return 'superseded';
        return 'not selected';
      },
      execWhyClass: function (e) { return { current: 'k-ok', pending: 'k-warn', unfinalized: 'k-warn' }[this.execWhy(e)] || 'k-tag'; },
      get provisional() { return !!this.data.provisional; },
       
       
      assertedOf: function (slug) {
        var p = (this.testsById[slug] || {}).assertedProportion;
        return (p === undefined || p === null || p < 0) ? '' : 'asserted ' + p;
      },
      statusClass: function (s) {
        return { COVERED: 'k-ok', FAILING: 'k-no', NOTRUN: 'k-warn', NOTCOVERED: 'k-no' }[s] || '';
      },
      statusIcon: function (s) {
        return { COVERED: '✓', FAILING: '✗', NOTRUN: '~', NOTCOVERED: '—' }[s] || '?';
      }
    };
  });
});
