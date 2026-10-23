import type { Rate } from "../domain/currency.ts";
import type { Currency, Expense, ExpenseInput } from "../domain/expenses.ts";

/** Application boundary for local expense persistence. */
export interface ExpenseRepository {
  initialize(): Promise<void>;
  list(): Promise<Expense[]>;
  loadDemoData(): Promise<Expense[]>;
  save(input: ExpenseInput, id?: number): Promise<number>;
  remove(id: number): Promise<void>;
  getBaseCurrency(): Promise<Currency>;
  getRateCache(): Promise<Rate[] | null>;
  setRateCache(rates: Rate[]): Promise<void>;
  getCurrency(): Promise<Currency>;
  setCurrency(currency: Currency): Promise<void>;
}
