@ignore
Feature: Payments API mock — the test-double for a dependency this team does NOT own

  # This is the CONSUMER side of contract testing: the checkout service (the SUT) calls a payments API
  # owned by someone else, and this mock is what the checkout team builds and tests against day to day.
  # It is not scenery — it is the subject of the paired run in contract.karate.js
  # (Contract.pair({mock:'mock/payments-mock.feature', provider:<the real payments service>})), which is
  # what keeps "our mock of their API" honest: a test-double that cannot simulate the behaviors in scope
  # is exactly what a contract test exists to catch.
  #
  # KNOWN, DELIBERATE framing difference kept for the demo: this mock reports the card network in UPPER
  # case ('VISA'), the real provider reports it lower-case ('visa'). checks/payments-contract.feature never
  # asserts on `network`, so both legs pass — and the pair still reports it, as an `unassertedDivergence`:
  # a finding about the SUITE (its assertions are too loose to see the difference), which no green build
  # can produce on its own. See the README's "the finding your assertions cannot see".

  Background:
    # NO java interop — mock helpers stay pure JS (the mock engine's Java bridge is off by default, and a
    # `#(uuid())` that throws goes out on the wire as data). Each implementation mints its own surrogate
    # ids: this one counts 'pay-1', 'ref-1'; the Java provider counts 'p-1001', 'r-2001'. The contract
    # fixes the TYPE, never the value — the paired run excuses the difference through the named ignore
    # rules in contract.karate.js, on the record, instead of both sides secretly agreeing on a counter.
    * def paySeq = 0
    * def refSeq = 0
    * def nextPayId = function(){ paySeq = paySeq + 1; return 'pay-' + paySeq }
    * def nextRefId = function(){ refSeq = refSeq + 1; return 'ref-' + refSeq }
    * def payments = {}
    * def refundsByPayment = {}
    # TYPES ARE PART OF THE CONTRACT: "100" is not 100 to the Java provider, so it may not be to this mock
    # either — a stand-in that is looser than the real thing teaches its consumer to ship a bug.
    * def isStr = function(v){ return typeof v == 'string' && v.trim() != '' }
    # int32, exactly like the Java provider: a JS number is a double, so without the range guard this
    # mock would approve an amount the provider's 32-bit reader refuses — an undocumented divergence
    * def isInt = function(v){ return typeof v == 'number' && v == Math.floor(v) && v <= 2147483647 && v >= -2147483648 }
    * def orEmpty = function(r){ return r == null ? {} : r }
    * def badRequest = function(field, message){ return { error: message, field: field } }
    # both implementations share the BUSINESS RULES (the decline threshold, the network derivation) —
    # where they differ is framing and identifiers, which is what a paired run is for
    * def declined = function(amount){ return amount > 50000 }
    * def networkOf = function(number){ return number.charAt(0) == '4' ? 'VISA' : 'MASTERCARD' }
    * def paymentError =
    """
    function(b) {
      if (!isInt(b.amount) || b.amount < 1) return badRequest('amount', 'amount must be a positive integer (cents)');
      if (b.currency != 'USD') return badRequest('currency', 'currency must be USD');
      if (!b.card || !isStr(b.card.number)) return badRequest('card.number', 'card.number is required');
      if (!b.card || !isStr(b.card.expiry)) return badRequest('card.expiry', 'card.expiry is required');
      return null;
    }
    """
    * def paymentFor =
    """
    function(b) {
      var p = { id: nextPayId(), status: declined(b.amount) ? 'declined' : 'approved',
                amount: b.amount, currency: b.currency, network: networkOf(b.card.number) };
      payments[p.id] = p;
      return p;
    }
    """
    # ALL state changes live in this one function (a scenario-level `eval` is where a mock's mutation
    # quietly fails to stick) — refund-once, the 409 on the second attempt, and the payment flipping to
    # 'refunded' so the read-back agrees with the Java provider
    * def doRefund =
    """
    function(id) {
      var found = payments[id];
      if (!found) return { status: 404, body: { error: 'no such payment', field: 'id' } };
      if (refundsByPayment[id]) return { status: 409, body: { error: 'payment already refunded', field: 'id' } };
      var r = { id: nextRefId(), paymentId: id, status: 'refunded' };
      refundsByPayment[id] = r;
      found.status = 'refunded';
      return { status: 201, body: r };
    }
    """

  Scenario: pathMatches('/payments') && methodIs('post')
    * def req = orEmpty(request)
    * def bad = paymentError(req)
    * def responseStatus = bad ? 400 : 201
    * def response = bad ? bad : paymentFor(req)

  Scenario: pathMatches('/payments/{id}/refund') && methodIs('post')
    * def result = doRefund(pathParams.id)
    * def responseStatus = result.status
    * def response = result.body

  Scenario: pathMatches('/payments/{id}') && methodIs('get')
    * def found = payments[pathParams.id]
    * def responseStatus = found ? 200 : 404
    * def response = found ? found : { error: 'no such payment', field: 'id' }
