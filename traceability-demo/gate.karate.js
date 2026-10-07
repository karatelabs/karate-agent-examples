// gate.karate.js — the confidence gate, rendered as a pull-request check payload:
//   karate launch gate.karate.js
//   docker run … karate-agent launch gate.karate.js
//
// Run it AFTER suite.karate.js: it reads the run that suite just wrote (the readiness verdict over the
// requirements) plus openapi.yaml (the API lint), and renders ONE payload — a conclusion, a markdown
// summary, and line-level annotations naming the requirement, the covering scenario or the spec line
// behind each one. It computes no verdict of its own and fails nothing: CI posts the payload as a check,
// and the conclusion in it is what blocks or does not.
var gate = Report.gate({
  spec: 'openapi.yaml',
  // Annotations must name REPOSITORY paths, and this kit is a subdirectory of the examples repo. CI
  // already passes that subdirectory for the requirement deep-links, so read it from there rather than
  // hardcoding a layout the kit cannot see; a project at the repo root leaves it empty.
  pathPrefix: Settings.sysenv('KARATE_GIT_BASE', '')
});

if (gate.error) {
  throw 'gate: no payload was rendered — ' + gate.error;
}

File.write('target/karate-gate.json', JSON.stringify(gate));
console.log('gate: ' + gate.conclusion + ' — ' + gate.title);
