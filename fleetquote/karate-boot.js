// Stonebridge Fleet Auto project boot
// bind the rules ext so features (checks + the mock) can call Rule.execute -
// the 'rating' rulebook is the single pricing oracle for the whole project
boot.ext('rules');
// NOTE: the spec + rules homes are joined into the coverage graph at aggregate time:
//   Report.aggregate({ rules: 'rulebooks', spec: 'openapi.yaml' })
// (a `cov.openapi = ...` line here, as suggested by Report.aggregate's note, fails
// in-run with "cov is not defined" - so the aggregate args are the working form)
