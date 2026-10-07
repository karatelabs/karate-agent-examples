function fn() {
    // An external baseUrl wins (-DbaseUrl — e.g. a run against a deployed service). Otherwise AUTO-START
    // the in-process mock ONCE per suite (mock/start.js via callSingle) and point baseUrl at it — so
    // picking order-pricing in the console and running a check "just works", with no separate server
    // process. This kit's backend is an in-process karate mock, never a server you start yourself.
    var baseUrl = karate.sysprop('baseUrl');
    if (!baseUrl) {
        // Project-root-anchored: a leading '/' is from the project root (webapp context-path style), so it
        // resolves identically from a feature run AND from config-eval (Runner.config / the explore harness)
        // — unlike a bare/'../' path, which is feature-dir-relative. Best practice: '/'-rooted refs.
        baseUrl = karate.callSingle('/mock/start.js').baseUrl;
    }
    return { baseUrl: baseUrl };
}
