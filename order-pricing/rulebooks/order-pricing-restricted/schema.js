// order-pricing — B2B quote-to-cash rating over a CART OF LINE ITEMS (the nested-array showcase).
// The shape contract; the constrained input domain lives in generator.js.
schema = {
    customerTier: ['standard', 'silver', 'gold', 'platinum'],
    region: ['US', 'EU', 'APAC'],
    rush: '#boolean',
    items: [
        {
            sku: '#string',
            category: ['hardware', 'software', 'service'],
            qty: '#number',
            unitPrice: '#number'
        }
    ]
};
