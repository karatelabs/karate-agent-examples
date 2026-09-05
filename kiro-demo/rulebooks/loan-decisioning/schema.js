// loan-decisioning — the INPUT shape contract, and the DOMAIN for every bounded axis: the
// ranged markers are enforced at the API boundary and are what every verdict is read over.
// outcome/apr/dti/monthlyPayment are calc.output, not inputs, so they are not axes here.
schema = {
    creditScore: '#int[300,850]',        // requirements.md Requirement 1/2 — outside this is rejected
    annualIncome: '#int[20000,400000]',  // the underwriting band this product decides
    requestedAmount: '#int[5000,90000]',
    termMonths: '#int[12,72]',
    existingMonthlyDebt: '#int[0,5000]',
    isExistingCustomer: '#boolean'
};
