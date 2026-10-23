import type { Rate } from '../domain/currency.ts';
import type { Currency } from '../domain/expenses.ts';

/** Retrieves validated exchange-rate reference data without exposing a transport implementation. */
export interface ExchangeRateProvider {
  fetchRates(baseCurrency: Currency): Promise<Rate[]>;
}
