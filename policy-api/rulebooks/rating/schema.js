// rating — the input shape contract. Enum fields become closed coverage axes; the constrained
// universe (age bounds, boundary levels) lives in generator.js.
schema = {
    label: '#string',
    state: ['CA', 'NY', 'FL', 'TX', 'WA'],
    coverage: ['LIABILITY', 'COLLISION', 'COMPREHENSIVE'],
    driverAge: '#number',
    priorClaims: '#boolean'
};
