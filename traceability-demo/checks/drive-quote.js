// @description: drive the Loan Desk wizard (application → review → decision) for an application row and verify the on-screen decision + APR against the rules
// @req: 3/ac1,4/ac1,5/ac1,6/ac1
// @params: creditScore, annualIncome, loanAmount, termMonths, monthlyDebt, existingCustomer
//
// A deterministic UI check (no model in the loop). It drives the multi-step Loan Desk a human uses (the
// static SUT under sut/, served at loanUrl): fill the application, continue to REVIEW (oracled — the review
// screen must echo the entered inputs), submit, WAIT for the delayed decision, then assert the displayed
// decision + APR equal the personal-loan rules oracle (Rule.execute), per scenario row. Drift the SUT (the
// admin panel) and a row goes red. cdpUrl attaches the bot to a specific Chrome over CDP (else the
// KARATE_CDP_URL env).
var row = __row || __arg.row || __arg;

// option (a): the suite/discrete lane is NOT seeded a `bot` — the check creates its own, attaching to the
// container Chrome (cdpUrl wins over the KARATE_CDP_URL env). It does NOT destroy it: across the Scenario
// Outline's rows that Chrome is SHARED (the container's / the harness's one browser), so tearing it down
// would kill it for the next row — the harness owns its lifecycle. Each row navigates fresh (a fresh go()
// resets the wizard to step 1), so re-attaching is enough.
var bot = (typeof cdpUrl !== 'undefined' && cdpUrl) ? Robot.create({ cdpUrl: cdpUrl }) : Robot.create();
bot.go(loanUrl);

// ---- Step 1: Application ----
bot.act('#creditScore', 'clear'); bot.act('#creditScore', 'input', '' + row.creditScore);
bot.act('#annualIncome', 'clear'); bot.act('#annualIncome', 'input', '' + row.annualIncome);
bot.act('#loanAmount', 'clear'); bot.act('#loanAmount', 'input', '' + row.loanAmount);
bot.act('#termMonths', 'clear'); bot.act('#termMonths', 'input', '' + row.termMonths);
bot.act('#monthlyDebt', 'clear'); bot.act('#monthlyDebt', 'input', '' + row.monthlyDebt);
if (row.existingCustomer) { bot.act('#existingCustomer', 'click'); }
bot.act('#to-review', 'click');

// ---- Step 2: Review — the review screen must echo what was entered (a per-screen oracle) ----
bot.wait('#review-creditScore');
var reviewScore = parseInt(('' + bot.eval("document.querySelector('#review-creditScore').textContent")).replace(/[^0-9]/g, ''), 10);
match(reviewScore, row.creditScore, 'Review screen echoes the entered credit score');
bot.act('#submit', 'click');

// ---- Step 3: Decision — WAIT for the delayed decision to appear, then oracle it against the rules ----
var oracle = Rule.execute('personal-loan', row).output;
var labelOf = { 'auto-approved': 'approved', 'manual-review': 'refer', 'declined': 'declined' };

// the SUT reveals the decision only after an artificial "Calculating…" delay — wait until the decision
// text is actually populated (a JS-condition wait, robust to the element pre-existing hidden in the DOM).
bot.wait("document.querySelector('#decision').textContent.trim().length > 0");
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
