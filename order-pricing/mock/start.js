// Started ONCE per suite by karate-config.js via karate.callSingle (so every scenario shares one
// backend). Stands up the RULE-BACKED in-process mock: Http.mock parses /openapi.yaml and computes
// each POST /orders response through the order-pricing rulebook (rulebooks/order-pricing/calc.js) —
// the same rulebook that is the Rule.execute oracle, so mock and oracle share one brain and
// the substantive pricing result {subtotal, discount, tax, total, approval} crosses the HTTP
// boundary. Needs boot.ext('http') in karate-boot.js (registers the Http global; auto-stops the
// mock at suite end). crud:false — the one op is rule-computed, no CRUD convention wanted.
// project-root-anchored ('/openapi.yaml'): resolves identically from a feature run AND config-eval.
var mock = Http.mock('/openapi.yaml', { rules: { createOrder: 'order-pricing' }, crud: false, port: 0 });
({ baseUrl: mock.url })
