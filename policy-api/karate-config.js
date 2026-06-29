function fn() {
  // An external baseUrl wins (e.g. a host test that stands up its own server). Otherwise AUTO-START the
  // in-process Policy API mock ONCE per suite (mock/start.js via callSingle) and point baseUrl at it — so
  // picking `insurance` in the console and running checks/policy.feature "just works", no server process.
  // (The gRPC half runs a REAL embedded rating engine, started separately on :50052 — see karate-boot.js.)
  var baseUrl = java.lang.System.getProperty('baseUrl');
  if (!baseUrl) {
    // callSingle resolves relative to the RUNNING FEATURE's dir (checks/), not the project root.
    baseUrl = karate.callSingle('../mock/start.js').baseUrl;
  }
  return { baseUrl: baseUrl };
}
