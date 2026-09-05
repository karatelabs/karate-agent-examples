// personal-loan — the INPUT shape contract, and the DOMAIN for every bounded axis: the
// ranged markers are enforced at the API boundary and are what every verdict is read over.
// generator.js pins the boundary levels inside them and may only narrow, never widen.
// decision/apr/dti/monthlyPayment are calc.output, not inputs, so they are not axes here.
schema = {
    creditScore: '#int[500,800]',
    annualIncome: '#int[20000,400000]',
    loanAmount: '#int[5000,90000]',
    termMonths: '#int[12,72]',
    monthlyDebt: '#int[0,5000]',
    existingCustomer: '#boolean'
};
