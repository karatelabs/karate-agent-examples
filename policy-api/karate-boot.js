// The all-in-one INSURANCE demo — REST (OpenAPI) + gRPC (the rating engine, PRIMARY) + Kafka (OPTIONAL).
// Boot the protocol exts and declare the coverage universes once here (central config), so the features
// only name the proto/service/method (gRPC) and the spec is the operation universe (REST).
// gRPC is the PRIMARY protocol backend of the live demo (the rating engine on :50052), but it is OPTIONAL:
// the lean agent jar / image ships without the grpc leaf, so the kit must run REST + rules + requirements
// there rather than failing to boot. `boot.has('grpc')` asks the runtime directly — the project decides for
// itself, with no env var for the operator to know about (an LLM or a customer driving the served console
// cannot set one, so an env gate turned "no grpc leaf" into "every run dies at boot"). KARATE_GRPC_OFF
// survives only as an explicit opt-out for a runtime that HAS the leaf but wants the REST-only lane.
// Precedence: a per-run PROPERTY wins over the env. The env says what this machine is (a CI image with no
// grpc leaf); a `props` on the run says what THIS run is meant to be — the deliberate, narrower intent, so
// a launch script can compose a lane the environment did not anticipate. Env stays read-only either way.
var grpcOff = boot.sysprop('KARATE_GRPC_OFF') || boot.sysenv('KARATE_GRPC_OFF')
        || !boot.has('grpc');
if (!grpcOff) {
  var grpc = boot.ext('grpc');
  grpc.host = boot.sysprop('grpc.host', 'localhost');
  grpc.port = boot.sysprop('grpc.port', '50052');   // the rating engine (started separately on :50052)
  grpc.protoRoots = ['.'];
}

// The `rating` rulebook is the brain: it prices the /quotes mock, is the covering-array feasibility
// oracle, and links each decision arm to a requirement (calc.req). Booting the rules ext binds Rule.*
// (Rule.check / Rule.cover / Rule.execute) and the acceptance globals for checks.
var rules = boot.ext('rules');
rules.home = 'rulebooks';

var cov = boot.ext('coverage');
// gRPC: the proto/ DIRECTORY is the rating method universe (service × method) — the gRPC analog of an
// OpenAPI spec. The run's grpc-match traffic joins by service/method; the .proto's protovalidate field
// bounds + enums reverse-infer the INPUT dimensions (coverage enum, driver_age BVA, state length).
// Bound to the same KARATE_GRPC_OFF gate as the ext above, so the REST-only report has no dangling
// (0%-covered) grpc universe when no grpc traffic ran.
if (!grpcOff) {
  cov.grpc = 'proto';
}
// OpenAPI: the Policy API operation universe (path × method) — the http-match traffic joins by path/method.
cov.openapi = 'openapi.yaml';
// Rules: the rulebook home — each saved scenario is a coverage item, and cov.dimensions binds the
// cross/covering-array oracle to /quotes. Requirements: the EARS source; calc.req arms + Rule.cover
// project a run-free RTM (rules-only evidence) and the confidence-to-ship readiness verdict.
cov.rules = 'rulebooks';
cov.requirements = 'requirements';
cov.dimensions = 'config/dimensions.js';

// Requirements ext — deep-link each requirement id in the RTM / coverage report to its heading in the
// markdown source of truth on GitHub, the pure-git / SDD mirror of an ALM Story link. So anyone
// browsing the PUBLISHED report can click RATE-001 and land on requirements/rating.md — no license, no
// tracker. CI passes the exact repo + commit (KARATE_GIT_*), pinning each link to the reviewed commit;
// a bare local/serve run falls back to this kit's canonical public home on main, so the click-through
// works on stage too. (Unlike traceability-demo, which leaves the link plain-text when unset, policy-api defaults
// to its published home — the whole point is a report a prospect can browse and click.)
var req = boot.ext('requirements');
var gitRepoUrl = boot.sysprop('KARATE_GIT_REPO_URL', boot.sysenv('KARATE_GIT_REPO_URL'));
var gitRef = boot.sysprop('KARATE_GIT_REF', boot.sysenv('KARATE_GIT_REF'));
var gitBase = boot.sysprop('KARATE_GIT_BASE', boot.sysenv('KARATE_GIT_BASE'));
req.provider = {
  system: 'git',
  repoUrl: gitRepoUrl ? gitRepoUrl : 'https://github.com/karatelabs/karate-agent-examples',
  branch: gitRef ? gitRef : 'main',
  basePath: gitBase ? gitBase : 'policy-api'
};

// Kafka — OPTIONAL fourth beat (the one protocol whose backend wants Docker, so it is OFF by default and
// out of CI). Start Kafka (KRaft broker + Schema Registry via kafka/docker-compose.yml), then uncomment
// below to add the event-side universe (policy-events topic, Avro policy-event schema). The producer that
// exercises it is checks/policy-events.feature (@ignore'd — un-ignore it to run; see README section 5):
// var kafka = boot.ext('kafka');
// kafka.bootstrap = boot.sysprop('kafka.bootstrap', '127.0.0.1:29092');
// kafka.schemaRegistry = boot.sysprop('kafka.schemaRegistry', 'http://localhost:8081');
// cov.kafka = { schemaRegistry: kafka.schemaRegistry, topics: [ { topic: 'policy-events', schema: 'policy-event' } ] };

// This project does CONTRACT TESTING — one suite against the mock and against the real provider — so its
// reports carry a Contract tab beside Coverage and Traceability. Booting it IS the declaration: the tab is
// about what this project does, not about whether a pair happens to be lying around. With no pair minted
// yet the page says so and names the call; `contract.karate.js` is what mints one.
boot.ext('contract');

// ...and it GRADES its own spec: the same deterministic lint, scored per dimension, with a ship verdict and
// a maturity level — on a Governance tab beside the other three. It grades what `cov.openapi` already
// declares, so the document is named once. Nothing here is judged by a model.
boot.ext('governance');
