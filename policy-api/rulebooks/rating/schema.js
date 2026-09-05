// rating — the input shape contract, and the DOMAIN for every bounded axis: the ranged
// marker is enforced at the API boundary and is what every verdict is read over. generator.js
// pins the boundary levels inside it and may only narrow, never widen.
schema = {
    state: ['CA', 'NY', 'FL', 'TX', 'WA'],
    coverage: ['LIABILITY', 'COLLISION', 'COMPREHENSIVE'],
    driverAge: '#int[18,80]',   // the licensed-driver band this rate book prices
    priorClaims: '#boolean'
};
