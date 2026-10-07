// order-pricing — B2B quote-to-cash rating over a CART OF LINE ITEMS (the nested-array showcase).
// The shape contract, and — for every bounded axis — the DOMAIN itself: the ranged markers
// below are enforced at the API boundary and are what every verdict is read over. `sku` stays open.
// Cardinality is not the shape's business; generator.js declares it (g.array).
schema = {
    customerTier: ['standard', 'silver', 'gold', 'platinum'],
    region: ['US', 'EU', 'APAC'],
    rush: '#boolean',
    items: [
        {
            sku: '#string',
            category: ['hardware', 'software', 'service'],
            qty: '#int[1,100]',
            unitPrice: '#int[10,5000]'
        }
    ]
};
