import { test, expect } from '@playwright/test';

test.describe('Policy API', () => {

  test('quotes a senior driver in Florida at the standard class', async ({ request }) => {
    const res = await request.post('/quotes', {
      data: { state: 'FL', coverage: 'COMPREHENSIVE', driverAge: 75, priorClaims: false },
    });
    expect(res.status()).toBe(201);
    const quote = await res.json();
    expect(quote).toMatchObject({ policyClass: 'STANDARD', currency: 'USD' });
    expect(quote.monthlyPremium).toBe(180);
  });

  test('files a claim against a bound policy and the claim is open', async ({ request }) => {
    const q = await request.post('/quotes', {
      data: { state: 'CA', coverage: 'LIABILITY', driverAge: 40, priorClaims: false },
    });
    expect(q.status()).toBe(201);
    const quote = await q.json();

    const p = await request.post('/policies', { data: { quoteId: quote.id, holder: 'Annie Easley' } });
    expect(p.status()).toBe(201);
    const policy = await p.json();

    const c = await request.post('/claims', {
      data: { policyId: policy.id, amount: 1200, description: 'windshield' },
    });
    expect(c.status()).toBe(201);
    const claim = await c.json();
    expect(claim.status).toBe('OPEN');
    expect(claim.amount).toBe(1200);
  });

  test('rejects a quote for a state the rate book does not cover', async ({ request }) => {
    const res = await request.post('/quotes', {
      data: { state: 'NV', coverage: 'COLLISION', driverAge: 40 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.field).toBe('state');
    expect(body.error).toContain('state must be one of');
  });
});
