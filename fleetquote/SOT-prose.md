# Stonebridge Fleet Auto — Underwriting & Rating Guide (extract)

*Prepared by Meridian Underwriters, Commercial Lines. For system implementation.*

This document describes how Stonebridge Fleet Auto quotes are to be rated and administered. It reflects
current underwriting practice as approved by the product committee. The implementation team should
treat this document as the source of truth; where practice is unclear, questions should come back to
the product owner rather than be resolved silently.

## 1. The product

Stonebridge Fleet Auto covers commercial vehicle fleets — cargo vans, light trucks (under 26,000 lbs GVWR)
and heavy trucks — operated within the state of registration. A fleet is quoted as a whole: one
submission, one premium, one policy. Quotes move through a simple lifecycle: a submission is
received, the fleet is rated, and an acceptable quote is bound by the customer.

## 2. Quote submissions — the data dictionary

Every submission carries exactly these data points (field identifiers in parentheses are the ones
our intake forms and downstream systems use):

| Data point | Field | Values |
|---|---|---|
| Garaging territory | `territory` | `urban`, `suburban`, `rural` |
| Number of cargo vans | `vans` | 0–25 |
| Number of light trucks | `lightTrucks` | 0–25 |
| Number of heavy trucks | `heavyTrucks` | 0–25 |
| Average driver experience, years | `avgExperience` | 0–30 (whole years) |
| Recognized safety program in place | `safetyProgram` | true / false |
| Chargeable claims, last 3 years | `claimsCount` | 0–6 |
| Hazmat cargo carried | `hazmatCargo` | true / false |
| Age of youngest listed driver | `youngestDriverAge` | 18–70 |
| Regular out-of-state operations | `outOfStateOperations` | true / false |

A submission must include at least one vehicle. A submission with no vehicles at all is not a
quotable risk and should be rejected as invalid input rather than priced.

## 3. Acceptability — exclusions come first

Exclusions are assessed before any rating arithmetic. An excluded risk is **declined** regardless of
any other provision in this guide — a declined submission has no premium.

- Any fleet whose youngest listed driver is aged 23 or younger is not acceptable and must be declined.
- Fleets with regular operations outside the state of registration are not acceptable and must be declined.

## 4. Rating

### 4.1 Base premium per vehicle

The annual base premium per vehicle, by class:

| Vehicle class | Base premium |
|---|---|
| Cargo van | $610 |
| Light truck | $780 |
| Heavy truck | $1,250 |

### 4.2 Territory relativity

Each vehicle's base premium is multiplied by the territory relativity for its class:

| Class | Urban | Suburban | Rural |
|---|---|---|---|
| Cargo van | 1.25 | 1 | 0.8 |
| Light truck | 1.15 | 0.95 | 0.8 |
| Heavy truck | 1.35 | 1 | 0.85 |

The fleet base premium is the sum over all vehicles of (class base premium × territory relativity).

### 4.3 Driver experience

The fleet base premium is then adjusted for average driver experience:

- 2 years or fewer: multiply by 1.15
- more than 8 years: multiply by 0.8
- otherwise: no adjustment

### 4.4 Credits and discounts

- **Fleet-size discount.** Fleets of 7 or more vehicles receive a 11% discount.
- **Safety-program credit.** Fleets with a recognized safety program receive a 15% credit.

Credits and discounts are percentage reductions and stack additively (a fleet earning both is
reduced by 26%).

### 4.5 Claims surcharge

Each chargeable claim in the last three years adds a 17% surcharge, up to a maximum
surcharge of 60%. The surcharge percentage is computed on the premium before any credits or discounts are applied, and the resulting surcharge amount is then added to the credited premium.

### 4.6 Minimum premium and rounding

No policy is issued for less than $390; a computed premium below this amount is
raised to it. Factors are applied without intermediate rounding; the final premium is rounded to
the nearest cent.

### 4.7 Referral to underwriting

A quote whose final premium exceeds $29,000 is **referred**: it is priced, but an
underwriter must approve it before it can be bound. Referral is a routing outcome, not a decline.

Fleets with a demonstrated commitment to driver training may qualify for additional consideration at the underwriter’s discretion.

## 5. Quote lifecycle


1. **Submission.** A received submission is recorded and awaits rating.
2. **Rating.** Rating prices the submission per section 4 and stamps the quote with the rating
   date. Rating an excluded risk records the decline. A declined quote is terminal — it cannot be
   re-rated or bound.
3. **Validity.** A rated quote is valid for 60 days from its rating date. After that
   it is expired and must be re-rated before any further action.
4. **Approval.** A referred quote requires underwriter approval. Approval does not change the
   premium; it clears the quote for binding.
5. **Binding.** Binding issues the policy. Only a rated, unexpired quote may be bound; a referred
   quote may be bound only after approval. A quote that is already bound cannot be bound again,
   and a bound quote is no longer re-rated.


---

*Questions on intent should be routed to the product owner. This extract supersedes prior rating
memos for Stonebridge Fleet Auto.*
