// Coverage dimensions — the cross/point + covering-array binding for POST /quotes.
// The extractor reads the three rating input axes that matter off each quote request, plus the response
// code. `cross` declares the required COMBINATION (coverage × state × priorClaims) the rule-as-oracle
// grades, and `Coverage.coveringArray()` decks against. The `rating` rulebook supplies the feasibility
// oracle. Add `criticality: 'high'` to deepen the deck from pairwise to 3-way (D67).
({
    '/quotes': {
        rulebook: 'rating',
        extract: function (request, response) {
            return {
                coverage: request.body.coverage,
                state: request.body.state,
                priorClaims: request.body.priorClaims,
                response: response.status
            };
        },
        cross: ['coverage', 'state', 'priorClaims']
    }
})
