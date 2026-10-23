import type { ExchangeRateProvider } from '../application/exchange-rate-provider.ts';
import { validateRates, type Rate } from '../domain/currency.ts';
import { CURRENCIES, type Currency } from '../domain/expenses.ts';

/** Creates the Frankfurter HTTP adapter used to refresh optional exchange-rate reference data. */
export function createFrankfurterRateProvider(
  request: typeof fetch = fetch,
  timeoutMs = 8000,
): ExchangeRateProvider {
  return {
    fetchRates: (baseCurrency) => fetchFrankfurterRates(baseCurrency, request, timeoutMs),
  };
}

/** Requests, bounds, and validates a complete daily rate set for the selected base currency. */
async function fetchFrankfurterRates(
  baseCurrency: Currency,
  request: typeof fetch,
  timeoutMs: number,
): Promise<Rate[]> {
  const quotes = CURRENCIES.filter((currency) => currency !== baseCurrency).join(',');
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Exchange rate request timed out.'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      timeout,
      (async () => {
        const response = await request(
          `https://api.frankfurter.dev/v2/rates?base=${baseCurrency}&quotes=${quotes}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Exchange rate service returned ${response.status}.`);
        return validateRates(await response.json(), baseCurrency);
      })(),
    ]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}
