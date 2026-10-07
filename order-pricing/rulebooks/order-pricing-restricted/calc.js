// order-pricing-restricted — the same rate book as `order-pricing`, plus one MARKET-AVAILABILITY
// precondition: the silver tier is sold only in the US. That single rule is what makes this kit's
// headline visible — a combinatorial space the BUSINESS RULES prune.
//
// Bound as the feasibility oracle by config/dimensions.js, so a run's cross projection drops the
// impossible cells (silver×EU, silver×APAC) from the REQUIRED product rather than reporting them as
// gaps: adequacy is measured against the combinations the business can actually sell, and the
// covering-array deck never proposes a test for an order nobody could place. A precondition is just a
// throw — `Rule.feasible(rulebook, row)` runs the calc and reads the rejection.
//
// Kept as a SEPARATE rulebook from `order-pricing` on purpose: the pair is the demo (and the test
// control) — the same traffic graded with and without the constraint, 3/12 unpruned vs 3/10 pruned.
const lookup = {
    tierDiscount: { standard: 0, silver: 0.05, gold: 0.10, platinum: 0.15 },
    volumeTiers: [
        { minQty: 50, discount: 0.10 },
        { minQty: 10, discount: 0.05 }
    ],
    regionTax: { US: 0.07, EU: 0.20, APAC: 0.10 },
    rushSurcharge: 0.15,
    maxDiscount: 0.25
};

const execute = function (calc) {
    const input = calc.input;
    const items = input.items || [];

    // PRECONDITION — the silver tier is US-only; any other region for a silver customer is an
    // impossible combination the cross projection must prune from the required cross-product.
    if (input.customerTier === 'silver' && input.region !== 'US') {
        throw 'silver tier is sold only in the US (region ' + input.region + ' is not available)';
    }

    let subtotal = 0;
    let totalQty = 0;
    items.forEach(function (item) {
        const line = item.qty * item.unitPrice;
        subtotal += line;
        totalQty += item.qty;
        calc.log('line ' + item.sku + ': ' + item.qty + ' x ' + item.unitPrice + ' = ' + line.toFixed(2));
    });
    calc.log('subtotal ' + subtotal.toFixed(2) + ' over ' + totalQty + ' units, ' + items.length + ' line(s)');

    // volume discount by total quantity (first matching tier wins, tiers are high-to-low)
    let volumeDiscount = 0;
    calc.label('Volume discount');
    lookup.volumeTiers.forEach(function (tier) {
        if (volumeDiscount === 0 && totalQty >= tier.minQty) {
            calc.req('ORD-PRICE-001/1');   // a qualifying order earns a volume discount
            volumeDiscount = tier.discount;
        }
    });

    // customer-tier discount
    const tierDiscount = lookup.tierDiscount[input.customerTier] || 0;

    // discounts stack, then cap
    let discountRate = volumeDiscount + tierDiscount;
    calc.label('Discount cap');
    if (discountRate > lookup.maxDiscount) {
        discountRate = lookup.maxDiscount;
    }
    const discount = subtotal * discountRate;
    const discounted = subtotal - discount;

    // region tax on the discounted amount
    const taxRate = lookup.regionTax[input.region] || 0;
    const tax = discounted * taxRate;

    // rush surcharge
    let surcharge = 0;
    calc.label('Rush surcharge');
    if (input.rush) {
        calc.req('ORD-PRICE-002/1');   // a rush order carries a surcharge
        surcharge = discounted * lookup.rushSurcharge;
    }

    const total = discounted + tax + surcharge;
    calc.log('discount ' + discount.toFixed(2) + ' tax ' + tax.toFixed(2) + ' surcharge ' + surcharge.toFixed(2));

    // the categorical decision — large quotes route to a human, the rest auto-approve. ONE local
    // carries the decision into BOTH observability faces (calc.outcome AND the output field), so
    // the routing a report shows and the routing a caller sees over HTTP cannot drift.
    calc.label('Approval routing');
    let approval;
    if (total > 50000) {
        calc.req('ORD-PRICE-003/1');   // a large quote routes to a human for approval
        approval = 'needs-approval';
    } else {
        calc.req('ORD-PRICE-003/2');   // an ordinary quote auto-approves
        approval = 'auto-approved';
    }
    calc.outcome(approval);

    // PBT properties — checked over every generated + stored input by Rule.check
    calc.always('total is never negative', total >= 0);
    calc.always('discount never exceeds subtotal', discount <= subtotal);
    calc.always('total at least the discounted amount', total >= discounted);

    calc.output = {
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        approval: approval
    };
};
