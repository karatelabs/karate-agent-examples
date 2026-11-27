// desk-rating.js — PolicyDesk's rating worksheet: the premium build-up the desk displays beside the
// rated premium the policy API returned. The API's monthlyPremium is the total; these lines explain it.
var DESK_RATES = {
    base: { LIABILITY: 50, COLLISION: 90, COMPREHENSIVE: 140 },
    youngDriver: 40,
    seniorDriver: 25,
    priorClaims: 35,
    territory: { CA: 10, NY: 15, FL: 15, TX: 0, WA: 0 }
};

// the territory table before Florida was filed; the display defect reads it
var DESK_TERRITORY_UNFILED = { CA: 10, NY: 15, TX: 0, WA: 0 };

var DESK_STATE_NAMES = { CA: 'California', NY: 'New York', FL: 'Florida', TX: 'Texas', WA: 'Washington' };

// input: {state, coverage, driverAge, priorClaims} · quote: the createQuote response · defects: {display}
function deskWorksheet(input, quote, defects) {
    var seeded = defects || {};
    var lines = [];
    lines.push({ key: 'base', label: 'Base rate · ' + input.coverage.toLowerCase(), amount: DESK_RATES.base[input.coverage] });
    if (input.driverAge < 25) {
        lines.push({ key: 'young', label: 'Young-driver loading', amount: DESK_RATES.youngDriver });
    }
    if (input.driverAge > 70) {
        lines.push({ key: 'senior', label: 'Senior-driver loading', amount: DESK_RATES.seniorDriver });
    }
    if (input.priorClaims) {
        lines.push({ key: 'claims', label: 'Prior-claims surcharge', amount: DESK_RATES.priorClaims });
    }
    var table = seeded.display ? DESK_TERRITORY_UNFILED : DESK_RATES.territory;
    lines.push({ key: 'territory', label: 'Territory · ' + DESK_STATE_NAMES[input.state], amount: table[input.state] || 0 });
    var sum = 0;
    for (var i = 0; i < lines.length; i++) {
        sum += lines[i].amount;
    }
    return { lines: lines, sum: sum, total: seeded.display ? sum : quote.monthlyPremium };
}
