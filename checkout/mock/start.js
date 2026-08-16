// Started ONCE per suite by karate-config.js via karate.callSingle. Stands up the payments-dependency
// mock (mock/payments-mock.feature) on a free port and hands back its base URL — so the everyday lane
// (checks/payments-contract.feature, and a checkout SUT started with no PAYMENTS_URL of its own) "just
// works" with no server process. project-root-anchored ('/mock/...'): resolves identically from a
// feature run AND config-eval.
var server = karate.start({ mock: '/mock/payments-mock.feature', port: 0 });
({ paymentsUrl: server.url })
