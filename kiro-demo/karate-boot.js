// The kiro-demo kit — the requirements are a Kiro spec, and the evidence underneath them is ours.
//
// The requirement source is the spec folder itself: `.kiro/specs/<feature>/requirements.md` is read by the
// Kiro front-end (the document chrome dropped, the feature dir as the parent, `### Requirement N` as
// `<feature>.<N>`), and the sibling `tasks.md` supplies each ticked task's completion CLAIM. Nothing is
// copied or re-authored — the spec stays exactly as the tool generated it.
const rules = boot.ext('rules');
rules.home = 'rulebooks';

// Everything joins ONE graph: the requirements (from the spec folder), the rulebook that realizes them, and
// the REST operation the API checks exercise. That is what makes the traceability matrix span
// requirement -> rule -> API in a single report.
const cov = boot.ext('coverage');
cov.requirements = '.kiro/specs';
cov.openapi = 'openapi.yaml';

// The Requirement namespace, so a check (or the console, or an MCP client) can ask the readiness question
// mid-suite. Same home as the coverage join above.
const requirements = boot.ext('requirements');
requirements.home = '.kiro/specs';

// Pure-git posture: each requirement id deep-links to its heading in the spec on the git host, so a report
// generated in CI points back at the exact spec it verified. The coordinates come from the CI run
// (KARATE_GIT_REPO_URL=github.repository, KARATE_GIT_REF=github.sha, KARATE_GIT_BASE=this kit's subdir);
// unset — a bare local run — leaves the ids as plain text.
const gitRepoUrl = boot.sysprop('KARATE_GIT_REPO_URL', boot.sysenv('KARATE_GIT_REPO_URL'));
if (gitRepoUrl) {
  requirements.provider = {
    system: 'git',
    repoUrl: gitRepoUrl,
    branch: boot.sysprop('KARATE_GIT_REF', boot.sysenv('KARATE_GIT_REF')),
    basePath: boot.sysprop('KARATE_GIT_BASE', boot.sysenv('KARATE_GIT_BASE'))
  };
}
