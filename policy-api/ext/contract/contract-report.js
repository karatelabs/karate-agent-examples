/*
 * karate-max paired-run report — the Alpine.js component behind ext/contract/pages/contract.html.
 * Reads window.KARATE_PAIR, which is VERBATIM what Contract.read returned (inlined as a <script> data
 * tag, so the page works off file:// and off a static site).
 *
 * The one rule this file obeys, and the reason it is thin: IT DERIVES NO CLAIM (D227f). Freshness, the
 * standing rung, the two halves of the proportion and every count come pre-computed from the verb that
 * owns them — a second implementation of what a pair means would eventually disagree with the first, and
 * the disagreement would surface as a claim nobody can attest. What is here is presentation only:
 * selecting, escaping, and the percentage rounding (floored, exactly as PairReport.pct does it, so the
 * page and the markdown never print two different numbers for one value).
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('contractReport', function () {
    return {
      pair: window.KARATE_PAIR || {},
      expanded: {},
      filter: '',
      // the six outcome classes, in the order Divergence.CLASSES declares them (the vocabulary is the
      // engine's — this page never invents a seventh, and never quietly drops one that came back zero)
      classes: ['agreed', 'staleMock', 'mockBug', 'unassertedDivergence', 'agreedFailure', 'notMeasured'],

      get scope() { return this.pair.scope || {}; },
      get claim() { return this.pair.claim || {}; },
      get proportion() { return this.claim.measuredProportion || {}; },
      get coverage() { return this.claim.claimCoverage || {}; },
      get measured() { return this.claim.measured === true; },
      get specMismatch() { return this.claim.specMismatch || {}; },
      get freshness() { return this.pair.freshness || {}; },
      get refresh() { return this.pair.refresh || {}; },
      get warnings() { return this.pair.warnings || {}; },
      get ignored() { return this.pair.ignored || {}; },
      get excluded() { return this.pair.excluded || {}; },
      get coverageGraph() { return this.pair.coverageGraph || {}; },
      get outcomes() { return this.pair.outcomes || {}; },
      get notMeasured() { return this.pair.notMeasured || []; },
      get karateSummary() { return this.pair.karateSummary || ''; },
      get rehearsal() { return !!this.pair.rehearsal; },
      get rehearsalNote() {
        var r = this.pair.rehearsal;
        return typeof r === 'string' ? r : (r && r.note)
          || 'the provider is itself a karate mock — two instances of one mock agree by construction, so '
          + 'this rehearses the mechanism and is not evidence about a real provider';
      },

      // the LADDER, as the payload holds it. The page is written from the ARTIFACT (Contract.report
      // renders the full reading, not the summary), so every operation carries the bars it was asked.
      // THE RUNG THIS PAGE SHOWS IS THE STANDING ONE (`pair.rung`) — derived at read time, and WITHDRAWN
      // on a decayed pair with the prose that described it as in force stripped off. `claim.rungs.aggregate`
      // is the MINT-TIME rung and is only a fallback for a payload carrying no standing projection at all;
      // reaching for it on a decayed pair would put the withdrawn claim back in the one slot a reader
      // quotes, which is the defect the verb was fixed for and the renderer is the obvious place to
      // re-introduce it.
      get standing() { return this.pair.rung || this.aggregate; },
      get withdrawn() { return !!(this.pair.rung && this.pair.rung.withdrawnBy); },
      get rungs() { return (this.claim.rungs) || {}; },
      get aggregate() { return this.rungs.aggregate || {}; },
      get items() { return Array.isArray(this.rungs.items) ? this.rungs.items : []; },
      rungName: function (n) {
        return ['', 'shape-conformant', 'verified-against-mock', 'verified-against-provider',
          'proven-substitutable'][n] || '';
      },
      // …and a rung of null is NOT MEASURED, which takes no failure tint: "no verdict" is not "bad", the
      // same rule the outcome tiles obey.
      rungClass: function (rung) {
        if (rung === null || rung === undefined) return 'k-tagpill';
        return rung >= 4 ? 'k-ok' : rung >= 3 ? 'k-link' : rung >= 2 ? 'k-warn' : 'k-no';
      },
      toggle: function (id) { this.expanded[id] = !this.expanded[id]; },

      get freshClass() {
        return { fresh: 'k-fresh-ok', stale: 'k-fresh-no', expired: 'k-fresh-no',
          unbindable: 'k-fresh-no', undatable: 'k-fresh-no' }[this.freshness.status] || 'k-fresh-warn';
      },

      // the divergence set, with the compared values on every difference (the artifact's own rows).
      get divergences() { return this.pair.divergences || []; },
      get shown() {
        var f = this.filter;
        return this.divergences.filter(function (d) { return !f || d.outcome === f; });
      },

      // a divergence row's PILL — every class gets a colour, including the neutral one
      outcomeClass: function (c) {
        return { agreed: 'k-ok', agreedFailure: 'k-warn', notMeasured: 'k-tagpill',
          staleMock: 'k-no', mockBug: 'k-no', unassertedDivergence: 'k-warn' }[c] || 'k-tagpill';
      },
      // a COUNT tile's tint — deliberately not the pill map: `notMeasured` takes no tint at all, because a
      // filled tile reads as a selected one, and this strip is also the filter
      outcomeTile: function (c) {
        return { agreed: 'k-ok', agreedFailure: 'k-warn',
          staleMock: 'k-no', mockBug: 'k-no', unassertedDivergence: 'k-warn' }[c] || '';
      },
      // which classes are actually IN `divergences` — the only ones a filter over it can select. The other
      // three are counted from the same source but live elsewhere, so their tiles do not pretend to filter.
      filterable: function (c) {
        return c === 'staleMock' || c === 'mockBug' || c === 'unassertedDivergence';
      },
      outcomeHelp: function (c) {
        return {
          agreed: 'identical on both legs, at the verdict layer AND the response layer',
          staleMock: 'the mock passed and the provider failed — the mock is behind',
          mockBug: 'the provider passed and the mock failed',
          unassertedDivergence: 'both legs passed and the RESPONSES differ — a finding about your SUITE, '
            + 'whose assertions are too loose to see it',
          agreedFailure: 'both legs red — agreement about behaviour, not a fidelity finding',
          notMeasured: 'no verdict about behaviour was produced: an environment failure, a skipped leg, a '
            + 'failed precondition probe, a read over ambient state, a divergence that did not reproduce'
        }[c] || '';
      },

      /**
       * A proportion as a percentage — ROUNDED DOWN except at a true 1.0, the same arithmetic
       * PairReport.pct does. Ordinary rounding would print "100%" for 199 divergence-free operations out
       * of 200, which is the one number this page may not overstate.
       */
      pct: function (value) {
        if (typeof value !== 'number') return 'not measured';
        return (value >= 1 ? 100 : Math.min(99, Math.floor(value * 100))) + '%';
      },

      /** A compared value, escaped — never injected, and an absent one says so rather than reading blank. */
      cell: function (value) {
        if (value === null || value === undefined) return '<span class="k-muted">absent</span>';
        var s = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<code>' + s + '</code>';
      }
    };
  });
});
