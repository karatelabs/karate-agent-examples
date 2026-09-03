# Stonebridge Fleet Auto — Requirements

Source: "Stonebridge Fleet Auto — Underwriting & Rating Guide (extract)", Meridian Underwriters,
Commercial Lines (`SOT-prose.md`). Section numbers point at that guide.

## SFA: Stonebridge Fleet Auto
@type=epic @status=approved
The system shall quote, rate and bind commercial vehicle fleets as a single submission with one premium and one policy (section 1).

### FLEET-001: Submission intake
@type=req @status=approved @criticality=high @priority=p1
The system shall accept fleet quote submissions carrying exactly the documented data points (section 2).

**Acceptance:**
- WHEN a submission with every documented field inside its documented value domain is received THE SYSTEM SHALL record it as a quote awaiting rating and return its identifier
- IF a submission includes no vehicles THEN THE SYSTEM SHALL reject it as invalid input without pricing it
- IF any submitted field value is outside its documented domain THEN THE SYSTEM SHALL reject the submission as invalid input

### FLEET-002: Acceptability exclusions
@type=req @status=approved @criticality=high @priority=p1
The system shall assess exclusions before any rating arithmetic (section 3).

**Acceptance:**
- WHEN rating a fleet whose youngest listed driver is aged 23 or younger THE SYSTEM SHALL decline the quote
- WHEN rating a fleet with regular operations outside the state of registration THE SYSTEM SHALL decline the quote
- IF a quote is declined THEN THE SYSTEM SHALL record no premium for it
- WHEN rating a fleet whose youngest listed driver is older than 23 THE SYSTEM SHALL assess the out-of-state exclusion instead of declining for driver age

### FLEET-003: Fleet base premium
@type=req @status=approved @criticality=high @priority=p1
The system shall compute the fleet base premium from per-vehicle class rates (section 4.1, section 4.2).

**Acceptance:**
- THE SYSTEM SHALL price each vehicle at its class base premium of $610 for a cargo van, $780 for a light truck and $1,250 for a heavy truck
- THE SYSTEM SHALL multiply each vehicle's base premium by the territory relativity for its class and garaging territory per the section 4.2 table
- THE SYSTEM SHALL compute the fleet base premium as the sum over all vehicles of class base premium times territory relativity

### FLEET-004: Driver experience adjustment
@type=req @status=approved @criticality=medium @priority=p2
The system shall adjust the fleet base premium for average driver experience (section 4.3).

**Acceptance:**
- WHEN average driver experience is 2 years or fewer THE SYSTEM SHALL multiply the fleet base premium by 1.15
- WHEN average driver experience is more than 8 years THE SYSTEM SHALL multiply the fleet base premium by 0.8
- WHILE average driver experience is between 3 and 8 years THE SYSTEM SHALL apply no experience adjustment

### FLEET-005: Premium reductions
@type=req @status=approved @criticality=medium @priority=p2
The system shall reduce the premium through percentage credits that stack additively (section 4.4).

**Acceptance:**
- WHEN the fleet has 7 or more vehicles THE SYSTEM SHALL apply an 11% fleet-size discount
- WHEN the fleet has a recognized safety program THE SYSTEM SHALL apply a 15% safety-program credit
- WHERE a fleet earns both reductions THE SYSTEM SHALL stack them additively to a 26% total reduction

### FLEET-006: Claims surcharge
@type=req @status=approved @criticality=high @priority=p1
The system shall surcharge the premium for chargeable claims (section 4.5).

**Acceptance:**
- WHEN the fleet has chargeable claims in the last three years THE SYSTEM SHALL add a 17% surcharge per claim
- THE SYSTEM SHALL cap the total claims surcharge at 60%
- THE SYSTEM SHALL compute the surcharge percentage on the premium before any credits or discounts and add the resulting amount to the credited premium

### FLEET-007: Minimum premium
@type=req @status=approved @criticality=medium @priority=p2
The system shall enforce the minimum policy premium (section 4.6).

**Acceptance:**
- IF the computed premium is below $390 THEN THE SYSTEM SHALL raise the final premium to $390

### FLEET-008: Premium rounding
@type=req @status=approved @criticality=medium @priority=p2
The system shall apply rating factors without intermediate rounding (section 4.6).

**Acceptance:**
- THE SYSTEM SHALL round only the final premium, to the nearest cent

### FLEET-009: Referral to underwriting
@type=req @status=approved @criticality=high @priority=p1
The system shall refer high-premium quotes for underwriter approval (section 4.7).

**Acceptance:**
- WHEN the final premium exceeds $29,000 THE SYSTEM SHALL mark the quote referred so that it is priced but requires underwriter approval before binding
- WHEN the final premium is $29,000 or less THE SYSTEM SHALL mark the quote rated without referring it for underwriter approval

### FLEET-010: Quote lifecycle
@type=req @status=approved @criticality=high @priority=p1
The system shall administer each quote through the documented lifecycle (section 5).

**Acceptance:**
- WHEN a submission is received THE SYSTEM SHALL record it as awaiting rating
- WHEN a quote is rated THE SYSTEM SHALL price it per the rating rules and stamp the quote with the rating date
- IF a quote is declined THEN THE SYSTEM SHALL refuse any further rating or binding of that quote
- IF more than 60 days have passed since a quote's rating date THEN THE SYSTEM SHALL treat the quote as expired and refuse any further action until it is re-rated
- WHEN a referred quote is approved THE SYSTEM SHALL clear it for binding with the premium unchanged
- IF a referred quote has not been approved THEN THE SYSTEM SHALL refuse to bind it
- WHEN a rated unexpired quote is bound THE SYSTEM SHALL issue the policy
- IF a quote is already bound THEN THE SYSTEM SHALL refuse any further binding or re-rating of that quote
