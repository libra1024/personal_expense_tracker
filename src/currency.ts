import { CURRENCIES, isValidDate, type Currency, type Expense } from './expenses.ts';

// Interpret the API's decimal rate exactly, including exponent notation. Never
// multiply cents with binary floating point or convert an already converted value.
export function convertMinor(minor: number, rate: number): number {
  if (!Number.isSafeInteger(minor) || minor < 0 || !Number.isFinite(rate) || rate <= 0) throw new Error('Invalid conversion.');
  const [coefficient, exponent = '0'] = rate.toString().split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  const scale = fraction.length - Number(exponent);
  const numerator = BigInt(whole + fraction) * 10n ** BigInt(Math.max(0, -scale));
  const denominator = 10n ** BigInt(Math.max(0, scale));
  const rounded = (BigInt(minor) * numerator * 2n + denominator) / (denominator * 2n);
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Converted amount is too large to display accurately.');
  return Number(rounded);
}

export async function fetchRates(base: Currency, request: typeof fetch = fetch, timeoutMs = 8000): Promise<Rate[]> {
  const quotes = CURRENCIES.filter(c => c !== base).join(',');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new Error('Exchange rate request timed out.')); controller.abort(); }, timeoutMs);
  });
  try {
    return await Promise.race([timeout, (async () => {
      const response = await request(`https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quotes}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Exchange rate service returned ${response.status}.`);
      return validateRates(await response.json(), base);
    })()]);
  } finally { clearTimeout(timer); }
}

export function displayMinor(minor: number, base: Currency, target: Currency, rates: readonly Rate[] | null): number | null {
  if (base === target) return minor;
  const rate = rates?.find(item => item.base === base && item.quote === target)?.rate;
  return rate ? convertMinor(minor, rate) : null;
}

export function toBaseMinor(minor: number, original: Currency, base: Currency, rates: readonly Rate[] | null): number | null {
  if (original === base) return minor;
  const rate = rates?.find(item => item.base === base && item.quote === original)?.rate;
  return rate ? convertMinor(minor, 1 / rate) : null;
}

export function displayHistoricalMinor(baseMinor: number, base: Currency, target: Currency, snapshot: readonly Rate[] | null): number | null {
  return displayMinor(baseMinor, base, target, snapshot);
}

export function historicalExpenseMinor(expense: Pick<Expense, 'amountMinor' | 'originalAmountMinor' | 'originalCurrency' | 'rateSnapshot'>, base: Currency, target: Currency): number | null {
  if (expense.originalCurrency === target && expense.originalAmountMinor != null) return expense.originalAmountMinor;
  if (target === base) return expense.amountMinor;
  if (!expense.rateSnapshot) return null;
  try { return displayMinor(expense.amountMinor, base, target, validateRates(JSON.parse(expense.rateSnapshot), base)); }
  catch { return null; }
}

export type Rate = { date: string; base: Currency; quote: Currency; rate: number };
export function validateRates(value: unknown, base: Currency): Rate[] {
  const quotes = CURRENCIES.filter(c => c !== base);
  if (!Array.isArray(value) || value.length !== quotes.length) throw new Error('Incomplete exchange rates.');
  const seen = new Set<string>();
  return value.map(row => {
    if (!row || row.base !== base || !quotes.includes(row.quote) || seen.has(row.quote)
      || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0
      || typeof row.date !== 'string' || !isValidDate(row.date)) throw new Error('Invalid exchange rates.');
    seen.add(row.quote);
    return { date: row.date, base, quote: row.quote, rate: row.rate };
  });
}
