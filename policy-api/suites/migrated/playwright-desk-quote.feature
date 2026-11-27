@imported-from-playwright
Feature: PolicyDesk quote wizard — migrated from Playwright UI

  # Source: legacy/playwright/tests/desk-quote.spec.ts
  # 2 tests, 9 assertions — one Scenario per test, each expect() kept 1:1.
  # The startQuote() helper is the quote-start + quote-driver + quote-vehicle-defaults checks;
  # PolicyDesk's URL is deskUrl from karate-config.js. Locators live in checks/pages/*.js.

  Background:
    * def textOf = function(loc){ return bot.find(loc).eval(_ => _.textContent.trim()) }
    * bot.go(deskUrl)

  Scenario: quick rate and the rating worksheet agree for Florida comprehensive
    * Check.run('pages/quote-start.js')
    * Check.run('pages/quote-driver.js', { first: 'Rosa', last: 'Delgado', age: 40, state: 'FL', priorClaims: false })
    * Check.run('pages/quote-vehicle-defaults.js')
    * Check.run('pages/quote-coverage.js', { coverage: 'COMPREHENSIVE' })

    * Check.run('pages/quote-quick-rate.js')
    * match textOf('#quick-out') == '$155.00'

    * Check.run('pages/quote-rate.js')
    * bot.wait('url', '#/worksheet/')
    * match textOf('#ws-total') == '$155.00'
    * match bot.findAll('#ws-lines tr').length == 2
    * match textOf('#ws-lines tr[data-line="territory"]') contains 'Florida'

  Scenario: binds a Washington collision policy and files a claim on it
    * Check.run('pages/quote-start.js')
    * Check.run('pages/quote-driver.js', { first: 'Mei', last: 'Tanaka', age: 45, state: 'WA', priorClaims: false })
    * Check.run('pages/quote-vehicle-defaults.js')
    * Check.run('pages/quote-coverage.js', { coverage: 'COLLISION' })
    * Check.run('pages/quote-rate.js')
    * Check.run('pages/worksheet-bind.js')

    * Check.run('pages/bind-signed.js')
    * match textOf('#policy-status') == 'BOUND'
    * match textOf('#policy-premium') == '$90.00'

    * Check.run('pages/policy-file-claim.js', { amount: 1800 })
    * match textOf('#claim-status') == 'OPEN'
    * match textOf('#claim-amount-shown') == '$1800.00'
