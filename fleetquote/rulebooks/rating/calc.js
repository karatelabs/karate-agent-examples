// Stonebridge Fleet Auto — rating oracle (SOT-prose sections 3 and 4)
// editable rate tables first
const lookup = {
    basePremium: { van: 610, lightTruck: 780, heavyTruck: 1250 },              // 4.1
    territoryRelativity: {                                                     // 4.2
        van:        { urban: 1.25, suburban: 1,    rural: 0.8 },
        lightTruck: { urban: 1.15, suburban: 0.95, rural: 0.8 },
        heavyTruck: { urban: 1.35, suburban: 1,    rural: 0.85 }
    },
    experience: { newMaxYears: 2, newFactor: 1.15, seasonedOverYears: 8, seasonedFactor: 0.8 }, // 4.3
    fleetSize: { minVehicles: 7, discount: 0.11 },                             // 4.4
    safetyCredit: 0.15,                                                        // 4.4
    claims: { perClaim: 0.17, maxSurcharge: 0.6 },                             // 4.5
    minPremium: 390,                                                           // 4.6
    referralThreshold: 29000,                                                  // 4.7
    maxDeclinedDriverAge: 23                                                   // 3
};

const execute = function (calc) {
    const input = calc.input;

    const totalVehicles = input.vans + input.lightTrucks + input.heavyTrucks;
    // a submission with no vehicles is not a quotable risk — invalid input, never priced (SOT-prose 2)
    if (totalVehicles === 0) {
        calc.req('FLEET-001/2');
        throw 'a submission must include at least one vehicle';
    }

    let premium = null;
    let reason = null;
    let declined = false;
    let surchargePct = 0;

    calc.log('# Acceptability');
    calc.label('Young-driver exclusion');
    if (input.youngestDriverAge <= lookup.maxDeclinedDriverAge) {
        calc.req('FLEET-002/1');
        calc.req('FLEET-002/3');
        calc.log('declined: youngest listed driver aged ' + input.youngestDriverAge + ' (23 or younger)');
        declined = true;
        reason = 'youngest listed driver aged 23 or younger';
        calc.outcome('declined');
    } else {
        calc.req('FLEET-002/4');
        calc.label('Out-of-state exclusion');
        if (input.outOfStateOperations) {
            calc.req('FLEET-002/2');
            calc.req('FLEET-002/3');
            calc.log('declined: regular operations outside the state of registration');
            declined = true;
            reason = 'regular out-of-state operations';
            calc.outcome('declined');
        }
    }

    if (!declined) {
        calc.log('# Fleet base premium');
        const vanPremium = input.vans * lookup.basePremium.van * lookup.territoryRelativity.van[input.territory];
        const lightPremium = input.lightTrucks * lookup.basePremium.lightTruck * lookup.territoryRelativity.lightTruck[input.territory];
        const heavyPremium = input.heavyTrucks * lookup.basePremium.heavyTruck * lookup.territoryRelativity.heavyTruck[input.territory];
        calc.log(input.vans + ' cargo vans in ' + input.territory + ' territory: ' + vanPremium);
        calc.log(input.lightTrucks + ' light trucks in ' + input.territory + ' territory: ' + lightPremium);
        calc.log(input.heavyTrucks + ' heavy trucks in ' + input.territory + ' territory: ' + heavyPremium);
        const fleetBase = vanPremium + lightPremium + heavyPremium;
        calc.req('FLEET-003/1');
        calc.req('FLEET-003/2');
        calc.req('FLEET-003/3');
        calc.log('fleet base premium (sum over vehicles): ' + fleetBase);

        calc.log('# Driver experience');
        let experienceFactor = 1;
        calc.label('Driver experience adjustment');
        if (input.avgExperience <= lookup.experience.newMaxYears) {
            experienceFactor = lookup.experience.newFactor;
            calc.req('FLEET-004/1');
            calc.log('average experience ' + input.avgExperience + ' years (2 or fewer): factor ' + experienceFactor);
        } else if (input.avgExperience > lookup.experience.seasonedOverYears) {
            experienceFactor = lookup.experience.seasonedFactor;
            calc.req('FLEET-004/2');
            calc.log('average experience ' + input.avgExperience + ' years (more than 8): factor ' + experienceFactor);
        } else {
            calc.req('FLEET-004/3');
            calc.log('average experience ' + input.avgExperience + ' years: no adjustment');
        }
        const adjusted = fleetBase * experienceFactor;
        calc.log('experience-adjusted premium: ' + adjusted);

        calc.log('# Credits and discounts');
        let reduction = 0;
        calc.label('Fleet-size discount');
        if (totalVehicles >= lookup.fleetSize.minVehicles) {
            reduction = reduction + lookup.fleetSize.discount;
            calc.req('FLEET-005/1');
            calc.log('fleet of ' + totalVehicles + ' vehicles (7 or more): ' + (lookup.fleetSize.discount * 100) + '% fleet-size discount');
        }
        calc.label('Safety-program credit');
        if (input.safetyProgram) {
            reduction = reduction + lookup.safetyCredit;
            calc.req('FLEET-005/2');
            calc.log('recognized safety program: ' + (lookup.safetyCredit * 100) + '% credit');
        }
        calc.label('Additive stacking');
        if (totalVehicles >= lookup.fleetSize.minVehicles && input.safetyProgram) {
            calc.req('FLEET-005/3');
            calc.log('both reductions earned - stacked additively');
        }
        calc.log('total additive reduction: ' + (reduction * 100) + '%');
        const credited = adjusted * (1 - reduction);
        calc.log('credited premium: ' + credited);

        calc.log('# Claims surcharge');
        calc.label('Claims surcharge');
        if (input.claimsCount > 0) {
            calc.req('FLEET-006/1');
        }
        const rawSurchargePct = input.claimsCount * lookup.claims.perClaim;
        surchargePct = Math.min(rawSurchargePct, lookup.claims.maxSurcharge);
        calc.label('Surcharge cap');
        if (rawSurchargePct > lookup.claims.maxSurcharge) {
            calc.req('FLEET-006/2');
            calc.log('raw surcharge ' + (rawSurchargePct * 100) + '% capped at ' + (lookup.claims.maxSurcharge * 100) + '%');
        }
        calc.log('claims surcharge: ' + input.claimsCount + ' claims -> ' + (surchargePct * 100) + '% (raw ' + (rawSurchargePct * 100) + '%, cap ' + (lookup.claims.maxSurcharge * 100) + '%)');
        // surcharge percentage applies to the premium BEFORE credits; the amount is added to the credited premium (4.5)
        const surchargeAmount = adjusted * surchargePct;
        calc.req('FLEET-006/3');
        calc.log('surcharge amount on pre-credit premium ' + adjusted + ': ' + surchargeAmount);
        const surcharged = credited + surchargeAmount;

        calc.log('# Minimum premium and rounding');
        // floor is a clamp, not a branch — the guarded invariant below carries the promise (4.6)
        const floored = Math.max(surcharged, lookup.minPremium);
        calc.label('Minimum premium floor');
        if (surcharged < lookup.minPremium) {
            calc.req('FLEET-007/1');
            calc.log('computed premium ' + surcharged + ' below the minimum - raised to ' + lookup.minPremium);
        }
        calc.log('computed ' + surcharged + ' -> floored at minimum ' + lookup.minPremium + ': ' + floored);
        premium = Math.round(floored * 100) / 100;
        calc.req('FLEET-008/1');
        calc.log('final premium rounded to the cent: ' + premium);

        calc.log('# Routing');
        calc.label('Referral to underwriting');
        if (premium > lookup.referralThreshold) {
            calc.req('FLEET-009/1');
            calc.log('final premium ' + premium + ' exceeds ' + lookup.referralThreshold + ': referred to underwriting');
            calc.outcome('referred');
        } else {
            calc.req('FLEET-009/2');
            calc.outcome('rated');
        }

        calc.sometimes('minimum premium floor engaged', surcharged < lookup.minPremium, { req: 'FLEET-007/1' });
        calc.sometimes('claims surcharge cap engaged', rawSurchargePct > lookup.claims.maxSurcharge, { req: 'FLEET-006/2' });
        calc.sometimes('fleet-size discount and safety credit stack additively', reduction > lookup.safetyCredit, { req: 'FLEET-005/3' });
    }

    calc.log('# Guarantees');
    calc.always('a declined quote has no premium', !declined || premium === null, { req: 'FLEET-002/3' });
    calc.always('a priced premium is at least the minimum', premium === null || premium >= lookup.minPremium, { req: 'FLEET-007/1' });
    calc.always('the claims surcharge never exceeds the cap', surchargePct <= lookup.claims.maxSurcharge, { req: 'FLEET-006/2' });
    calc.always('the final premium is rounded to the cent', premium === null || Math.abs(premium * 100 - Math.round(premium * 100)) < 0.000001, { req: 'FLEET-008/1' });

    calc.output = {
        premium: premium,
        reason: reason
    };
};
