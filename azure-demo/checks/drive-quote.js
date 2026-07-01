// @description: drive the Loan Desk form for an application row and verify the on-screen decision + APR against the rules
// @req: 3/ac1,4/ac1,5/ac1,6/ac1
// @params: creditScore, annualIncome, loanAmount, termMonths, monthlyDebt, existingCustomer
//
// A deterministic UI check (no model in the loop). It drives the Loan Desk page a human uses (the static
// SUT under sut/, served at loanUrl) and asserts the displayed decision + APR equal the personal-loan rules
// oracle (Rule.execute), per scenario row. Drift the SUT (the page's admin panel) and a row goes red.
// cdpUrl attaches the bot to a specific Chrome over CDP (else the KARATE_CDP_URL env).
var row = __row || __arg.row || __arg;

// option (a): the suite/discrete lane is NOT seeded a `bot` — the check creates its own, attaching to the
// container Chrome (cdpUrl wins over the KARATE_CDP_URL env). It does NOT destroy it: across the Scenario
// Outline's rows that Chrome is SHARED (the container's / the harness's one browser), so tearing it down
// would kill it for the next row — the harness owns its lifecycle (a local self-launched one is closed at
// settle / JVM shutdown). Each row navigates fresh, so re-attaching is enough.
var bot = (typeof cdpUrl !== 'undefined' && cdpUrl) ? Robot.create({ cdpUrl: cdpUrl }) : Robot.create();
bot.go(loanUrl);
bot.act('#creditScore', 'clear'); bot.act('#creditScore', 'input', '' + row.creditScore);
bot.act('#annualIncome', 'clear'); bot.act('#annualIncome', 'input', '' + row.annualIncome);
bot.act('#loanAmount', 'clear'); bot.act('#loanAmount', 'input', '' + row.loanAmount);
bot.act('#termMonths', 'clear'); bot.act('#termMonths', 'input', '' + row.termMonths);
bot.act('#monthlyDebt', 'clear'); bot.act('#monthlyDebt', 'input', '' + row.monthlyDebt);
if (row.existingCustomer) { bot.act('#existingCustomer', 'click'); }
bot.act('#get-quote', 'click');

// the oracle — what the rules say this application SHOULD decide
var oracle = Rule.execute('personal-loan', row).output;
var labelOf = { 'auto-approved': 'approved', 'manual-review': 'refer', 'declined': 'declined' };

// read the screen + capture the evidence BEFORE asserting (so a red row still has its screenshot).
// NB: assert exact computed values via bot.eval (a precise DOM read), NOT bot.text — bot.text is the
// LLM-semantic "look" extractor (great for context, but it skips a bare value span like #apr).
var shownDecision = ('' + bot.eval("document.querySelector('#decision').textContent")).toLowerCase();
bot.screenshot('Loan decision: ' + oracle.decision + ' @req=3/ac1');

// 1) the decision arm agrees with the rules
match.contains(shownDecision, labelOf[oracle.decision], 'Decision = rules oracle (' + oracle.decision + ')');

// 2) for a priced application, the shown APR % equals the rules APR
if (oracle.apr != null) {
    var shownApr = parseFloat(('' + bot.eval("document.querySelector('#apr').textContent")).replace(/[^0-9.]/g, ''));
    match(shownApr, Math.round(oracle.apr * 10000) / 100, 'APR % = rules oracle');
}
