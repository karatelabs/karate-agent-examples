function fn() {
  // the served stateful mock - start it from the console with:
  //   var mock = File.call('/mock/start.js')
  // an external baseUrl wins: a harness that serves the mock itself hands over its own port.
  return { baseUrl: karate.sysprop('baseUrl') || 'http://localhost:8090' };
}
