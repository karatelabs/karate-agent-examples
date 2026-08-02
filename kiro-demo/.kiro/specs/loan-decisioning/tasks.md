# Implementation Plan

- [x] 1. Set up the decisioning module and its HTTP surface
  - Define the application and decision-result shapes
  - Expose `POST /decisions`
  - _Requirements: 1.1_

- [x] 2. Implement input validation
  - Reject a request with any required field missing, naming the field
  - Reject a credit score outside 300–850
  - _Requirements: 1.1, 1.2_

- [x] 3. Implement the decline gate
  - Decline below the minimum credit score
  - Compute the debt-to-income ratio and decline above the affordability limit
  - _Requirements: 2.1, 2.2_

- [x] 4. Implement decision routing
  - Route the 580–669 band to manual review
  - Approve everything neither declined nor borderline
  - _Requirements: 3.1, 3.2_

- [x] 5. Implement APR pricing
  - Assign the base rate from the applicant's credit-score band
  - Apply the existing-customer discount
  - Clamp the result to the published floor and ceiling
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Publish the decision event to the downstream ledger
  - _Requirements: 3.2_
