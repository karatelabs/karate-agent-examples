// Started ONCE per suite by karate-config.js via karate.callSingle: the in-process Loan Decisioning service
// on a free port, handing back its base URL. project-root-anchored ('/mock/...'), so it resolves identically
// from a feature run and from config-eval.
var server = karate.start({ mock: '/mock/decision-mock.feature', port: 0 });
({ baseUrl: server.url })
