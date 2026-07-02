// Started ONCE per suite by karate-config.js via karate.callSingle. Stands up the in-process Loan Decision
// API mock (mock/loan-mock.feature) on a free port and hands back its base URL — the REST backend for the
// cov.openapi half. project-root-anchored ('/mock/...'): resolves identically from a feature run AND
// config-eval (best practice).
var server = karate.start({ mock: '/mock/loan-mock.feature', port: 0 });
({ baseUrl: server.url })
