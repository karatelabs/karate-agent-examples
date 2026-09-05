// Stonebridge Fleet Auto - quote lifecycle (SOT-prose section 5), as a behaviour model.
// States and commands are named exactly as the customer names them.

var VALIDITY_DAYS = 60;                 // section 5.3 - 60 days from the rating date
var LIVE_STATUSES = ['QUOTED', 'REFERRED', 'APPROVED'];

// EXPIRED is derived, not stored: validity runs from the rating date (FLEET-OQ-004 working
// assumption - still valid on day 60 exactly, expired from day 61).
function isExpired(w) {
    return w.ratedOn !== null
        && LIVE_STATUSES.indexOf(w.status) >= 0
        && (w.day - w.ratedOn) > VALIDITY_DAYS;
}

// section 2 value domains (FLEET-001/3, FLEET-OQ-003 working assumption - reject, never clamp)
function inDomain(s) {
    return ['urban', 'suburban', 'rural'].indexOf(s.territory) >= 0
        && s.vans >= 0 && s.vans <= 25
        && s.lightTrucks >= 0 && s.lightTrucks <= 25
        && s.heavyTrucks >= 0 && s.heavyTrucks <= 25
        && s.avgExperience >= 0 && s.avgExperience <= 30
        && s.claimsCount >= 0 && s.claimsCount <= 6
        && s.youngestDriverAge >= 18 && s.youngestDriverAge <= 70;
}

function submissionOf(a) {
    return {
        territory: a.territory, vans: a.vans, lightTrucks: a.lightTrucks,
        heavyTrucks: a.heavyTrucks, avgExperience: a.avgExperience,
        safetyProgram: a.safetyProgram, claimsCount: a.claimsCount,
        hazmatCargo: a.hazmatCargo, youngestDriverAge: a.youngestDriverAge,
        outOfStateOperations: a.outOfStateOperations
    };
}

// ---- live protocol (read only by Twin.live) ----------------------------------
// The clock is an integer day in the model and a yyyy-mm-dd date on the wire.
// Day 0 is 2026-01-01; the reset request puts the service back on day 0.
var DATE = { 0: '2026-01-01', 60: '2026-03-02', 61: '2026-03-03', 200: '2026-07-20' };
var DAY = { '2026-01-01': 0, '2026-03-02': 60, '2026-03-03': 61, '2026-07-20': 200 };

// wire status -> the model's stored status. The wire has no expired status:
// expiry is derived there too, from ratingDate against the observation date.
var STATUS = {
    submitted: 'SUBMITTED', rated: 'QUOTED', referred: 'REFERRED',
    approved: 'APPROVED', declined: 'DECLINED', bound: 'BOUND'
};

// The model's own refusal reasons, at the granularity the operation can be told apart on
// the wire. approve exposes one refusal code, so the model declares one approve reason and the
// row grades on the refusal itself, not on wording. A code with no entry yields no reason,
// which explains no candidate.
var NO_VEHICLES = 'a submission with no vehicles at all is not a quotable risk and must be rejected as invalid input';
var OUT_OF_DOMAIN = 'a submitted field value is outside its documented domain - rejected as invalid input';
var RATE_DECLINED = 'a declined quote is terminal - it cannot be re-rated';
var RATE_BOUND = 'a bound quote is no longer re-rated';
var APPROVE_REFUSED = 'approve is refused - the quote is not a referred quote awaiting approval';
var BIND_NOT_RATED = 'only a rated, unexpired quote may be bound - this quote has not been rated';
var BIND_DECLINED = 'a declined quote is terminal - it cannot be bound';
var BIND_APPROVAL = 'a referred quote may be bound only after approval';
var BIND_ALREADY = 'a quote that is already bound cannot be bound again';
var BIND_EXPIRED = 'the quote is expired and must be re-rated before any further action';
// with nothing submitted there is no quote to address, and the service answers 404 not_found -
// a declared error status, so the observer classifies it as the refusal it is
var NOTHING_SUBMITTED = 'nothing has been submitted yet';

