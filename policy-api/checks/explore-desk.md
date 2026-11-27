# Goal: on PolicyDesk, quote and bind a policy for a senior driver in Texas, then file a claim on it

PolicyDesk is an underwriting desk over the Policy API. Open it at the address `deskUrl` names (a
global from `karate-config.js`); there is no login. Work one screen at a time and look() before you act.

## What to do

1. Start a new **Personal auto** submission (the **New** menu, then **Submission**).
2. **Driver** — name **Maria Okafor**, age **72**, state **Texas**, no prior claims.
3. **Vehicle** — keep the defaults.
4. **Coverage** — **Liability**, then rate the quote.
5. **Rating worksheet** — read the monthly premium and the build-up lines, then go on to bind.
6. **Bind** — confirm the application is signed, then bind.
7. **Policy** — it must read **BOUND**. File a claim on it for a loss of **2500** dollars.

## Report and finish

- `Robot.step('Quoted a 72-year-old Texas driver @req=RATE-001/2', 'pass')` once the worksheet shows a premium.
- `Robot.step('Policy bound', 'pass')` and `Robot.step('Claim filed', 'pass')` as each happens.
- `bot.screenshot('Rating worksheet — premium $…')` and `bot.screenshot('Policy with its claim')`, with the
  amount in the title.
- Finish with `Robot.success(...)` naming the policy id, the monthly premium and the claim's status.
