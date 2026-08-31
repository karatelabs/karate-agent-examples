# Stonebridge Fleet Auto — Open Questions for the Product Owner

The underwriting guide (`SOT-prose.md`) says questions on intent must go to the product owner rather
than be resolved silently. Each item below is prose the implementation could not encode without an
answer, held as a draft requirement so it stays visible in the requirements matrix until resolved.
Where the build needed a working assumption, the assumption is stated in the body and must be
confirmed or corrected.

## FLEET-OQ: Open product-owner questions
@type=feature @status=draft
The system shall resolve each open underwriting question below with the product owner before release.

### FLEET-OQ-001: Hazmat cargo effect
@type=req @status=draft @criticality=high
The intake dictionary (section 2) collects `hazmatCargo`, but no exclusion (section 3) and no rating step (section 4) consumes it. Working assumption: hazmat cargo has no effect on acceptability or premium. Confirmation needed — collecting a hazard flag with no rule attached looks like an omission.

**Acceptance:**
- WHEN the product owner defines the intended effect of hazmat cargo THE SYSTEM SHALL apply the confirmed hazmat treatment to acceptability and rating

### FLEET-OQ-002: Driver-training consideration
@type=req @status=draft @criticality=low
section 4.7 states fleets with a demonstrated commitment to driver training "may qualify for additional consideration at the underwriter's discretion". There is no intake data point for driver training and no defined effect, so nothing was encoded.

**Acceptance:**
- WHEN the product owner defines the driver-training consideration THE SYSTEM SHALL apply the confirmed treatment during underwriting

### FLEET-OQ-003: Out-of-domain field handling
@type=req @status=draft @criticality=medium
section 2 documents a value domain for every field but only specifies rejection for the no-vehicles case. Working assumption (encoded in FLEET-001/3): any out-of-domain value rejects the submission as invalid input rather than being clamped or priced.

**Acceptance:**
- WHEN the product owner confirms how out-of-domain submissions are handled THE SYSTEM SHALL apply the confirmed behavior in place of the assumed rejection

### FLEET-OQ-004: Expiry boundary day
@type=req @status=draft @criticality=low
section 5.3 says a rated quote "is valid for 60 days from its rating date". Working assumption: the quote is still bindable on day 60 exactly and expired from day 61 onward.

**Acceptance:**
- WHEN the product owner confirms the last valid day THE SYSTEM SHALL enforce the confirmed expiry boundary

### FLEET-OQ-005: Approval of a non-referred quote
@type=req @status=draft @criticality=low
section 5.4 defines approval only for referred quotes. Working assumption: an approval request against a quote that is not in the referred state is refused as a conflict.

**Acceptance:**
- WHEN the product owner confirms handling of approval on a non-referred quote THE SYSTEM SHALL apply the confirmed behavior

### FLEET-OQ-006: Re-rating an unexpired quote
@type=req @status=draft @criticality=low
section 5 forbids re-rating only for declined and bound quotes and requires it for expired ones. Working assumption: a rated, referred or approved quote may be re-rated at any time, which re-prices it and stamps a new rating date (an approved quote returning to referred if still over the threshold).

**Acceptance:**
- WHEN the product owner confirms re-rating rules for unexpired quotes THE SYSTEM SHALL enforce the confirmed re-rating policy