var WIRE = {
    submit: { no_vehicles: NO_VEHICLES, invalid_input: OUT_OF_DOMAIN },
    rate: { not_found: NOTHING_SUBMITTED, declined_terminal: RATE_DECLINED, already_bound: RATE_BOUND },
    approve: { not_found: NOTHING_SUBMITTED, any: APPROVE_REFUSED },
    bind: {
        not_found: NOTHING_SUBMITTED, not_rated: BIND_NOT_RATED, declined_terminal: BIND_DECLINED,
        approval_required: BIND_APPROVAL, already_bound: BIND_ALREADY,
        quote_expired: BIND_EXPIRED
    }
};

function refusalOf(command, r) {
    var m = WIRE[command];
    var code = (r.body && r.body.error) || '';
    return { kind: 'refused', reason: m[code] || m.any };
}

t.init(function (w) {
    w.status = 'NEW';
    w.premium = null;
    w.reason = null;
    w.ratedOn = null;
    w.day = 0;
    w.submission = null;
    w.quoteId = null;
});

t.reset(function (w) {
    return { method: 'POST', path: '/clock', body: { today: DATE[0] } };
});

t.readBack({
    request: function (w) {
        return { method: 'GET', path: '/quotes/' + (w.quoteId === null ? 'none' : w.quoteId) };
    },
    observe: function (r) {
        if (r.status !== 200) {
            return { status: 'NEW', premium: null };
        }
        var o = { status: STATUS[r.body.status], premium: r.body.premium };
        // ratingDate is the model's ratedOn on the wire - the validity anchor every expiry runs
        // from. Only a live quote carries one: a declined quote nulls it where the model keeps
        // the day it rated, so the field is compared where the wire states it, never required.
        if (r.body.ratingDate != null) {
            var day = DAY[r.body.ratingDate];
            o.ratedOn = day === undefined ? r.body.ratingDate : day;
        }
        return o;
    },
    required: ['status', 'premium'],
    oracle: ['premium']
});

t.clock('day');

t.state('NEW', function (w) { return w.status === 'NEW'; });
t.state('SUBMITTED', function (w) { return w.status === 'SUBMITTED'; });
t.state('QUOTED', function (w) { return w.status === 'QUOTED' && !isExpired(w); });
t.state('REFERRED', function (w) { return w.status === 'REFERRED' && !isExpired(w); });
t.state('APPROVED', function (w) { return w.status === 'APPROVED' && !isExpired(w); });
t.state('DECLINED', function (w) { return w.status === 'DECLINED'; });
t.state('EXPIRED', function (w) { return isExpired(w); });
t.state('BOUND', function (w) { return w.status === 'BOUND'; });

// One indivisible row per submission shape - the rating outcome each one drives is in its label.
// The guard is a scope guard: the model holds one quote, and POST /quotes creates unconditionally,
// so the world it rejects is one no request can put the service in.
t.command('submit', {
    when: function (w) { return w.status === 'NEW'; },
    scopeGuard: true,
    args: [
        { label: 'rated', territory: 'suburban', vans: 1, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 30, outOfStateOperations: false },
        { label: 'referred', territory: 'urban', vans: 0, lightTrucks: 0, heavyTrucks: 20, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false },
        { label: 'declined-young-driver', territory: 'suburban', vans: 2, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 23, outOfStateOperations: false },
        { label: 'declined-out-of-state', territory: 'rural', vans: 2, lightTrucks: 1, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 45, outOfStateOperations: true },
        { label: 'no-vehicles', territory: 'suburban', vans: 0, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false },
        { label: 'out-of-domain', territory: 'suburban', vans: 30, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false }
    ],
    apply: function (w, a) {
        if (a.vans + a.lightTrucks + a.heavyTrucks === 0) {
            t.reject(NO_VEHICLES);
        }
        if (!inDomain(a)) {
            t.reject(OUT_OF_DOMAIN);
        }
        w.submission = submissionOf(a);
        w.status = 'SUBMITTED';
    },
    then: function (before, after) { return after.premium === null; },
    req: 'FLEET-010/1',
    request: function (w, a) {
        return { method: 'POST', path: '/quotes', body: submissionOf(a) };
    },
    observe: function (r) {
        if (r.status === 201) { return { kind: 'applied' }; }
        if (r.status === 400) { return refusalOf('submit', r); }
        return { kind: 'unknown' };
    },
    captures: ['quoteId'],
    capture: function (w, r) { w.quoteId = r.body.id; }
});

