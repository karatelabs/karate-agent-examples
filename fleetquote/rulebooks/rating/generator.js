function generate(g) {
    g.enum('territory', ['urban', 'suburban', 'rural']);
    // vehicle counts: fleet-size discount trips at 7 total vehicles, so pin 6/7 on one dimension
    g.int('vans', 0, 25, [0, 1, 6, 7]);
    g.int('lightTrucks', 0, 25, [0, 1]);
    g.int('heavyTrucks', 0, 25, [0, 1]);
    // experience bands change at <=2 and >8 (SOT-prose 4.3)
    g.int('avgExperience', 0, 30, [2, 3, 8, 9]);
    g.bool('safetyProgram');
    // claims surcharge caps at 60% => 3 claims 51%, 4 claims capped (SOT-prose 4.5)
    g.int('claimsCount', 0, 6, [0, 1, 3, 4]);
    g.bool('hazmatCargo');
    // exclusion boundary: 23 or younger declined (SOT-prose 3)
    g.int('youngestDriverAge', 18, 70, [23, 24]);
    g.bool('outOfStateOperations');
}
