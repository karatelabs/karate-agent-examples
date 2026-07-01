// Started ONCE per suite by karate-config.js via karate.callSingle. Stands up the in-process Policy API
// mock (mock/policy-mock.feature) on a free port and hands back its base URL — the REST backend for the
// cov.openapi half. (The gRPC half needs the rating engine started separately — a real embedded server.)
// project-root-anchored ('/mock/...'): resolves identically from a feature run AND config-eval (best practice).
var server = karate.start({ mock: '/mock/policy-mock.feature', port: 0 });
({ baseUrl: server.url })
