// Policy API - the policy's life as a behaviour model, bound to its transport: quote, bind, then
// cancel or file a claim. One aggregate, the policy; the claim is part of it. The premium is the
// rate book's (t.calc), so the twin and the rulebook agree by construction.
// The playground's mock is this model; mock/policy-mock.feature stays the suite's mock, and
// openapi.yaml stays the hand-written contract the projection is diffed against
// (projection-waivers.yaml). Every rating territory and coverage multiplies the quotes a walk
// explores, so Twin.check takes twin-plan.json, which narrows them until the walk is exhausted.

t.init(function (w) {
    w.id = 'pol-1';
    w.status = 'NEW';
    w.state = null;
    w.coverage = null;
    w.driverAge = null;
    w.priorClaims = null;
    w.monthlyPremium = 0;
    w.policyClass = null;
    w.holder = null;
    w.claim = null;
    w.claimsAtCancel = null;
});

t.state('QUOTED', function (w) { return w.status === 'QUOTED'; });
t.state('BOUND', function (w) { return w.status === 'BOUND'; });
t.state('CANCELLED', function (w) { return w.status === 'CANCELLED'; });
t.state('CLAIMED', function (w) { return w.claim !== null; });

// the class the feature mock and the rating server answer beside the premium
function classOf(a) {
    if (a.priorClaims) {
        return 'SUBSTANDARD';
    }
    return a.driverAge >= 25 && a.driverAge <= 70 ? 'PREFERRED' : 'STANDARD';
}

t.resource({
    path: '/policies',
    identity: 'id',
    name: 'Policy',
    view: function (w) {
        return {
            id: w.id,
            status: w.status,
            state: w.state,
            coverage: w.coverage,
            driverAge: w.driverAge,
            priorClaims: w.priorClaims,
            monthlyPremium: w.monthlyPremium,
            policyClass: w.policyClass,
            holder: w.holder,
            claim: w.claim
        };
    },
    schema: {
        type: 'object',
        required: ['id', 'status', 'state', 'coverage', 'driverAge', 'priorClaims', 'monthlyPremium',
            'policyClass', 'holder', 'claim'],
        properties: {
            id: { type: 'string' },
            status: { enum: ['QUOTED', 'BOUND', 'CANCELLED'] },
            state: { enum: ['CA', 'NY', 'FL', 'TX', 'WA'] },
            coverage: { enum: ['LIABILITY', 'COLLISION', 'COMPREHENSIVE'] },
            driverAge: { type: 'integer', minimum: 18, maximum: 80 },
            priorClaims: { type: 'boolean' },
            monthlyPremium: { type: 'integer', minimum: 1 },
            policyClass: { enum: ['PREFERRED', 'STANDARD', 'SUBSTANDARD'] },
            holder: { type: ['string', 'null'] },
            claim: {
                type: ['object', 'null'],
                required: ['amount', 'status'],
                properties: {
                    amount: { type: 'integer', minimum: 1 },
                    status: { enum: ['OPEN'] }
                }
            }
        }
    },
    errorCode: 'error',
    list: true
});

// The guard is a scope guard: the model holds one policy, and the mock allocates the identity on
// every quote, so the world it rejects is one no request can put the service in.
t.command('createQuote', {
    when: function (w) { return w.status === 'NEW'; },
    scopeGuard: true,
    args: function (a) {
        a.enum('state', ['CA', 'NY', 'FL', 'TX', 'WA']);
        a.enum('coverage', ['LIABILITY', 'COLLISION', 'COMPREHENSIVE']);
        a.int('driverAge', 18, 80, [22, 45]);
        a.bool('priorClaims');
    },
    example: { state: 'CA', coverage: 'COLLISION', driverAge: 45, priorClaims: false },
    apply: function (w, a) {
        var r = t.calc({ state: a.state, coverage: a.coverage, driverAge: a.driverAge, priorClaims: a.priorClaims });
        w.state = a.state;
        w.coverage = a.coverage;
        w.driverAge = a.driverAge;
        w.priorClaims = a.priorClaims;
        w.monthlyPremium = r.output.monthlyPremium;
        w.policyClass = classOf(a);
        w.status = 'QUOTED';
    },
    operation: 'createQuote',
    route: 'POST /policies',
    creates: true,
    refusals: { guard: 'QUOTE_EXISTS' },
    wire: { applied: 201 }
});

t.command('bindPolicy', {
    when: function (w) { return w.status === 'QUOTED'; },
    args: function (a) { a.enum('holder', ['Ada Lopez', 'Sam Chen']); },
    example: { holder: 'Ada Lopez' },
    apply: function (w, a) {
        w.holder = a.holder;
        w.status = 'BOUND';
    },
    then: function (before, after) { return after.monthlyPremium === before.monthlyPremium; },
    operation: 'bindPolicy',
    route: 'POST /policies/{id}/bind',
    refusals: { guard: 'POLICY_NOT_QUOTED' },
    wire: {
        applied: 200,
        refused: { POLICY_NOT_QUOTED: { status: 409, code: 'policy_not_quoted' } }
    }
});

t.command('cancelPolicy', {
    when: function (w) { return w.status === 'BOUND'; },
    apply: function (w) {
        w.claimsAtCancel = w.claim === null ? 0 : 1;
        w.status = 'CANCELLED';
    },
    operation: 'cancelPolicy',
    route: 'DELETE /policies/{id}',
    refusals: { guard: 'POLICY_NOT_BOUND' },
    wire: {
        applied: 200,
        refused: { POLICY_NOT_BOUND: { status: 409, code: 'policy_not_bound' } }
    }
});

t.command('fileClaim', {
    when: function (w) { return w.status === 'BOUND'; },
    args: function (a) { a.int('amount', 1, 50000, [500, 5000]); },
    example: { amount: 500 },
    apply: function (w, a) {
        if (w.claim !== null) {
            t.reject('CLAIM_ALREADY_OPEN');
        }
        w.claim = { amount: a.amount, status: 'OPEN' };
    },
    then: function (before, after) { return after.status === 'BOUND'; },
    operation: 'fileClaim',
    route: 'POST /policies/{id}/claims',
    refusals: { guard: 'POLICY_NOT_ACTIVE' },
    wire: {
        applied: 201,
        refused: {
            POLICY_NOT_ACTIVE: { status: 409, code: 'policy_not_active' },
            CLAIM_ALREADY_OPEN: { status: 409, code: 'claim_already_open' }
        }
    }
});

t.always('a quoted policy carries a premium', function (w) {
    return w.status === 'NEW' || w.monthlyPremium > 0;
});
t.always('a cancelled policy accepts no claim', function (w) {
    return w.claimsAtCancel === null || (w.claim === null ? 0 : 1) === w.claimsAtCancel;
});
