

document.addEventListener('alpine:init', function () {
  Alpine.data('traceabilityReport', function () {
    return {
      data: window.KARATE_TRACE || {},
      q: '',
      critFilter: '',
      statusFilter: '',
      provFilter: '',
      expanded: {},
      view: 'matrix',            
      treeCollapsed: {},
      sortKey: '',               
      sortDir: 1,
      glossaryOpen: false,
      riskOrder: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
      crits: ['high', 'medium', 'low'],
      statuses: ['COVERED', 'FAILING', 'NOTRUN', 'NOTCOVERED'],
      provOrder: ['exercised', 'partexercised', 'incidental', 'notexercised'],

      get graph() { return this.data.graph || {}; },
      get readiness() { return this.data.readiness || {}; },
      get reqs() { return this.data.requirements || []; },
      get ready() { return !!this.readiness.ready; },
       
      get state() { return this.readiness.state || (this.ready ? 'READY' : 'NOT_READY'); },
      verdictWord: function () { return { READY: 'READY', CONDITIONAL: 'CONDITIONAL', NOT_READY: 'NOT READY' }[this.state] || 'NOT READY'; },
      scorecardClass: function () { return { READY: 'k-sc-ready', CONDITIONAL: 'k-sc-conditional', NOT_READY: 'k-sc-block' }[this.state] || 'k-sc-block'; },
      get verdict() { return this.readiness.verdict || ''; },
      get blockers() { return this.readiness.blockers || []; },
      get total() { return this.reqs.length; },
      get sources() { return this.graph.sources || []; },
      get repoUrl() { return this.data.repoUrl || ''; },
      get karateSummary() { return this.data.karateSummary || ''; },
       
       
      get coverageHref() { return this.data.coverageHref || '../../coverage/pages/coverage.html'; },

       
       
      md: function (s) {
        if (!s) return '';
        var esc = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return esc
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
      },

       
      get riskById() {
        var m = {};
        (this.readiness.requirements || []).forEach(function (r) { m[r.reqId] = r.risk; });
        return m;
      },
      get rows() {
        var self = this, q = this.q.trim().toLowerCase(), cf = this.critFilter, sf = this.statusFilter, pf = this.provFilter, risk = this.riskById;
        var out = this.reqs.filter(function (r) {
          if (cf && (r.criticality || 'medium') !== cf) return false;
           
           
          if (sf && r.status !== sf && self.heatStatus(r) !== sf) return false;
          if (pf && self.prov(r) !== pf) return false;
          if (q) {
            var hay = (r.reqId + ' ' + (r.title || r.name || '') + ' ' + (r.body || '')).toLowerCase();
            if (hay.indexOf(q) < 0) return false;
          }
          return true;
        }).map(function (r) { r.risk = risk[r.reqId] || self.riskOf(r); return r; });
        if (this.sortKey) {
          var k = this.sortKey, d = this.sortDir;
          out = out.slice().sort(function (a, b) {
            var va = self.sortVal(a, k), vb = self.sortVal(b, k);
            return (va < vb ? -1 : va > vb ? 1 : 0) * d;
          });
        }
        return out;
      },

       
      sortBy: function (k) {
        if (this.sortKey === k) {
          if (this.sortDir === 1) { this.sortDir = -1; } else { this.sortKey = ''; this.sortDir = 1; }    
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
          case 'tests': return this.testsOf(r).length;
          case 'accept': var n = this.acceptOf(r).length; return n ? this.acceptCovered(r) / n : -1;
          default: return 0;
        }
      },
      sortInd: function (k) { return this.sortKey === k ? (this.sortDir === 1 ? '↑' : '↓') : ''; },

       
       
       
       
       
      srcUnit: function (s) { return { req: 'requirements', openapi: 'endpoints', grpc: 'methods', rules: 'rules' }[s.type] || 'items'; },
       
       
      srcHollow: function (s) {
        var self = this;
        return s.type !== 'req' ? 0
          : this.reqs.filter(function (r) { return r.status === 'COVERED' && self.memberRisk(r) !== 'NONE'; }).length;
      },
      srcPctHollow: function (s) { var t = s.total || 0; return t ? Math.round(this.srcHollow(s) * 100 / t) : 0; },
      srcPctGenuine: function (s) { return Math.max(0, this.pct(s) - this.srcPctHollow(s)); },

       
      pct: function (s) { return Math.round((s && s.percentage) || 0); },
       
       
       
      riskFor: function (c, s, hollow) {
        if (s === 'COVERED' && !hollow) return 'NONE';
        var failing = s === 'FAILING';
        if (c === 'high') return 'HIGH';
        if (c === 'low') return failing ? 'MEDIUM' : 'LOW';
        return failing ? 'HIGH' : 'MEDIUM';
      },
       
      riskOf: function (r) { return this.riskFor(r.criticality || 'medium', r.status, r.oracleOnly || r.refusalOnly || r.modelOnly || r.notasserted); },
       
      memberRisk: function (r) { return this.riskById[r.reqId] || this.riskOf(r); },
       
      hollow: function (r) { return r.status === 'COVERED' && this.memberRisk(r) !== 'NONE'; },
       
       
       
      heatStatus: function (r) { return this.hollow(r) ? 'NOTCOVERED' : r.status; },
      heatMembers: function (cr, st) {
        var self = this;
        return this.reqs.filter(function (r) { return (r.criticality || 'medium') === cr && self.heatStatus(r) === st; });
      },
      heatCount: function (cr, st) { return this.heatMembers(cr, st).length; },
      heatHollow: function (cr, st) {
        var self = this;
        return this.heatMembers(cr, st).filter(function (r) { return self.hollow(r); }).length;
      },
      heatClass: function (cr, st) {
        var n = this.heatCount(cr, st);
        return this.riskClass(this.riskFor(cr, st)) + (n ? '' : ' k-cell-empty');
      },
      heatTitle: function (cr, st) {
        var t = cr + ' × ' + st + ' → ' + this.riskFor(cr, st) + ' risk';
        var h = this.heatHollow(cr, st);
        return h ? t + ' — includes ' + h + ' covered but unchecked (oracle-only, refusal-only or notasserted), graded as not covered (see Blockers)' : t;
      },
      setFilter: function (cr, st) {
        this.critFilter = (this.critFilter === cr && this.statusFilter === st) ? '' : cr;
        this.statusFilter = (this.statusFilter === st && this.critFilter === '') ? '' : st;
      },
      provCount: function (p) {
        var self = this;
        return this.reqs.filter(function (r) { return self.prov(r) === p; }).length;
      },
       
       
       
      get trustGaps() {
        var self = this;
        return this.reqs.filter(function (r) {
          return r.status === 'COVERED' && (self.prov(r) === 'incidental' || r.oracleOnly || r.refusalOnly || r.modelOnly || r.notasserted);
        });
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

       
      acceptOf: function (it) {
        var prefix = it.id + '/';
        return (this.graph.items || []).filter(function (i) {
          return i.kind === 'acceptance-criterion' && String(i.id).indexOf(prefix) === 0;
        });
      },
      acceptCovered: function (it) {
        return this.acceptOf(it).filter(function (c) { return c.status === 'COVERED'; }).length;
      },

       
       
      attestedHits: function (itemId) {
        return (this.graph.hits || []).filter(function (h) { return h.attested && h.item === itemId; });
      },
       
      attestedOnly: function (itemId) {
        var hits = (this.graph.hits || []).filter(function (h) { return h.item === itemId; });
        return hits.length > 0 && hits.every(function (h) { return h.attested; });
      },
       
      evidenceOf: function (itemId) {
        return this.attestedHits(itemId)
          .filter(function (h) { return h.evidence; })
          .map(function (h) { var e = Object.assign({}, h.evidence); e.test = h.test; return e; });
      },
       
       
       
      get runsBase() {
        if (this.data.runsBase) return this.data.runsBase;
        return location.protocol.indexOf('http') === 0 ? '/api/artifacts/runs/' : '';
      },
      shotHref: function (e) { return e.shot && this.runsBase ? this.runsBase + e.shot : ''; },
      evTime: function (e) {
        return e.t ? new Date(e.t).toISOString().replace('T', ' ').slice(0, 19) : '';
      },

       
      testNode: function (slug) {
        return (this.graph.tests || []).find(function (t) { return t.id === slug; }) || {};
      },
      testStatus: function (slug) { return this.testNode(slug).status || ''; },
       
       
      assertedOf: function (slug) {
        var p = this.testNode(slug).assertedProportion;
        return (p === undefined || p === null || p < 0) ? '' : 'asserted ' + p;
      },
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
       
       
       
       
      testHref: function (slug) {
        var t = this.testNode(slug);
        if (this.repoUrl && t.feature) {
          return this.repoUrl + String(t.feature).replace(/^\/+/, '') + (t.line ? '#L' + t.line : '');
        }
        return t.featureHtml || '';
      },

       
       
      histOpen: {},
      histToggle: function (id) { this.histOpen[id] = !this.histOpen[id]; },
      histIsOpen: function (id) { return !!this.histOpen[id]; },
      historyOf: function (slug) {
        return (this.graph.executions || []).filter(function (e) { return e.test === slug; })
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
       
      testsOf: function (r) { return r.testIds || r.tests || []; },
      execStatus: function (e) { return { passed: 'PASSED', failed: 'FAILED' }[e.outcome] || 'SKIPPED'; },
      execGrade: function (e) {
        var p = e.assertedProportion;
        return (p === undefined || p === null || p < 0) ? '' : 'asserted ' + p;
      },
      execProv: function (e) {
        var p = e.provenance || {};
        return ['build', 'env', 'origin'].filter(function (k) { return p[k]; }).map(function (k) { return k + ' ' + p[k]; });
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

       
       
       
       
      get trackerLinks() { return this.data.links || {}; },
       
      get reqItemById() {
        var m = {};
        (this.graph.items || []).forEach(function (i) {
          if (i.kind === 'req') m[String(i.id).replace(/^req:/, '')] = i;
        });
        return m;
      },
      reqHref: function (reqId) {
        if (!reqId) return '';
        var s = String(reqId);
        var colon = s.indexOf(':');
         
         
        var authority = colon < 0 ? 'req' : s.substring(0, colon);
        var tmpl = this.trackerLinks[authority];
        if (!tmpl) return '';
        var local = colon < 0 ? s : s.substring(colon + 1);
        var id = local.split('/')[0];                       
        var url = tmpl.split('{id}').join(encodeURIComponent(id));
         
         
         
        if (url.indexOf('{file}') >= 0 || url.indexOf('{anchor}') >= 0) {
          var it = this.reqItemById[id];
          if (!it || !it.sourceFile) return '';
          var file = String(it.sourceFile).split('/').map(encodeURIComponent).join('/');
          url = url.split('{file}').join(file).split('{anchor}').join(it.anchor || '');
        }
        return url;
      },

       
      prov: function (it) {
        if (it.provenance === 'incidental') return 'incidental';
        return it.exercisedLevel || 'notexercised';
      },

       
       
      exportCsv: function () {
        var self = this;
        var cols = ['Requirement', 'Title', 'Type', 'Status', 'Criticality', 'Risk', 'Provenance', 'Posture', 'Tests', 'Acceptance'];
        var lines = [cols.map(this.csvCell).join(',')];
        this.rows.forEach(function (r) {
          lines.push([
            r.reqId, r.title || r.name || '', r.type || '', r.status || '',
            r.criticality || 'medium', r.risk || '', self.prov(r), r.posture || '',
            self.testsOf(r).length, self.acceptOf(r).length ? (self.acceptCovered(r) + '/' + self.acceptOf(r).length) : ''
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

       
       
       
       
      get gridTests() {
        var self = this, seen = {}, out = [];
        this.rows.forEach(function (r) {
          self.testsOf(r).forEach(function (t) { if (!seen[t]) { seen[t] = true; out.push(t); } });
        });
        return out;
      },
      covers: function (r, slug) { return this.testsOf(r).indexOf(slug) >= 0; },

       
       
      get gapUncovered() { return this.reqs.filter(function (r) { return r.status === 'NOTCOVERED'; }); },
       
      get gapCriteria() {
        return (this.graph.items || []).filter(function (i) {
          return i.kind === 'acceptance-criterion' && i.status !== 'COVERED';
        });
      },
       
       
       
      get gapClaimed() {
        return (this.graph.items || []).filter(function (i) {
          return i.kind === 'acceptance-criterion' && i.claimed && i.status !== 'COVERED';
        });
      },
       
      get gapDrift() {
        var self = this;
        return this.reqs.filter(function (r) { return self.testsOf(r).length > 0 && self.prov(r) === 'notexercised'; });
      },
       
       
      get orphanTests() {
        var hit = {};
        (this.graph.hits || []).forEach(function (h) { hit[h.test] = true; });
        return (this.graph.tests || []).filter(function (t) { return !hit[t.id]; });
      },
      get gapCount() { return this.gapUncovered.length + this.gapCriteria.length + this.gapDrift.length + this.orphanTests.length; },
       
      critParent: function (c) {
        var s = String(c.id).replace(/^req:/, '');
        var i = s.indexOf('/');
        return i > 0 ? s.slice(0, i) : s;
      },

       
       
       
      statusClass: function (s) { return { COVERED: 'k-ok', FAILING: 'k-no', NOTRUN: 'k-warn', NOTCOVERED: 'k-no', PASSED: 'k-ok', FAILED: 'k-no', SKIPPED: 'k-warn' }[s] || ''; },
      statusIcon: function (s) { return { COVERED: '✓', FAILING: '✗', NOTRUN: '~', NOTCOVERED: '—', PASSED: '✓', FAILED: '✗', SKIPPED: '~' }[s] || '?'; },
      critClass: function (c) { return { high: 'k-crit-high', medium: 'k-crit-med', low: 'k-crit-low' }[c || 'medium'] || 'k-crit-med'; },
      riskClass: function (r) { return { HIGH: 'k-no', MEDIUM: 'k-warn', LOW: 'k-tag', NONE: 'k-ok' }[r] || 'k-tag'; },
      provClass: function (p) { return { exercised: 'k-ok', partexercised: 'k-warn', incidental: 'k-warn', notexercised: 'k-tag' }[p] || 'k-tag'; },

       
      openGlossary: function (key) {
        this.glossaryOpen = true;
        var self = this;
        this.$nextTick(function () {
          var el = document.getElementById('gloss-' + key);
          if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('k-gloss-hi'); setTimeout(function () { el.classList.remove('k-gloss-hi'); }, 1400); }
        });
      },
       
      def: function (group, term) {
        var g = (this.glossary.find(function (x) { return x.key === group; }) || {}).terms || [];
        var t = g.find(function (x) { return x.t === String(term).toLowerCase() || x.t === term; });
        return t ? t.t + ' — ' + t.d : '';
      },

      glossary: [
        {
          key: 'status', title: 'Coverage status', intro: 'The derived state of a requirement, from whether its tests ran and passed (MODEL §2c).',
          terms: [
            { t: 'COVERED', cls: 'k-ok', d: 'A passing test covers it (and, where acceptance criteria exist, every criterion is covered).' },
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
            { t: 'notexercised', cls: 'k-tag', d: 'No real eval evidence — claimed but never run, or not covered at all.' },
            { t: 'rules only', cls: 'k-sim', d: 'Covered, but every piece of evidence is the rulebook\'s own — a calc.req hit or a Rule.cover projection. The rules realize it; nothing outside them checked it. Add a @req=-tagged test, or stamp the comparison with Rule.execute(…).verify(ok).' },
            { t: 'refusal only', cls: 'k-sim', d: 'Narrower still: every hit is a reject row the rulebook\'s shape refused. That proves those rows are refused, not that the behaviour the criterion describes works. Add a scenario whose calc.req reaches it, or a test.' },
            { t: 'notasserted', cls: 'k-sim', d: 'Covered, but every graded passing test asserts nothing — the green certifies traffic, not checking. A match that locks a value or a shape clears it. Graded down on readiness like the other hollow greens.' }
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
