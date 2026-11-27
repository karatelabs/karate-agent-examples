Feature: PolicyDesk shows the premium the rating rules give, for every case in cases.xlsx

  Each row of the quotes sheet drives the quote wizard on the PolicyDesk screen, binds the policy, and
  compares the worksheet and bound-policy premiums with Rule.execute('rating', row). A passing row stamps
  the RATE criteria its rating realized. Needs PolicyDesk at deskUrl (karate-config.js) and a browser.

  Scenario Outline: <label>
    * eval Check.run('desk-quote.js', __row)

    Examples:
      | read('cases.xlsx#quotes') |
