// order-pricing — the input UNIVERSE. A property-based-testing generator, enumerated
// deterministically (boundary + pairwise) rather than randomly sampled. It declares the dimensions
// the explorer sweeps AND constrains them (valid domains only), and gives the items[] array a real
// cardinality dimension (0..3 line items) + per-element variation — the clean fix for "arrays are a
// grey box". An LLM can write this from the requirement in a few lines.
function generate(g) {
    g.enum('customerTier', ['standard', 'silver', 'gold', 'platinum']);
    g.enum('region', ['US', 'EU', 'APAC']);
    g.bool('rush');
    g.array('items', 0, 3, function (el) {
        el.enum('category', ['hardware', 'software', 'service']);
        el.int('qty', 1, 100, [10, 50]);          // volume-tier boundaries 10 / 50 (pinned)
        el.int('unitPrice', 10, 5000);
    });
}
