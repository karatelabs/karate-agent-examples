// The Policy API served for Rule.mutate only: Rule.mutate('rating', {suite, handlers: 'mutation/handlers.js'})
// binds `Rule` to the mutant's rules home, so createQuote's premium is the rulebook's (mutated or not) and every
// other operation mirrors PolicyServer.java. The suite and the paired run keep mock/policy-mock.feature.
(function () {
    var rated = ['CA', 'NY', 'FL', 'TX', 'WA'];
    var coverages = ['LIABILITY', 'COLLISION', 'COMPREHENSIVE'];
    var isStr = function (v) { return typeof v === 'string' && v.trim() !== ''; };
    var isInt = function (v) { return typeof v === 'number' && v === Math.floor(v); };

    var reply = function (response, status, body) {
        response.status = status;
        response.body = body;
    };
    var badRequest = function (response, field, message) {
        reply(response, 400, { error: message, field: field });
    };
    var notFound = function (response, error, id) {
        reply(response, 404, { error: error, id: id });
    };
    // kept apart from the CRUD default's own per-resource stores, which share the session
    var store = function (session, name) {
        var key = 'pa.' + name;
        session[key] = session[key] || {};
        return session[key];
    };
    var nextId = function (session, prefix) {
        var key = 'pa.' + prefix + 'Seq';
        session[key] = (session[key] || 0) + 1;
        return prefix + '-' + session[key];
    };
    var bodyOf = function (request) {
        var b = request.body;
        return b && typeof b === 'object' ? b : {};
    };
    var copy = function (o) { return JSON.parse(JSON.stringify(o)); };

    var createQuote = function (request, response, session) {
        var b = bodyOf(request);
        if (!isStr(b.state) || rated.indexOf(b.state) < 0) return badRequest(response, 'state', 'state must be one of [CA, NY, FL, TX, WA]');
        if (!isStr(b.coverage) || coverages.indexOf(b.coverage) < 0) return badRequest(response, 'coverage', 'coverage must be one of [LIABILITY, COLLISION, COMPREHENSIVE]');
        if (!isInt(b.driverAge) || b.driverAge < 18 || b.driverAge > 80) return badRequest(response, 'driverAge', 'driverAge must be between 18 and 80');
        if (b.priorClaims != null && typeof b.priorClaims !== 'boolean') return badRequest(response, 'priorClaims', 'priorClaims must be a boolean');
        var priorClaims = b.priorClaims === true;
        var check = Rule.execute('rating', { state: b.state, coverage: b.coverage, driverAge: b.driverAge, priorClaims: priorClaims });
        var quote = {
            id: nextId(session, 'q'),
            policyClass: priorClaims ? 'SUBSTANDARD' : (b.driverAge >= 25 && b.driverAge <= 70 ? 'PREFERRED' : 'STANDARD'),
            monthlyPremium: check.output.monthlyPremium,
            currency: 'USD'
        };
        store(session, 'quotes')[quote.id] = { state: b.state, monthlyPremium: quote.monthlyPremium };
        reply(response, 201, quote);
    };

    var bindPolicy = function (request, response, session) {
        var b = bodyOf(request);
        if (!isStr(b.quoteId)) return badRequest(response, 'quoteId', 'quoteId is required');
        if (!isStr(b.holder)) return badRequest(response, 'holder', 'holder is required');
        var quote = store(session, 'quotes')[b.quoteId];
        if (!quote) return badRequest(response, 'quoteId', 'no such quote: ' + b.quoteId);
        var policy = { id: nextId(session, 'p'), quoteId: b.quoteId, holder: b.holder, state: quote.state, monthlyPremium: quote.monthlyPremium, status: 'BOUND' };
        store(session, 'policies')[policy.id] = policy;
        reply(response, 201, policy);
    };

    var listPolicies = function (request, response, session) {
        var state = request.param('state');
        var policies = store(session, 'policies');
        var out = [];
        for (var id in policies) {
            if (!state || policies[id].state === state) out.push(copy(policies[id]));
        }
        reply(response, 200, out);
    };

    var getPolicy = function (request, response, session) {
        request.pathMatches('/policies/{id}');
        var policy = store(session, 'policies')[request.pathParams.id];
        if (!policy) return notFound(response, 'no such policy', request.pathParams.id);
        reply(response, 200, copy(policy));
    };

    var cancelPolicy = function (request, response, session) {
        request.pathMatches('/policies/{id}');
        var policy = store(session, 'policies')[request.pathParams.id];
        if (!policy) return notFound(response, 'no such policy', request.pathParams.id);
        policy.status = 'CANCELLED';
        reply(response, 204, null);
    };

    var fileClaim = function (request, response, session) {
        var b = bodyOf(request);
        if (!isStr(b.policyId)) return badRequest(response, 'policyId', 'policyId is required');
        if (!isInt(b.amount) || b.amount < 1) return badRequest(response, 'amount', 'amount must be a positive integer');
        if (!store(session, 'policies')[b.policyId]) return badRequest(response, 'policyId', 'no such policy: ' + b.policyId);
        var claim = { id: nextId(session, 'c'), policyId: b.policyId, amount: b.amount, status: 'OPEN' };
        store(session, 'claims')[claim.id] = claim;
        reply(response, 201, claim);
    };

    var getClaim = function (request, response, session) {
        request.pathMatches('/claims/{id}');
        var claim = store(session, 'claims')[request.pathParams.id];
        if (!claim) return notFound(response, 'no such claim', request.pathParams.id);
        reply(response, 200, copy(claim));
    };

    return {
        createQuote: createQuote,
        bindPolicy: bindPolicy,
        listPolicies: listPolicies,
        getPolicy: getPolicy,
        cancelPolicy: cancelPolicy,
        fileClaim: fileClaim,
        getClaim: getClaim
    };
})();
