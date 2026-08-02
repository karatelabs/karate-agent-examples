// The Loan Decisioning service — the implementation the spec's tasks describe, as a plain function.
// `mock/decision-mock.feature` serves it at POST /decisions. It is deliberately INDEPENDENT of the
// rulebook: the rules are the oracle, this is the thing under test, and the API check compares the two.
function fn(application) {
  var lookup = {
    minCreditScore: 580,
    maxDti: 0.50,
    reviewScoreHigh: 669,
    aprBands: [
      { minScore: 720, apr: 0.065 },
      { minScore: 660, apr: 0.099 },
      { minScore: 580, apr: 0.149 }
    ],
    existingCustomerDiscount: 0.005,
    aprFloor: 0.05,
    aprCeiling: 0.24
  };
  var required = ['creditScore', 'annualIncome', 'requestedAmount', 'termMonths',
    'existingMonthlyDebt', 'isExistingCustomer'];
  for (var i = 0; i < required.length; i++) {
    var name = required[i];
    if (application[name] === undefined || application[name] === null) {
      return { error: { field: name, message: 'required field is missing' } };
    }
  }
  if (application.creditScore < 300 || application.creditScore > 850) {
    return { error: { field: 'creditScore', message: 'must be between 300 and 850' } };
  }

  var monthlyPayment = application.requestedAmount / application.termMonths;
  var dti = (application.existingMonthlyDebt + monthlyPayment) * 12 / application.annualIncome;

  var declined = application.creditScore < lookup.minCreditScore || dti > lookup.maxDti;
  if (declined) {
    return {
      outcome: 'DECLINED',
      apr: null,
      dti: Math.round(dti * 10000) / 10000,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100
    };
  }

  var apr;
  if (application.creditScore >= lookup.aprBands[0].minScore) {
    apr = lookup.aprBands[0].apr;
  } else if (application.creditScore >= lookup.aprBands[1].minScore) {
    apr = lookup.aprBands[1].apr;
  } else {
    apr = lookup.aprBands[2].apr;
  }
  if (application.isExistingCustomer) {
    apr = apr - lookup.existingCustomerDiscount;
  }
  apr = Math.min(lookup.aprCeiling, Math.max(lookup.aprFloor, apr));

  return {
    outcome: application.creditScore <= lookup.reviewScoreHigh ? 'MANUAL_REVIEW' : 'APPROVED',
    apr: Math.round(apr * 10000) / 10000,
    dti: Math.round(dti * 10000) / 10000,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100
  };
}
