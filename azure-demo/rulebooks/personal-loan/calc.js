// personal-loan — the instant-decision oracle.
// Decline on credit floor / affordability; route borderline to manual review; else auto-approve.
// Price APR by credit-score band, apply an existing-customer loyalty discount, then clamp.
// Editable rate table first; every decision arm is labelled and linked to its acceptance criterion.
const lookup = {
    minCreditScore: 580,
    maxDti: 0.50,
    reviewScoreLow: 580,
    reviewScoreHigh: 669,
    reviewDtiLow: 0.40,
    reviewDtiHigh: 0.50,
    aprBands: [
        { minScore: 720, apr: 0.065 },
        { minScore: 660, apr: 0.099 },
        { minScore: 580, apr: 0.149 }
    ],
    loyaltyDiscount: 0.005,
    aprFloor: 0.05,
    aprCeiling: 0.24
};

const execute = function (calc) {
    const input = calc.input;

    // estimated new monthly payment — simple straight-line
    const monthlyPayment = input.loanAmount / input.termMonths;
    // debt-to-income: existing + new monthly debt, annualized, over annual income
    const dti = (input.monthlyDebt + monthlyPayment) * 12 / input.annualIncome;
    calc.log('monthly payment estimate ' + monthlyPayment.toFixed(2) + ', DTI ' + (dti * 100).toFixed(1) + '%');

    // ---- Decline gate ----
    calc.label('Decline gate');
    let declined = false;
    if (input.creditScore < lookup.minCreditScore) {
        calc.req('3/ac1');   // credit score below 580
        declined = true;
        calc.log('declined: credit score ' + input.creditScore + ' below ' + lookup.minCreditScore);
    }
    if (dti > lookup.maxDti) {
        calc.req('3/ac2');   // DTI exceeds 50%
        declined = true;
        calc.log('declined: DTI ' + (dti * 100).toFixed(1) + '% exceeds ' + (lookup.maxDti * 100) + '%');
    }

    let decision;
    let apr = null;

    if (declined) {
        calc.label('Declined outcome');
        decision = 'declined';
        // 6/4.6: a declined application is assigned no APR
        calc.req('6/ac6');
        apr = null;
    } else {
        // ---- price the APR from the credit-score band (every non-declined app) ----
        calc.label('APR band');
        let baseApr = 0;
        if (input.creditScore >= lookup.aprBands[0].minScore) {
            calc.req('6/ac1');   // 720+ -> 6.5%
            baseApr = lookup.aprBands[0].apr;
        } else if (input.creditScore >= lookup.aprBands[1].minScore) {
            calc.req('6/ac2');   // 660-719 -> 9.9%
            baseApr = lookup.aprBands[1].apr;
        } else {
            calc.req('6/ac3');   // 580-659 -> 14.9%
            baseApr = lookup.aprBands[2].apr;
        }
        calc.log('base APR band for score ' + input.creditScore + ': ' + (baseApr * 100).toFixed(1) + '%');

        // loyalty discount for existing customers
        calc.label('Loyalty discount');
        if (input.existingCustomer) {
            calc.req('6/ac4');   // existing customer -0.5pp
            baseApr = baseApr - lookup.loyaltyDiscount;
            calc.log('loyalty discount applied: -' + (lookup.loyaltyDiscount * 100) + 'pp');
        }

        // clamp to [floor, ceiling] — a single guard expression, never below 5% nor above 24%
        calc.label('APR clamp');
        calc.req('6/ac5');
        baseApr = Math.min(lookup.aprCeiling, Math.max(lookup.aprFloor, baseApr));
        apr = Math.round(baseApr * 10000) / 10000;

        // ---- route: manual review vs auto-approve ----
        // Branch on the raw creditScore (so the explorer can attribute the 670 boundary) and the
        // DTI band separately, rather than on one pre-combined boolean.
        calc.levels('creditScore', [669, 670]);   // the score boundary the review band ends on
        const scoreBorderline = input.creditScore <= lookup.reviewScoreHigh;  // already known >= 580 (not declined)
        const dtiBorderline = dti >= lookup.reviewDtiLow;                     // already known <= 0.50 (not declined)
        calc.label('Score in review band');
        if (scoreBorderline) {
            calc.req('4/ac1');   // score 580-669 -> review
            calc.label('Manual review');
            decision = 'manual-review';
        } else {
            calc.label('DTI in review band');
            if (dtiBorderline) {
                calc.req('4/ac2');   // DTI 40-50% -> review
                calc.label('Manual review');
                decision = 'manual-review';
            } else {
                calc.label('Auto-approve');
                calc.req('5/ac1');   // neither declined nor borderline -> auto-approve
                decision = 'auto-approved';
            }
        }
    }

    calc.outcome(decision);

    // ---- always-properties (must hold for ALL inputs) ----
    calc.always('declined applications carry no APR', !(decision === 'declined') || apr === null);
    calc.always('priced APR never below the 5% floor', apr === null || apr >= lookup.aprFloor);
    calc.always('priced APR never above the 24% ceiling', apr === null || apr <= lookup.aprCeiling);
    calc.always('DTI is never negative', dti >= 0);

    calc.output = {
        decision: decision,
        apr: apr,
        dti: Math.round(dti * 10000) / 10000,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100
    };
};