t.command('rate', {
    when: function (w) { return w.status !== 'NEW'; },
    apply: function (w) {
        if (w.status === 'DECLINED') {
            t.reject(RATE_DECLINED);
        }
        if (w.status === 'BOUND') {
            t.reject(RATE_BOUND);
        }
        var r = t.calc(w.submission);
        w.ratedOn = w.day;
        if (r.outcome === 'declined') {
            w.status = 'DECLINED';
            w.premium = null;
            w.reason = r.output.reason;
        } else {
            w.premium = r.output.premium;
            w.reason = null;
            w.status = r.outcome === 'referred' ? 'REFERRED' : 'QUOTED';
        }
    },
    then: function (before, after) {
        return after.status === 'DECLINED' ? after.premium === null : true;
    },
    req: 'FLEET-010/2',
    request: function (w) {
        return { method: 'POST', path: '/quotes/' + w.quoteId + '/rate' };
    },
    observe: function (r) {
        if (r.status === 200) { return { kind: 'applied' }; }
        if (r.status === 409 || r.status === 404) { return refusalOf('rate', r); }
        return { kind: 'unknown' };
    },
    refusals: { guard: NOTHING_SUBMITTED }
});

t.command('approve', {
    when: function (w) { return w.status !== 'NEW'; },
    apply: function (w) {
        // refused when the quote is not a referred quote awaiting approval - expired included,
        // since expiry stops any further action until the quote is re-rated (FLEET-010).
        if (isExpired(w) || w.status !== 'REFERRED') {
            t.reject(APPROVE_REFUSED);
        }
        w.status = 'APPROVED';
    },
    // section 5.4 - approval does not change the premium
    then: function (before, after) { return after.premium === before.premium; },
    req: 'FLEET-010/5',
    request: function (w) {
        return { method: 'POST', path: '/quotes/' + w.quoteId + '/approve' };
    },
    observe: function (r) {
        if (r.status === 200) { return { kind: 'applied' }; }
        if (r.status === 409 || r.status === 404) { return refusalOf('approve', r); }
        return { kind: 'unknown' };
    },
    refusals: { guard: NOTHING_SUBMITTED }
});

t.command('bind', {
    when: function (w) { return w.status !== 'NEW'; },
    apply: function (w) {
        if (w.status === 'DECLINED') { t.reject(BIND_DECLINED); }
        if (w.status === 'BOUND') { t.reject(BIND_ALREADY); }
        if (w.status === 'SUBMITTED') { t.reject(BIND_NOT_RATED); }
        // approval does not survive expiry - validity runs from the rating date, so an
        // APPROVED-then-expired quote is refused here exactly as a QUOTED-then-expired one is.
        if (isExpired(w)) { t.reject(BIND_EXPIRED); }
        if (w.status === 'REFERRED') { t.reject(BIND_APPROVAL); }
        w.status = 'BOUND';
    },
    then: function (before, after) {
        return after.status !== 'BOUND' || after.premium > 0;
    },
    req: 'FLEET-010/7',
    request: function (w) {
        return { method: 'POST', path: '/quotes/' + w.quoteId + '/bind' };
    },
    observe: function (r) {
        if (r.status === 200) { return { kind: 'applied' }; }
        if (r.status === 409 || r.status === 404) { return refusalOf('bind', r); }
        return { kind: 'unknown' };
    },
    refusals: { guard: NOTHING_SUBMITTED }
});

// Not a user action - the passage of time. Only this command carries the clock field.
t.command('observeAsOf', {
    args: function (a) { a.enum('day', [0, 60, 61, 200]); },
    apply: function () { },
    req: 'FLEET-010/4',
    request: function (w, a) {
        return { method: 'POST', path: '/clock', body: { today: DATE[a.day] } };
    },
    observe: function (r) {
        return r.status === 200 ? { kind: 'applied' } : { kind: 'unknown' };
    }
});

t.always('a declined quote records no premium', function (w) {
    return w.status !== 'DECLINED' || w.premium === null;
});
t.always('a priced quote is never below the minimum premium', function (w) {
    return w.premium === null || w.premium >= 390;
});
t.always('a bound quote carries a premium', function (w) {
    return w.status !== 'BOUND' || (w.premium !== null && w.premium > 0);
});
