import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as currency from '../src/currency.ts';
import type { Rate } from '../src/currency.ts';

test('converts from original cents with decimal half-up rounding and detects overflow', () => {
  assert.equal(currency.convertMinor(10000, 0.05407), 541);
  assert.equal(currency.convertMinor(100, 1.005), 101);
  assert.equal(currency.convertMinor(1, 0.5), 1);
  assert.equal(currency.convertMinor(Number.MAX_SAFE_INTEGER, 1), Number.MAX_SAFE_INTEGER);
  assert.equal(currency.convertMinor(100, 1e-7), 0);
  assert.throws(() => currency.convertMinor(Number.MAX_SAFE_INTEGER, 2), /large/i);
  for (const rate of [0, -1, Infinity, NaN]) assert.throws(() => currency.convertMinor(100, rate));
});

test('fetches only currency codes with dynamic base and validates the response', async () => {
  let request = '';
  const rates = await currency.fetchRates('MXN', async (url, options) => {
    request = String(url); assert.ok(options?.signal);
    return new Response(JSON.stringify(rows));
  });
  assert.equal(request, 'https://api.frankfurter.dev/v2/rates?base=MXN&quotes=USD,EUR');
  assert.deepEqual(rates, rows);
  await currency.fetchRates('USD', async url => {
    assert.equal(String(url), 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=MXN,EUR');
    return new Response(JSON.stringify(rows.map((r, i) => ({ ...r, base: 'USD', quote: i ? 'MXN' : 'EUR' }))));
  });
  await assert.rejects(currency.fetchRates('MXN', async () => new Response('[]')), /rates/i);
  await assert.rejects(currency.fetchRates('MXN', async () => new Response('bad', { status: 503 })), /503/);
  await assert.rejects(currency.fetchRates('MXN', async () => new Response('bad')));
});

test('timeout bounds hanging fetch and body reads even if abort is ignored', async () => {
  for (const body of [false, true]) {
    let signal: AbortSignal | null | undefined;
    const hanging: typeof fetch = async (_url, options) => {
      signal = options?.signal;
      if (!body) return new Promise(() => {});
      return { ok: true, json: () => new Promise(() => {}) } as Response;
    };
    await assert.rejects(Promise.race([
      currency.fetchRates('MXN', hanging, 5),
      new Promise((_, reject) => { setTimeout(() => reject(new Error('Test watchdog')), 150); }),
    ]), /timed out/i);
    assert.equal(signal?.aborted, true);
  }
});

test('uses the exact base amount until a complete target rate is available', () => {
  assert.equal(currency.displayMinor(10000, 'MXN', 'MXN', null), 10000);
  assert.equal(currency.displayMinor(10000, 'MXN', 'USD', rows), 541);
  assert.equal(currency.displayMinor(10000, 'MXN', 'USD', null), null);
  assert.equal(currency.displayMinor(10000, 'MXN', 'USD', [{ ...rows[0], quote: 'EUR' }]), null);
});

test('locks a transaction into its historical base amount and never uses a newer cache', () => {
  const snapshot: Rate[] = [
    { date: '2026-10-21', base: 'MXN', quote: 'USD', rate: 1 / 18 },
    { date: '2026-10-21', base: 'MXN', quote: 'EUR', rate: 0.05 },
  ];
  assert.equal(currency.toBaseMinor(8000, 'USD', 'MXN', snapshot), 144000);
  assert.equal(currency.displayHistoricalMinor(144000, 'MXN', 'USD', snapshot), 8000);
  assert.equal(currency.displayHistoricalMinor(144000, 'MXN', 'USD', [{ ...snapshot[0], rate: 1 / 20 }, snapshot[1]]), 7200);
  assert.equal(currency.toBaseMinor(8000, 'USD', 'MXN', null), null);
});

export const rows: Rate[] = [
  { date: '2026-10-22', base: 'MXN', quote: 'EUR', rate: 0.04815 },
  { date: '2026-10-21', base: 'MXN', quote: 'USD', rate: 0.05407 },
];

test('validates complete Frankfurter quotes with independent dates', () => {
  assert.deepEqual(currency.validateRates(rows, 'MXN'), rows);
  for (const bad of [null, {}, [], rows.slice(0, 1), [rows[0], rows[0]],
    rows.map(r => ({ ...r, base: 'USD' })),
    ...[0, -1, NaN, Infinity, '0.05'].map(rate => rows.map(r => ({ ...r, rate }))),
    ...['2026-02-30', 'tomorrow', '2026-1-01'].map(date => rows.map(r => ({ ...r, date })))]) {
    assert.throws(() => currency.validateRates(bad, 'MXN'), /rate/i);
  }
});
