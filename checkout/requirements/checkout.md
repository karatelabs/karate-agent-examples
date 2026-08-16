# Checkout — Requirements

> The business requirements of a service that cannot do its job alone: checkout depends on an external
> payments API. CHK-* govern the checkout flows; PAY-* pin down exactly what this team relies on the
> payments dependency for — which is why the same PAY-* criteria are claimed by
> `checks/payments-contract.feature`, the suite the paired run uses to prove the payments mock can stand
> in for the real provider. A dependency expectation nobody wrote down is one nobody can verify a mock
> against.

## CHK: Order checkout
@type=feature

### CHK-001: Confirmed orders carry their payment
@status=approved @priority=p1 @criticality=high
When a customer places an order and the payment is approved, the system **shall** confirm the order and
record the payment reference.

**Acceptance:**
- 1: WHEN the payments provider approves the charge THE SYSTEM SHALL record the order as CONFIRMED with the provider's payment id
- 2: WHEN the payments provider refuses the request as invalid THE SYSTEM SHALL refuse the order and surface the provider's reason

### CHK-002: A declined payment is an outcome, not an error
@status=approved @priority=p1 @criticality=high
When the payments provider declines a payment, the system **shall** record the order as payment-declined
rather than confirmed — and never lose the order.

**Acceptance:**
- 1: WHEN the payments provider declines the charge THE SYSTEM SHALL record the order as PAYMENT_DECLINED with the payment id

## PAY: The payments dependency — what checkout relies on
@type=feature

### PAY-001: Charging a card
@status=approved @priority=p1 @criticality=high
The payments dependency **shall** decide every well-formed charge — approved or declined — and refuse a
malformed one naming the offending field.

**Acceptance:**
- 1: WHEN a valid charge within the limit is submitted THE PROVIDER SHALL answer approved, echoing the amount exactly
- 2: WHEN a valid charge over the limit is submitted THE PROVIDER SHALL answer declined as a decision, not an error
- 3: WHEN a malformed charge is submitted THE PROVIDER SHALL refuse it naming the field

### PAY-002: Reading a payment back
@status=approved @priority=p2 @criticality=medium
The payments dependency **shall** return any payment by the id it minted, and answer honestly for an id
it never minted.

**Acceptance:**
- 1: WHEN a payment id the provider minted is read THE PROVIDER SHALL return that payment
- 2: WHEN an unknown payment id is read THE PROVIDER SHALL answer 404 with a readable error

### PAY-003: Refund-once
@status=approved @priority=p1 @criticality=high
The payments dependency **shall** refund a captured payment exactly once.

**Acceptance:**
- 1: WHEN a refund is requested twice for one payment THE PROVIDER SHALL perform the first and refuse the second as a conflict
