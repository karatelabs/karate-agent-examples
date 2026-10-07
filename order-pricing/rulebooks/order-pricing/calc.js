// order-pricing — the oracle. Rates a quote of line items: per-line subtotal, a volume discount by
// total quantity, a customer-tier discount (stacked + capped), region tax, and a rush surcharge.
// Showcases the calc.* explainability hints: calc.label (rule names on the decisions),
// calc.outcome (the categorical approve/route result), calc.always + calc.sometimes (the PBT
// property pair, checked across the whole swept space). NOTE: the 'Discount cap' rule is deliberately
// UNREACHABLE (max stack is exactly 0.25, never > 0.25) — Rule.check surfaces it as a dead branch, and
// the calc.sometimes inside it can never be reached (the pre-cataloged NOT-CHECKED showcase).
// Also showcases the calc.req fine-grained rule→requirement link: each decision arm names
// the acceptance criterion (requirements/order-pricing.md) it satisfies, so running a scenario lights
// exactly the criteria its path reached in the RTM (see Rule.run(...).reqs).
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

    calc.log('# Line items & subtotal');
    let subtotal = 0;
    let totalQty = 0;
    items.forEach(function (item) {
        const line = item.qty * item.unitPrice;
        subtotal += line;
        totalQty += item.qty;
        calc.log('line ' + item.sku + ': ' + item.qty + ' x ' + item.unitPrice + ' = ' + line.toFixed(2));
    });
    calc.log('subtotal ' + subtotal.toFixed(2) + ' over ' + totalQty + ' units, ' + items.length + ' line(s)');

    calc.log('# Discounts');
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
        // deliberately unreachable — so this situation is pre-cataloged but never satisfied
        calc.sometimes('the discount cap kicks in', true);
        discountRate = lookup.maxDiscount;
    }
    const discount = subtotal * discountRate;
    const discounted = subtotal - discount;

    calc.log('# Tax & surcharge');
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

    calc.log('# Total & approval routing');
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

    // PBT properties — checked over every generated + stored input by Rule.check:
    // calc.always = a safety property that must hold on EVERY input; calc.sometimes = an interesting
    // SITUATION the explored space must reach at least once (richer than line coverage)
    calc.always('total is never negative', total >= 0);
    calc.always('discount never exceeds subtotal', discount <= subtotal);
    calc.always('total at least the discounted amount', total >= discounted);
    calc.sometimes('volume and tier discounts stack', volumeDiscount > 0 && tierDiscount > 0);

    calc.output = {
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        approval: approval
    };
};
