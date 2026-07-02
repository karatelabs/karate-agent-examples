// The azure-demo kit — a Loan Desk UI-rules project. Boot the rules ext (Rule / Schema / Check / match) AND the robot ext
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
// the REST surface joins the SAME graph: POST /decisions hits (from checks/loan-api.feature) grade against
// openapi.yaml, so API coverage + rule coverage + requirement coverage roll into one RTM.
cov.openapi = 'openapi.yaml';

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
} else {
  // Pure-git / SDD posture: the requirement markdown IS the source of truth, so link each id to its heading
  // on the git host (the git-native mirror of the ADO Story link). Exactly as the ADO org/project are
  // derived from the pipeline's runtime vars (to auto-follow the org, not hardcode), the git coordinates come
  // from GitHub Actions and are passed in: KARATE_GIT_REPO_URL=github.repository (auto-follows a fork),
  // KARATE_GIT_REF=github.sha (pins each RTM link to the exact reviewed commit — immutable), and
  // KARATE_GIT_BASE=this kit's subdir in the monorepo. They land on requirements.provider just like ADO's.
  // Unset (a bare local run) leaves ids as plain text.
  const gitRepoUrl = java.lang.System.getenv('KARATE_GIT_REPO_URL');
  if (gitRepoUrl) {
    requirements.provider = {
      system: 'git',
      repoUrl: gitRepoUrl,
      branch: java.lang.System.getenv('KARATE_GIT_REF'),
      basePath: java.lang.System.getenv('KARATE_GIT_BASE')
    };
  }
}
