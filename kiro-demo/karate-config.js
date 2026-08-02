function fn() {
  // AUTO-START the in-process Loan Decisioning service ONCE per suite and point baseUrl at it, so the API
  // feature "just works" with no server process to manage. An external -DbaseUrl wins (e.g. running the
  // same checks against a deployed environment).
  var baseUrl = karate.sysprop('baseUrl');
  if (!baseUrl) {
    baseUrl = karate.callSingle('/mock/start.js').baseUrl;
  }
  return { baseUrl: baseUrl };
}
