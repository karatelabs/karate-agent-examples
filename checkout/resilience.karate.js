// resilience.karate.js — the FAULT-FEED lane: the same payments mock the paired run proves faithful
// (contract.karate.js) now deliberately misbehaves, and what gets graded is THE CHECKOUT SERVICE.
//
//   javac -d servers/classes servers/src/io/karatelabs/examples/checkout/*.java
//   java -cp servers/classes io.karatelabs.examples.checkout.CheckoutServer 8080 http://localhost:8091
//   docker run … karate-agent launch resilience.karate.js
//
// One artifact, two jobs: the mock proves fidelity in the paired run, and grades resilience here — it
// serves the frozen fault deck (mutation/fault-manifest.json), each scenario of
// checks/payments-resilience.feature arms one fault over the mock's control endpoint, and the verdicts
// are AUTHORED: a fault checkout tolerates is a pass; a red is a finding about checkout itself. No
// recorded pact can express this — a pact file has no fault deck, and BDCT never executes the consumer.
// The polarity law: verdicts are authored, never a mutation score.
//
// THIS KIT CARRIES TWO DELIBERATE FINDINGS (see the README), so expect this launch to end red: checkout
// has no timeout on its payments client, and it will confirm an order whose payment id never arrived.

// The fault-armed mock listens on a FIXED port so the checkout SUT can be started against it (the
// command above). Order does not matter — checkout stores its payments URL at boot but only CONNECTS
// per request, so the mock may come up after it.
//
// BIND HOST: a fault-armed mock binds loopback by default — its control endpoint is unauthenticated, so
// exposing it beyond this host must be deliberate. The same-host lanes (the README's `java -jar`, the
// kit's test) need nothing. Run the SUT and the mock on DIFFERENT hosts/containers (the `docker run`
// line above forwards a port) and you must widen the bind AND publish the port:
//   -Dmock.host=0.0.0.0    (and `docker run -p 8091:8091 …`)
var port = parseInt(Settings.sysprop('payments.port', '8091'), 10);
var host = Settings.sysprop('mock.host', 'localhost');
var mock = Http.mock({ feature: 'mock/payments-mock.feature', faults: 'mutation/fault-manifest.json', port: port, host: host });
if (mock.error) {
  throw 'resilience: the fault-armed payments mock did not start — ' + mock.error;
}
console.log('resilience: payments mock serving the fault deck at ' + mock.url
    + '  (control: ' + mock.url + '/__karate/fault)');

var checkoutUrl = Settings.sysprop('checkout.url', 'http://localhost:8080');

// QUARANTINE: a fault-fed run is an INSTRUMENT run — the backend is deliberately broken,
// so nothing here is evidence about the system. THIS LAUNCHER keeps it out of the graph by writing under
// target/, never runs/ — a caller convention, not a framework guarantee (a fault-fed suite is an
// ordinary run, so keep this output choice if you adapt the lane). The run's own report (coverage +
// traceability over the quarantined output) is where CHK-003's criteria read as exercised.
var result = Runner.run(['checks/payments-resilience.feature'], {
  output: 'target/resilience',
  props: { paymentsUrl: mock.url, 'checkout.url': checkoutUrl }
});

// the per-response attribution record: which fault was served to which call (Karate-Mutant: <id> on the
// wire; the same read is a curl of the control endpoint away)
var state = mock.fault();
console.log('resilience: faults served — ' + JSON.stringify(state.served));
mock.stop();

if (result.failed > 0) {
  // red is this lane DOING ITS JOB: each failed scenario is an authored resilience verdict the consumer
  // did not meet — a finding about checkout, on the record, with the fault that produced it attributed.
  throw 'resilience: ' + result.failed + ' of ' + result.total + ' authored verdicts read as findings — '
      + 'ways checkout mishandles a misbehaving dependency (this kit carries two deliberately; see the '
      + 'README). Report: ' + result.reportUrl;
}
console.log('resilience: every authored verdict held — checkout tolerated the whole fault deck');
