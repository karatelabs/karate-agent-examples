// @description: quote a cases.xlsx row on PolicyDesk (driver, vehicle, coverage), bind it, and check the worksheet and policy premiums against the rating rules
// @params: label, state, coverage, driverAge, priorClaims (none: the senior row)
//
// A deterministic UI check: no model in the loop. PolicyDesk (sut/, at deskUrl) calls the policy API for every
// action; this check reads what the screen shows and compares it with Rule.execute('rating', input).
// a cases.xlsx row: the Outline's __row, an arg, or, run on its own, the senior row
var row = typeof __row !== 'undefined' ? __row : __arg.row || __arg;
if (!row.state) {
    row = { label: 'Senior driver, California collision', state: 'CA', coverage: 'COLLISION', driverAge: 75, priorClaims: 'No' };
}
// a spreadsheet cell reads back as text: the rating inputs are a number and a yes/no
var input = {
    state: row.state,
    coverage: row.coverage,
    driverAge: parseInt(row.driverAge, 10),
    priorClaims: ('' + row.priorClaims).toLowerCase() === 'yes'
};
var amount = function (locator) {
    return parseFloat(('' + bot.eval("document.querySelector('" + locator + "').textContent")).replace(/[^0-9.]/g, ''));
};

var bot = cdpUrl ? Robot.create({ cdpUrl: cdpUrl }) : Robot.create();
bot.go(deskUrl + (deskDefects ? (deskUrl.indexOf('?') < 0 ? '?' : '&') + 'defects=' + deskDefects : ''));

// New › Submission › Personal auto
bot.act('#nav-new', 'click');
bot.act('#menu-submission', 'click');
bot.act('#menu-new-quote', 'click');

// Driver
bot.wait("location.hash == '#/quote/driver'");
bot.act('#driver-first', 'input', 'Jordan');
bot.act('#driver-last', 'input', 'Ellis');
bot.act('#driver-age', 'input', '' + input.driverAge);
bot.act('#driver-state', 'select', input.state);
if (input.priorClaims) {
    bot.act('#prior-claims', 'click');
}
bot.act('#wizard-next', 'click');

// Vehicle: the defaults stand
bot.wait("location.hash == '#/quote/vehicle'");
bot.act('#wizard-next', 'click');

// Coverage
bot.wait("location.hash == '#/quote/coverage'");
bot.act('#cov-' + input.coverage, 'click');
bot.act('#rate-quote', 'click');

// Rating worksheet
bot.wait("location.hash.indexOf('#/worksheet/') == 0 && document.querySelector('#ws-total').textContent.length > 0");
var worksheetPremium = amount('#ws-total');
bot.screenshot('Rating worksheet: ' + row.label);
bot.act('#to-bind', 'click');

// Bind
bot.wait("location.hash.indexOf('#/bind/') == 0");
bot.act('#bind-signed', 'click');
bot.act('#bind-confirm', 'click');
bot.wait("document.querySelector('#policy-status').textContent == 'BOUND'");
var policyPremium = amount('#policy-premium');
bot.screenshot('Bound policy: ' + row.label);

var rated = Rule.execute('rating', input);
var expected = rated.output.monthlyPremium;
match(worksheetPremium, expected, row.label + ': worksheet premium $' + worksheetPremium + ' = rules $' + expected);
match(policyPremium, expected, row.label + ': bound policy premium $' + policyPremium + ' = rules $' + expected);
// reached only when both screens agreed: stamps the RATE criteria this rating realized
rated.verify(true, 'PolicyDesk shows the rated premium: ' + row.label);
