Feature: Loan Desk UI agrees with the personal-loan rules, per scenario

  The flagship UI-rules acceptance demo: a Scenario Outline over the rulebook's OWN scenarios drives the
  loan desk with `bot` and asserts the on-screen decision + APR equal the rules oracle (Rule.execute),
  row by row. Each row's labeled `match` lands as an evidence step row in the native report with a
  screenshot; the `@req=` tokens light up requirement coverage in the RTM. Drift the SUT (the admin panel)
  and a row goes red — the "is what ships what the rules say?" loop, on a real screen.

  Scenario Outline: <id> — <label>
    * eval Check.run('drive-quote.js', __row)

    Examples:
      | read('rulebooks/personal-loan/scenarios.json') |
