// rating — the input UNIVERSE. The explorer sweeps these to establish what is REACHABLE;
// diffed against scenarios.json it separates `notused` (reachable, but no saved case exercises it)
// from `notreachable` (dead — no input can reach it). driverAge's classes come from the calc's own
// thresholds (< 25, > 70) inside [18, 80], so the senior-loading arm is REACHABLE by the generator even
// though the saved scenarios never send a driver over 70 — that is the deliberate `notused` (add-data)
// finding. The first values listed lead the generated deck: its first senior rows are CA COLLISION, no claims.
function generate(g) {
    g.enum('coverage', ['COLLISION', 'LIABILITY', 'COMPREHENSIVE']);
    g.enum('state', ['CA', 'NY', 'FL', 'TX', 'WA']);
    g.int('driverAge', 18, 80);
    g.enum('priorClaims', [false, true]);
}
