// The Loan Desk SUT's decision logic — the INDEPENDENT twin of rulebooks/personal-loan/calc.js.
// A plain function so the page computes the decision client-side, AND a no-browser test can load this
// same file and assert it agrees with Rule.execute('personal-loan', row) per scenario (the green state).
// Drift a knob (the admin panel passes `cfg`) and the SUT diverges from the rules — the UI check goes red.
function loanDecision(input, cfg) {
  cfg = cfg || {};
  var primeApr = cfg.primeApr != null ? cfg.primeApr : 0.065;   // 720+
  var midApr = cfg.midApr != null ? cfg.midApr : 0.099;         // 660-719
  var nearApr = cfg.nearApr != null ? cfg.nearApr : 0.149;      // 580-659
  var loyaltyDiscount = cfg.loyaltyDiscount != null ? cfg.loyaltyDiscount : 0.005;
  var minCreditScore = cfg.minCreditScore != null ? cfg.minCreditScore : 580;
  var maxDti = cfg.maxDti != null ? cfg.maxDti : 0.50;
  var APR_FLOOR = 0.05, APR_CEILING = 0.24, REVIEW_SCORE_HIGH = 669, REVIEW_DTI_LOW = 0.40, PRIME = 720, MID = 660;

  var monthlyPayment = input.loanAmount / input.termMonths;
  var dti = (input.monthlyDebt + monthlyPayment) * 12 / input.annualIncome;

  var decision, apr = null;
  if (input.creditScore < minCreditScore || dti > maxDti) {
    decision = 'declined';
  } else {
    var base = input.creditScore >= PRIME ? primeApr : (input.creditScore >= MID ? midApr : nearApr);
    if (input.existingCustomer) { base = base - loyaltyDiscount; }
    base = Math.min(APR_CEILING, Math.max(APR_FLOOR, base));
    apr = Math.round(base * 10000) / 10000;
    decision = (input.creditScore <= REVIEW_SCORE_HIGH || dti >= REVIEW_DTI_LOW) ? 'manual-review' : 'auto-approved';
  }
  return {
    decision: decision,
    apr: apr,
    dti: Math.round(dti * 10000) / 10000,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100
  };
}

// node/karate-engine export (the browser ignores it — `module` is undefined there)
if (typeof module !== 'undefined') { module.exports = loanDecision; }
// the file's final expression, so `read('sut/loan-calc.js')` / `call` return the function — the Loan
// Decision API mock reuses THIS exact independent twin the browser runs (one engine, two surfaces).
loanDecision;
