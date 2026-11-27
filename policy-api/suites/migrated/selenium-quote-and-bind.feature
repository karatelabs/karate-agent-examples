@imported-from-selenium
Feature: PolicyDesk quote and bind — migrated from Selenium QuoteAndBindTest

  # Source: legacy/selenium/src/test/java/com/acme/desk/QuoteAndBindTest.java + pages/*.java
  # 3 tests, 9 assertions — one Scenario per test, each assert* kept 1:1.
  # Page-object actions are checks/pages/*.js; getters are read inline. QuoteWizardPage.rate(coverage)
  # is quote-coverage + quote-rate. The driver factory, implicit wait and quit() are dropped: the run
  # owns the browser. DESK_URL is deskUrl from karate-config.js.

  Background:
    * def textOf = function(loc){ return bot.find(loc).eval(_ => _.textContent.trim()) }
    * bot.go(deskUrl)

  Scenario: rates a preferred driver in New York
    * Check.run('pages/quote-start.js')
    * Check.run('pages/quote-driver.js', { first: 'Walter', last: 'Brandt', age: 30, state: 'NY', priorClaims: false })
    * Check.run('pages/quote-vehicle-defaults.js')
    * Check.run('pages/quote-coverage.js', { coverage: 'COMPREHENSIVE' })
    * Check.run('pages/quote-rate.js')

    * match textOf('#ws-total') == '$155.00'
    * match textOf('#ws-class') == 'PREFERRED'
    * match textOf('#ws-state') == 'New York'

  Scenario: binds a young driver with prior claims at the substandard premium
    * Check.run('pages/quote-start.js')
    * Check.run('pages/quote-driver.js', { first: 'Hank', last: 'Ostrowski', age: 21, state: 'TX', priorClaims: true })
    * Check.run('pages/quote-vehicle-defaults.js')
    * Check.run('pages/quote-coverage.js', { coverage: 'LIABILITY' })
    * Check.run('pages/quote-rate.js')
    * match textOf('#ws-total') == '$125.00'

    * Check.run('pages/worksheet-bind.js')
    * Check.run('pages/bind-signed.js', { holder: 'Hank Ostrowski' })
    * match textOf('#policy-status') == 'BOUND'
    * match textOf('#policy-premium') == '$125.00'
    * match textOf('#policy-holder') == 'Hank Ostrowski'

  Scenario: binding without a signed application is refused
    * Check.run('pages/quote-start.js')
    * Check.run('pages/quote-driver.js', { first: 'Priya', last: 'Natarajan', age: 40, state: 'CA', priorClaims: false })
    * Check.run('pages/quote-vehicle-defaults.js')
    * Check.run('pages/quote-coverage.js', { coverage: 'COLLISION' })
    * Check.run('pages/quote-rate.js')
    * Check.run('pages/worksheet-bind.js')
    * Check.run('pages/bind-unsigned.js')

    * match textOf('#banner') == 'A signed application must be on file before binding.'
    * bot.wait('url', '#/bind/')
