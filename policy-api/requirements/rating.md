# Auto Rating — Requirements

> The business requirements the `rating` rulebook realizes. Each acceptance criterion is linked from a
> `calc.req('RATE-…')` arm in `rulebooks/rating/calc.js`, so `Rule.cover` projects a run-free rules-only
> RTM: positive evidence the rules satisfy these criteria, with no live test run. A criterion
> whose rule arm no saved scenario exercises stays uncovered — the `Rule.check` `notused` finding and the
> readiness gap are the same fact seen twice.

## RATE: Auto policy rating
@type=feature

### RATE-001: Age-based rating
@status=approved @priority=p1 @criticality=high
The system **shall** load the premium for drivers whose age carries higher risk.

**Acceptance:**
- 1: WHEN the driver is under 25 THE SYSTEM SHALL apply a young-driver loading
- 2: WHEN the driver is over 70 THE SYSTEM SHALL apply a senior-driver loading

### RATE-002: Prior-claims surcharge
@status=approved @priority=p2 @criticality=medium
The system **shall** surcharge a driver with a history of prior claims.

**Acceptance:**
- 1: WHEN the driver has prior claims THE SYSTEM SHALL add a prior-claims surcharge

### RATE-003: Territory rating
@status=approved @priority=p2 @criticality=medium
The system **shall** adjust the premium by the state rating territory.

**Acceptance:**
- 1: THE SYSTEM SHALL apply the territory factor for the quoted state
