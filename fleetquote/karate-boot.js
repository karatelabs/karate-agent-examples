// Stonebridge Fleet Auto project boot
// bind the rules ext so features (checks + the mock) can call Rule.execute -
// the 'rating' rulebook is the single pricing oracle for the whole project
boot.ext('rules');

// contribute coverage to the run's native report (the Coverage + Traceability nav tabs): the requirements'
// EARS criteria, the rulebook's own scenarios (calc.req emits a hit per Rule.execute), and the quote API
// contract all join ONE graph, so a run's RTM spans requirement -> rule -> operation.
const cov = boot.ext('coverage');
cov.requirements = 'requirements';
cov.rules = 'rulebooks';
cov.openapi = 'openapi.yaml';
