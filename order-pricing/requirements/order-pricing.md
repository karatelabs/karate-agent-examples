# Order Pricing — Requirements

> The business requirements the `order-pricing` rulebook realizes. Each acceptance criterion is
> linked from a `calc.req('ORD-PRICE-…')` arm in `calc.js`, so `Rule.cover` projects a run-free
> rules-only RTM: real evidence the rules satisfy these criteria, without a live test run.

## ORD-PRICE: Order pricing & approval
@type=feature

### ORD-PRICE-001: Volume discount
@status=approved @priority=p2 @criticality=medium
The system **shall** reward larger orders with a volume discount.

**Acceptance:**
- 1: WHEN the total quantity reaches a volume tier THE SYSTEM SHALL apply that tier's discount

### ORD-PRICE-002: Rush surcharge
@status=approved @priority=p2 @criticality=medium
The system **shall** apply a surcharge to orders marked rush.

**Acceptance:**
- 1: WHEN an order is marked rush THE SYSTEM SHALL add a rush surcharge

### ORD-PRICE-003: Approval routing
@status=approved @priority=p1 @criticality=high
The system **shall** route large quotes to a human and auto-approve ordinary ones.

**Acceptance:**
- 1: WHEN the quote total exceeds the approval threshold THE SYSTEM SHALL route it to manual approval
- 2: WHEN the quote total is within the threshold THE SYSTEM SHALL auto-approve it
