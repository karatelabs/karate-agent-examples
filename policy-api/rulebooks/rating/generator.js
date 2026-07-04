// rating — the input UNIVERSE. The explorer sweeps these to establish what is REACHABLE;
// diffed against scenarios.json it separates `notused` (reachable, but no saved case exercises it)
// from `notreachable` (dead — no input can reach it). driverAge pins the young boundary (24/25) and
// a senior value (71) so the senior-loading arm is REACHABLE by the generator even though the saved
// scenarios never send a driver over 70 — that is the deliberate `notused` (add-data) finding.
function generate(g) {
    g.enum('coverage', ['LIABILITY', 'COLLISION', 'COMPREHENSIVE']);
    g.enum('state', ['CA', 'NY', 'FL', 'TX', 'WA']);
    g.int('driverAge', 18, 80, [24, 25, 71]);
    g.enum('priorClaims', [true, false]);
}
