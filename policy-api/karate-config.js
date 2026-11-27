function fn() {
  // An external baseUrl wins (e.g. a host test that stands up its own server). `karate.env=backend` targets
  // the real Policy API (rating-server's PolicyServer, default http://localhost:8080; -DbackendUrl moves it).
  // Otherwise AUTO-START the in-process Policy API mock ONCE per suite (mock/start.js via callSingle) and
  // point baseUrl at it — so picking `insurance` in the console and running checks/policy.feature "just
  // works", no server process.
  // (The gRPC half runs a REAL embedded rating engine, started separately on :50052 — see karate-boot.js.)
  // The host the kit's own servers run on: host.docker.internal from inside the karate-agent
  // container (its image sets KARATE_SERVE_WORK), localhost on bare metal.
  var host = karate.sysenv('KARATE_SERVE_WORK') ? 'host.docker.internal' : 'localhost';
  var baseUrl = karate.sysprop('baseUrl');
  if (!baseUrl && karate.env == 'backend') {
    baseUrl = karate.sysprop('backendUrl') || 'http://' + host + ':8080';
  }
  if (!baseUrl) {
    // Project-root-anchored ('/mock/...'): a leading '/' is from the project root, so it resolves identically
    baseUrl = karate.callSingle('/mock/start.js').baseUrl;
  }
  // PolicyDesk (sut/, served at /desk/ by the REST face) on the same host. desk.defects
  // names seeded UI defects (display, drift); desk.theme (dark, light) pins its theme, else it follows the OS;
  // cdp.url attaches the bot to a specific Chrome.
  var deskUrl = karate.sysprop('desk.url', 'http://' + host + ':8080/desk/');
  var deskTheme = karate.sysprop('desk.theme', '');
  if (deskTheme) {
    deskUrl += (deskUrl.indexOf('?') < 0 ? '?' : '&') + 'theme=' + deskTheme;
  }
  var deskDefects = karate.sysprop('desk.defects', '');
  var cdpUrl = karate.sysprop('cdp.url') || null;
  return { baseUrl: baseUrl, deskUrl: deskUrl, deskDefects: deskDefects, cdpUrl: cdpUrl };
}
