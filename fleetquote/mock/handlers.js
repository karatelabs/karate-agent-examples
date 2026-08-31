// Stonebridge Fleet Auto - stateful quote lifecycle mock handlers.
// Served with: Http.mock({ openapi: '/openapi.yaml', port: 8090, handlers: File.call('/mock/handlers.js') })
// (see mock/start.js). Loaded by File.call in the served engine, where the 'rating'
// rulebook is bound - so pricing comes from Rule.execute and NO premium number is
// encoded here: the mock and the checks share one oracle.
//
// Test seam: POST /clock {today:'yyyy-mm-dd'} fixes "today" for every later call, so
// expiry is deterministic; without it the real date is used. It is on the wire (a
// declared operation), not a header - a driver that can only send {method, path, body}
// still reaches it. Not part of the product API.
(function () {
    var VALIDITY_DAYS = 60;

    var todayFrom = function (session) {
        return session.today ? session.today : new Date().toISOString().substring(0, 10);
    };

    // date-only strings parse as UTC midnight, so this is whole-day and DST-safe
    var daysBetween = function (a, b) {
        return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
    };

    var isExpired = function (quote, today) {
        return quote.ratingDate != null && daysBetween(quote.ratingDate, today) > VALIDITY_DAYS;
    };

    var refuse = function (response, status, error, message) {
        response.status = status;
        response.body = { error: error, message: message };
    };

    var store = function (session) {
        session.quotes = session.quotes || {};
        return session.quotes;
    };

    var rollout = function (session) {
        return session.rollout === true;
    };

    var nextId = function (session) {
        session.seq = (session.seq || 0) + 1;
        return 'Q-' + (100000 + session.seq);
    };

    var setClock = function (request, response, session) {
        var body = request.body;
        var today = body && typeof body === 'object' ? body.today : null;
        if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today) || isNaN(Date.parse(today))) {
            return refuse(response, 400, 'invalid_input', 'today must be a yyyy-mm-dd date');
        }
        session.today = today;
        response.status = 200;
        response.body = { today: today };
    };

    var getClock = function (request, response, session) {
        response.status = 200;
        response.body = { today: todayFrom(session) };
    };

    var validate = function (s) {
        var intIn = function (v, lo, hi) { return typeof v === 'number' && v === Math.floor(v) && v >= lo && v <= hi; };
        if (!s || typeof s !== 'object') return 'a submission body is required';
        if (['urban', 'suburban', 'rural'].indexOf(s.territory) < 0) return 'territory is outside its documented domain';
        if (!intIn(s.vans, 0, 25)) return 'vans is outside its documented domain';
        if (!intIn(s.lightTrucks, 0, 25)) return 'lightTrucks is outside its documented domain';
        if (!intIn(s.heavyTrucks, 0, 25)) return 'heavyTrucks is outside its documented domain';
        if (!intIn(s.avgExperience, 0, 30)) return 'avgExperience is outside its documented domain';
        if (typeof s.safetyProgram !== 'boolean') return 'safetyProgram must be a boolean';
        if (!intIn(s.claimsCount, 0, 6)) return 'claimsCount is outside its documented domain';
        if (typeof s.hazmatCargo !== 'boolean') return 'hazmatCargo must be a boolean';
        if (!intIn(s.youngestDriverAge, 18, 70)) return 'youngestDriverAge is outside its documented domain';
        if (typeof s.outOfStateOperations !== 'boolean') return 'outOfStateOperations must be a boolean';
        return null;
    };

    var submitQuote = function (request, response, session) {
        var s = request.body;
        var problem = validate(s);
        if (problem) return refuse(response, 400, 'invalid_input', problem);
        if (s.vans + s.lightTrucks + s.heavyTrucks === 0) {
            return refuse(response, 400, 'no_vehicles', 'a submission must include at least one vehicle');
        }
        var quotes = store(session);
        var quote = { id: nextId(session), status: 'submitted', submission: s, premium: null, reason: null, ratingDate: null, policyNumber: null };
        quotes[quote.id] = quote;
        response.status = 201;
        response.body = quote;
    };

    var getQuote = function (request, response, session) {
        request.pathMatches('/quotes/{id}');
        var quote = store(session)[request.pathParams.id];
        if (!quote) return refuse(response, 404, 'not_found', 'unknown quote');
        response.status = 200;
        response.body = quote;
    };

    var rateQuote = function (request, response, session) {
        request.pathMatches('/quotes/{id}/rate');
        var quote = store(session)[request.pathParams.id];
        if (!quote) return refuse(response, 404, 'not_found', 'unknown quote');
        if (quote.status === 'declined') return refuse(response, 409, 'declined_terminal', 'a declined quote is terminal - it cannot be re-rated');
        if (quote.status === 'bound') return refuse(response, 409, 'already_bound', 'a bound quote is no longer re-rated');
        // the rulebook is the ONLY source of pricing and routing
        var check = Rule.execute('rating', quote.submission);
        quote.premium = check.output.premium;
        quote.reason = check.output.reason;
        quote.status = check.outcome;
        quote.ratingDate = check.outcome === 'declined' ? null : todayFrom(session);
        quote.policyNumber = null;
        response.status = 200;
        response.body = quote;
    };

    var approveQuote = function (request, response, session) {
        request.pathMatches('/quotes/{id}/approve');
        var quote = store(session)[request.pathParams.id];
        if (!quote) return refuse(response, 404, 'not_found', 'unknown quote');
        if (quote.status !== 'referred') return refuse(response, 409, 'not_referred', 'only a referred quote can be approved');
        if (isExpired(quote, todayFrom(session))) return refuse(response, 409, 'quote_expired', 'quote expired - re-rate before any further action');
        quote.status = 'approved';  // approval never changes the premium
        response.status = 200;
        response.body = quote;
    };

    var bindQuote = function (request, response, session) {
        request.pathMatches('/quotes/{id}/bind');
        var quote = store(session)[request.pathParams.id];
        if (!quote) return refuse(response, 404, 'not_found', 'unknown quote');
        if (quote.status === 'submitted') return refuse(response, 409, 'not_rated', 'only a rated quote may be bound');
        if (quote.status === 'declined') return refuse(response, 409, 'declined_terminal', 'a declined quote cannot be bound');
        if (quote.status === 'bound') return refuse(response, 409, 'already_bound', 'a quote that is already bound cannot be bound again');
        var cleared = rollout(session) && quote.status === 'approved';
        if (!cleared && isExpired(quote, todayFrom(session))) return refuse(response, 409, 'quote_expired', 'quote expired - re-rate before any further action');
        if (quote.status === 'referred') return refuse(response, 409, 'approval_required', 'a referred quote may be bound only after underwriter approval');
        quote.status = 'bound';
        quote.policyNumber = 'POL-' + quote.id.substring(2);
        response.status = 200;
        response.body = quote;
    };

    return {
        setClock: setClock,
        getClock: getClock,
        submitQuote: submitQuote,
        getQuote: getQuote,
        rateQuote: rateQuote,
        approveQuote: approveQuote,
        bindQuote: bindQuote
    };
})();
