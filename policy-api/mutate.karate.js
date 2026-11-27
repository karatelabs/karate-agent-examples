// mutate.karate.js — would your tests notice? Seeds defects into a copy of the `rating` rulebook, serves each
// through the rule-backed mock, replays a suite against it, and lands on the report's Seeded defects tab.
//
//   console: Checks › run dialog › mutate.karate.js (settings: mutate.suite=…, mutate.stopAtRefusal=true)
//   eval:    Runner.launch('mutate.karate.js', {props: {'mutate.suite': 'suites/ai'}})
//
// A suite that fails on the untouched rules is refused, naming the defect its failing rows agree with:
// suites/ai asserts the backend's missing senior-driver loading (RATE-001/2). The refused rows are then set
// aside as expected failures and the rest is graded. mutate.stopAtRefusal=true stops at the refusal, so the
// rulebook page's button reads "Your suite asserts a defect".

var suite = Settings.sysprop('mutate.suite', 'suites/ai');
var stopAtRefusal = String(Settings.sysprop('mutate.stopAtRefusal', 'false')) === 'true';
var opts = {
  suite: suite,
  operation: 'createQuote',
  handlers: 'mutation/handlers.js',
  provenance: 'mutation/provenance.json'
};

var grade = Rule.mutate('rating', opts);
if (grade.error && grade.failures && !stopAtRefusal) {
  console.log('mutate: refused — ' + grade.message);
  console.log('mutate: setting aside ' + grade.failures.length + ' failing rows as expected failures');
  opts.expectedFailures = grade.failures;
  grade = Rule.mutate('rating', opts);
}
if (grade.error && !(stopAtRefusal && grade.failures)) {
  throw 'mutate: no grade — ' + grade.error + ': ' + grade.message;
}

var c = grade.counts || {};
console.log(grade.error ? 'mutate: refused — ' + grade.message
    : 'mutate: ' + grade.independentlyKilled + ' of ' + grade.denominator + ' seeded defects caught · '
      + (c.SURVIVED || 0) + ' missed · ' + (c.SCREENED || 0) + ' screened');

// the same page the rulebook's "Seeded defects" button opens
var rep = Rule.report('rating');
if (rep.error) {
  throw 'mutate: graded, but the report could not be written — ' + rep.error;
}
var url = '/api/artifacts/reports/' + encodeURIComponent(String(rep.file).split('/').pop()) + '#analysis=suitemutation';

({ report: url, suite: suite, refused: !!grade.error, caught: grade.independentlyKilled, of: grade.denominator });
