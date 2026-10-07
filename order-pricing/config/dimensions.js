// Coverage dimensions — the cross/point + covering-array binding for /orders.
// The extractor reads the three input axes that matter off each request, plus the response code.
// `cross` declares the required COMBINATION (customerTier × region × rush) the rule-as-oracle grades,
// and `Coverage.coveringArray()` decks against. Add `criticality: 'high'` to deepen the deck to 3-way.
//
// The bound rulebook is `order-pricing-restricted` — the same rate book plus the market-availability
// precondition (silver is US-only) — because this binding is ALSO the FEASIBILITY oracle: every
// candidate cell of the cross-product is run through the calc, and one the rules reject is dropped from
// the REQUIRED set instead of being reported as an untested gap. So the numbers read "tested / the
// combinations the business can actually sell", and the deck never proposes an order nobody could
// place. Bind plain `order-pricing` to see the same traffic graded against the unpruned product.
({
    '/orders': {
        rulebook: 'order-pricing-restricted',
        extract: function (request, response) {
            return {
                customerTier: request.body.customerTier,
                region: request.body.region,
                rush: request.body.rush,
                response: response.status
            };
        },
        cross: ['customerTier', 'region', 'rush']
    }
})
