# Requirements Document

## Introduction

The Loan Decisioning service decides unsecured personal-loan applications. It takes an application — credit
score, annual income, requested amount, term in months, existing monthly debt, and an existing-customer flag
— and returns one outcome (APPROVED, DECLINED or MANUAL_REVIEW) with, where an outcome is priced, a final
APR. It holds no state and owns no workflow: it is a decision function behind one HTTP endpoint.

## Glossary

- **Decision_Service**: The stateless service described by this document; exposed at `POST /decisions`.
- **Application**: The request body carrying the six input fields required to produce a decision.
- **Outcome**: One of the three enumerated results the Decision_Service returns: APPROVED, DECLINED, or MANUAL_REVIEW.
- **Credit_Score**: The integer credit score supplied in the Application, valid between 300 and 850 inclusive.
- **DTI**: Debt-to-Income ratio — annualised total debt as a fraction of annual income.
- **Credit_Floor**: The minimum Credit_Score required to avoid an automatic decline: 580.
- **DTI_Limit**: The maximum DTI allowed to avoid an automatic decline: 0.50 (50%).
- **Review_Band**: The Credit_Score range 580–669 inclusive, routed to a loan officer rather than decided automatically.
- **APR**: Annual Percentage Rate, as a decimal fraction (e.g. 0.065 = 6.5%). Present on priced outcomes.
- **APR_Band**: One row of the published rate table, mapping a minimum Credit_Score to a base APR.
- **Existing_Customer_Discount**: The 0.005 (0.5 percentage point) reduction applied to the base APR for an existing customer.

---

## Requirements

### Requirement 1: Input Validation

**User Story:** As a caller of the Decision_Service, I want malformed Applications rejected before any
decision is made, so that an Outcome is never derived from data the service could not understand.

#### Acceptance Criteria

1. WHEN the Decision_Service receives an Application with a missing required field, THEN THE Decision_Service SHALL reject the request and name the missing field.
2. WHEN the Decision_Service receives an Application whose Credit_Score is outside the range 300–850, THEN THE Decision_Service SHALL reject the request and name the offending field.

---

### Requirement 2: Decline Gate

@criticality=high
**User Story:** As a lender, I want Applications that fail the credit floor or the affordability limit to be
declined automatically, so that the institution does not extend credit against its own policy.

#### Acceptance Criteria

1. IF an Application's Credit_Score is below the Credit_Floor, THEN THE Decision_Service SHALL return the Outcome DECLINED.
2. IF an Application's DTI exceeds the DTI_Limit, THEN THE Decision_Service SHALL return the Outcome DECLINED.

---

### Requirement 3: Decision Routing

**User Story:** As a lender, I want borderline Applications sent to a loan officer and clean Applications
approved without one, so that human judgement is spent only where it changes the answer.

#### Acceptance Criteria

1. IF an Application is not declined and its Credit_Score falls within the Review_Band, THEN THE Decision_Service SHALL return the Outcome MANUAL_REVIEW.
2. IF an Application is neither declined nor within the Review_Band, THEN THE Decision_Service SHALL return the Outcome APPROVED.

---

### Requirement 4: APR Pricing

@criticality=high
**User Story:** As a lender, I want every priced Outcome to carry an APR derived from the published
APR_Bands, so that pricing is explainable to an applicant and to an auditor.

#### Acceptance Criteria

1. WHEN an Application is priced, THEN THE Decision_Service SHALL assign the base APR of the APR_Band its Credit_Score falls in.
2. IF a priced applicant is an existing customer, THEN THE Decision_Service SHALL apply the Existing_Customer_Discount to the base APR.
3. WHEN an APR has been derived, THEN THE Decision_Service SHALL clamp it to no less than 5 percent and no more than 24 percent.
