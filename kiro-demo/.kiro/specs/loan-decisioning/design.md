# Design Document

## Overview

The Loan Decisioning service is a single stateless decision function behind one endpoint. An application
arrives, is validated, is run through the decline gate, is routed to an outcome, and — where the outcome is
priced — is assigned an APR from the published bands. No persistence, no queue, no workflow.

## Architecture

```
POST /decisions ──► validate ──► decline gate ──► routing ──► pricing ──► DecisionResult
```

- **validate** — presence and range checks; rejects with the offending field named.
- **decline gate** — the credit floor and the debt-to-income limit. Either one declines outright.
- **routing** — a non-declined application is either borderline (manual review) or clean (approved).
- **pricing** — base APR by credit-score band, the existing-customer discount, then the floor/ceiling clamp.

## Components

| Component | Responsibility |
|---|---|
| `validator` | presence + range checks over the application |
| `decliner` | credit floor, debt-to-income ratio |
| `router` | manual-review band vs approval |
| `pricer` | band lookup, discount, clamp |

## Data Models

```
Application    { creditScore, annualIncome, requestedAmount, termMonths, existingMonthlyDebt, isExistingCustomer }
DecisionResult { outcome, apr?, dti?, reasons[] }
```

## Error Handling

A validation failure returns a 400 naming the offending field; it is never expressed as a decision outcome.

## Testing Strategy

Each decision arm is exercised as a table row through the decision function, and the HTTP surface is checked
against the same expectations so the endpoint and the function cannot drift apart.
