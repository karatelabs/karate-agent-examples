# Apex Lending — Personal Loan Decision Requirements

The instant-decision rules for the Loan Desk SUT (`/loan`). Each acceptance criterion is linked from the
`personal-loan` rulebook (`calc.req`) and verified by the UI check (`drive-quote.js`), so the RTM shows
requirement → rule → run.

### 3: Decline gate
@criticality=high

The system **shall** decline applications that fail the minimum credit or affordability thresholds.

**Acceptance:**
- ac1: WHEN the credit score is below 580 THE SYSTEM SHALL decline the application
- ac2: WHEN the debt-to-income ratio exceeds 50% THE SYSTEM SHALL decline the application

### 4: Manual review routing
@criticality=high

The system **shall** route borderline applications to a loan officer for manual review.

**Acceptance:**
- ac1: WHEN the credit score is 580–669 THE SYSTEM SHALL route the application to manual review
- ac2: WHEN the debt-to-income ratio is 40–50% THE SYSTEM SHALL route the application to manual review

### 5: Auto-approval
@criticality=high

The system **shall** auto-approve applications that are neither declined nor borderline.

**Acceptance:**
- ac1: WHEN an application is neither declined nor borderline THE SYSTEM SHALL auto-approve it

### 6: APR pricing
@criticality=high

The system **shall** price the APR by credit-score band, apply the existing-customer discount, then clamp it.

**Acceptance:**
- ac1: WHEN the credit score is 720 or above THE SYSTEM SHALL price the base APR at 6.5%
- ac2: WHEN the credit score is 660–719 THE SYSTEM SHALL price the base APR at 9.9%
- ac3: WHEN the credit score is 580–659 THE SYSTEM SHALL price the base APR at 14.9%
- ac4: WHEN the applicant is an existing customer THE SYSTEM SHALL reduce the APR by 0.5 percentage points
- ac5: THE SYSTEM SHALL clamp the APR between a 5% floor and a 24% ceiling
- ac6: WHEN an application is declined THE SYSTEM SHALL assign no APR
