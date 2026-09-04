// rating — the shape contract, and the DOMAIN for every bounded axis: the ranged markers
// are enforced at the API boundary and are what every verdict is read over. generator.js
// pins the interior boundaries inside them and may only narrow, never widen.
schema = {
    territory: ['urban', 'suburban', 'rural'],
    vans: '#int[0,25]',
    lightTrucks: '#int[0,25]',
    heavyTrucks: '#int[0,25]',
    avgExperience: '#int[0,30]',
    safetyProgram: '#boolean',
    claimsCount: '#int[0,6]',
    hazmatCargo: '#boolean',
    youngestDriverAge: '#int[18,70]',
    outOfStateOperations: '#boolean'
};
