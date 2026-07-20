function generate(g) {
    g.int('creditScore', 500, 800, [580, 660, 670, 720]);
    g.int('annualIncome', 40000, 400000, [120000]);
    g.int('loanAmount', 5000, 90000, [40000]);
    g.int('termMonths', 36, 72, [60]);
    g.int('monthlyDebt', 0, 5000, [1500]);
    g.bool('existingCustomer');
}
