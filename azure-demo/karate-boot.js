// The Loan Desk UI-rules project. Boot the rules ext (Rule / Schema / Check / match) AND the robot ext
// (Robot / bot), so the browser feature's per-row `Check.run('drive-quote.js', __row)` drives the loan SUT
// with `bot` and oracles each field against the personal-loan rulebook. Robot is a booted-ext suite global
// here exactly the way Rule is — no special runner wiring.
const rules = boot.ext('rules');
rules.home = 'rulebooks';
boot.ext('robot');

// contribute coverage to the run's native report (the Coverage nav tab + the Requirements-covered /
// rules tiles, the SAME core report-asset path as a normal `karate run` with the coverage ext): the
// rulebook's calc.req emits hits as Rule.execute runs per row, joined to the requirements/ EARS criteria.
const cov = boot.ext('coverage');
cov.requirements = 'requirements';
cov.rules = 'rulebooks';

// Requirements ext. DOUBLE-DUTY BY ENV: the same kit runs on two CI systems with two requirements stances.
// Only when the run supplies the ADO coordinates (KARATE_ADO_ORG + KARATE_ADO_PROJECT) do we wire the
// provider, so the RTM renders each requirement id as a click-through to its Azure DevOps User Story (the
// local ids ARE the work-item numbers, 1:1). Unset — a pure-git / GitHub-Actions run — leaves ids as plain
// text: the spec-driven-development posture, requirements markdown IS the source of truth, no tracker.
const requirements = boot.ext('requirements');
const adoOrg = java.lang.System.getenv('KARATE_ADO_ORG');
const adoProject = java.lang.System.getenv('KARATE_ADO_PROJECT');
if (adoOrg && adoProject) {
  requirements.provider = { system: 'ado', org: adoOrg, project: adoProject };
}
