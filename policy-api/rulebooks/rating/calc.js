// rating — the auto-insurance rate book. This ONE rulebook is the brain of the whole kit:
//   • it prices the /quotes REST mock (Http.mock rules) AND mirrors the gRPC RatingService, so the
//     mock and the engine agree by construction;
//   • it is the coverage + covering-array oracle (cov.rules);
//   • each decision arm names the requirement it satisfies (calc.req) — firing it lights the RTM;
//   • it is the Rule.check triage target.
//
// The `lookup` const is the editable rate table (the console's Lookups tab AST-patches it in place;
// the helper `execute` below is untouched). `execute` is the oracle every scenario runs.
const lookup = {
    // base monthly rate by coverage (USD)
    baseRate: { LIABILITY: 50, COLLISION: 90, COMPREHENSIVE: 140 },
    // territory factor by US state (the supported rating territories)
    stateFactor: { CA: 10, NY: 15, FL: 15, TX: 0, WA: 0 }
};

const execute = function (calc) {
    const input = calc.input;
    let base = lookup.baseRate[input.coverage];
    calc.log('base rate for ' + input.coverage + ' = ' + base);

    // RATE-001/1 — a young driver pays a loading
    calc.label('Young-driver loading');
    if (input.driverAge < 25) {
        base += 40;
        calc.req('RATE-001/1');
        calc.log('young-driver loading +40');
    }

    // RATE-001/2 — a senior driver pays a (smaller) loading
    calc.label('Senior-driver loading');
    if (input.driverAge > 70) {
        base += 25;
        calc.req('RATE-001/2');
        calc.log('senior-driver loading +25');
    }

    // RATE-002/1 — a driver with prior claims pays a surcharge
    calc.label('Prior-claims surcharge');
    if (input.priorClaims) {
        base += 35;
        calc.req('RATE-002/1');
        calc.log('prior-claims surcharge +35');
    }

    // Catastrophe reinsurance surcharge — a base rate is built up only by additions, so it can never
    // be negative; this clause can therefore never fire. A DEAD RULE: Rule.check flags it notreachable
    // (the fix is the rule itself, not the test data).
    calc.label('Catastrophe reinsurance surcharge');
    if (base < 0) {
        base += 500;
        calc.log('catastrophe reinsurance surcharge +500');
    }

    // RATE-003/1 — the premium is adjusted by the state rating territory factor. Applied to EVERY quote
    // (even a zero-factor state is looked up), so any saved scenario covers this criterion.
    calc.label('Territory rating');
    calc.req('RATE-003/1');
    const stateFactor = lookup.stateFactor[input.state];
    const premium = base + stateFactor;
    calc.log('state factor for ' + input.state + ' = ' + stateFactor + ' → monthly premium = ' + premium);

    // a business guarantee — the premium can never dip below the coverage's own base rate
    calc.always('premium never below base rate', premium >= lookup.baseRate[input.coverage]);

    calc.output = { monthlyPremium: premium, currency: 'USD' };
};
