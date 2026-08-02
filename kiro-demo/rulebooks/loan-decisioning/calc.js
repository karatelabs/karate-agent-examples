// loan-decisioning — the decision oracle behind POST /decisions.
//
// This is the implementation the spec's tasks describe: decline on the credit floor or the affordability
// limit, route the borderline band to a loan officer, approve the rest, and price every priced outcome from
// the published bands. Each decision arm calls `calc.req(...)` to name the acceptance criterion it realizes,
// so running the rules lights those criteria in the traceability matrix.
//
// The rate table is data on purpose — it is the thing a business reader changes.
const lookup = {
    minCreditScore: 580,
    maxDti: 0.50,
    reviewScoreLow: 580,
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

const execute = function (calc) {
    const input = calc.input;

    calc.log('# Affordability');
    const monthlyPayment = input.requestedAmount / input.termMonths;
    const dti = (input.existingMonthlyDebt + monthlyPayment) * 12 / input.annualIncome;
    calc.log('monthly payment ' + monthlyPayment.toFixed(2) + ', DTI ' + (dti * 100).toFixed(1) + '%');

    // ---- decline gate ----
    calc.log('# Decline gate');
    calc.label('Decline gate');
    let declined = false;
    if (input.creditScore < lookup.minCreditScore) {
        calc.req('loan-decisioning.2/1');            // credit score below the floor
        declined = true;
        calc.log('declined: credit score ' + input.creditScore + ' below ' + lookup.minCreditScore);
    }
    if (dti > lookup.maxDti) {
        calc.req('loan-decisioning.2/2');            // debt-to-income above the limit
        declined = true;
        calc.log('declined: DTI ' + (dti * 100).toFixed(1) + '% over ' + (lookup.maxDti * 100) + '%');
    }

    calc.log('# Outcome & pricing');
    let outcome;
    let apr = null;

    if (declined) {
        calc.label('Declined');
        outcome = 'DECLINED';
        apr = null;                                   // a declined application is never priced
    } else {
        // ---- pricing ----
        calc.label('APR band');
        let baseApr;
        if (input.creditScore >= lookup.aprBands[0].minScore) {
            baseApr = lookup.aprBands[0].apr;
        } else if (input.creditScore >= lookup.aprBands[1].minScore) {
            baseApr = lookup.aprBands[1].apr;
        } else {
            baseApr = lookup.aprBands[2].apr;
        }
        calc.req('loan-decisioning.4/1');            // base APR from the applicant's band
        calc.log('base APR for score ' + input.creditScore + ': ' + (baseApr * 100).toFixed(1) + '%');

        calc.label('Existing-customer discount');
        if (input.isExistingCustomer) {
            calc.req('loan-decisioning.4/2');        // existing customer: -0.5pp
            baseApr = baseApr - lookup.existingCustomerDiscount;
            calc.log('existing-customer discount applied: -'
                + (lookup.existingCustomerDiscount * 100) + 'pp');
        }

        calc.label('APR clamp');
        calc.req('loan-decisioning.4/3');            // clamp to the published floor and ceiling
        baseApr = Math.min(lookup.aprCeiling, Math.max(lookup.aprFloor, baseApr));
        apr = Math.round(baseApr * 10000) / 10000;

        // ---- routing ----
        calc.levels('creditScore', [669, 670]);      // the boundary the review band ends on
        calc.label('Borderline band');
        if (input.creditScore <= lookup.reviewScoreHigh) {
            calc.req('loan-decisioning.3/1');        // 580-669 goes to a loan officer
            calc.label('Manual review');
            outcome = 'MANUAL_REVIEW';
        } else {
            calc.label('Approved');
            calc.req('loan-decisioning.3/2');        // neither declined nor borderline
            outcome = 'APPROVED';
        }
    }

    calc.log('# Result');
    calc.outcome(outcome);

    // properties that must hold for EVERY application, not just the rows below
    calc.always('a declined application carries no APR', outcome !== 'DECLINED' || apr === null);
    calc.always('a priced APR is never below the floor', apr === null || apr >= lookup.aprFloor);
    calc.always('a priced APR is never above the ceiling', apr === null || apr <= lookup.aprCeiling);
    calc.always('the debt-to-income ratio is never negative', dti >= 0);

    calc.output = {
        outcome: outcome,
        apr: apr,
        dti: Math.round(dti * 10000) / 10000,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100
    };
};
