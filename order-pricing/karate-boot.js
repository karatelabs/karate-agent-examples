// Coverage wiring for the order-pricing project — karate auto-loads karate-boot.js from the working dir,
// so a run anchored here (the served console, or a CLI run in this folder) produces the dimensions
// surface: the API-coverage cross/covering-array beat over POST /orders.
//   cov.openapi  — the OpenAPI contract (the coverage items + the zero-authoring spec-derived universes)
//   cov.rules — the rulebook home (supplies the closed-axis universes + the feasibility oracle for cross)
//   cov.dimensions   — the dimensions config (the cross/covering-array binding), kept under config/ by convention
//   cov.requirements — the requirement source; wiring it makes a bare `karate run` auto-render the
//                      Traceability (RTM) tab into karate-summary.html alongside Coverage (CoverageExt
//                      registers it at SUITE_ENTER when requirements are configured) — no eval, no UI change.
// the http ext lights the Http global in-run, so karate-config.js can stand up the rule-backed
// mock itself (mock/start.js via callSingle); started mocks are auto-stopped at suite end.
boot.ext('http');

// the rules ext lights the Rule global in-run — the oracle face of the one-rulebook-two-faces
// keystone: checks can Rule.execute(...).verify(...) against the same rulebook the mock
// serves (see mutation/oracle-check.feature).
const rules = boot.ext('rules');
rules.home = 'rulebooks';

const cov = boot.ext('coverage');
cov.openapi = 'openapi.yaml';
cov.rules = 'rulebooks';
cov.dimensions = 'config/dimensions.js';
cov.requirements = 'requirements';
