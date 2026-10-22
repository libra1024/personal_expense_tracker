import type { Currency, Expense, ExpenseInput } from './expenses.ts';
import { validateInput } from './expenses.ts';
import { fetchRates, type Rate } from './currency.ts';
import type { Repository } from './repository.ts';

type Snapshot = { baseCurrency: Currency; rates: Rate[] | null; refreshingRates: boolean; rateWarning: string | null; expenses: Expense[]; currency: Currency; ready: boolean; loading: boolean; busy: boolean; error: string | null };

export class ExpenseStore {
  private repository: Repository;
  private listeners = new Set<() => void>();
  private state: Snapshot = { baseCurrency: 'MXN', rates: null, refreshingRates: false, rateWarning: null, expenses: [], currency: 'MXN', ready: false, loading: false, busy: false, error: null };

  private now: () => number;
  private lastAttempt = -Infinity;
  private request: typeof fetch;
  private refresh: Promise<void> | undefined;
  constructor(repository: Repository, options: { request?: typeof fetch; now?: () => number } = {}) {
    this.repository = repository;
    this.request = options.request ?? fetch;
    this.now = options.now ?? Date.now;
  }
  getSnapshot = (): Snapshot => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private patch(update: Partial<Snapshot>) {
    this.state = { ...this.state, ...update };
    this.listeners.forEach(listener => listener());
  }
  async initialize() {
    if (this.state.loading || this.state.ready) return;
    this.patch({ loading: true, error: null });
    try {
      await this.repository.initialize();
      const expenses = await this.repository.list();
      const currency = await this.repository.getCurrency();
      const baseCurrency = await this.repository.getBaseCurrency();
      const rates = await this.repository.getRateCache().catch(() => null);
      this.patch({ expenses, currency, baseCurrency, rates, ready: true });
      void this.refreshRates();
    } catch (error) {
      this.patch({ error: error instanceof Error ? error.message : 'Unable to open your expenses.' });
    } finally { this.patch({ loading: false }); }
  }
  refreshRates(force = false): Promise<void> {
    if (this.refresh) return this.refresh;
    if (!this.state.ready || (!force && this.now() - this.lastAttempt < 300000)) return Promise.resolve();
    this.lastAttempt = this.now();
    this.patch({ refreshingRates: true });
    this.refresh = (async () => {
      try {
        const rates = await fetchRates(this.state.baseCurrency, this.request);
        await this.repository.setRateCache(rates);
        this.patch({ rates, rateWarning: null });
      } catch {
        this.patch({ rateWarning: 'Could not refresh rates. Saved rates may be out of date.' });
      } finally {
        this.patch({ refreshingRates: false });
        this.refresh = undefined;
      }
    })();
    return this.refresh;
  }
  private async mutate(action: () => Promise<void>): Promise<boolean> {
    if (this.state.busy || !this.state.ready) return false;
    this.patch({ busy: true });
    try { await action(); return true; }
    finally { this.patch({ busy: false }); }
  }
  save(input: ExpenseInput, id?: number) {
    return this.mutate(async () => {
      const normalized = validateInput(input);
      const original = this.state.expenses.find(e => e.id === id);
      if (id !== undefined && !original) throw new Error('This expense no longer exists.');
      const savedId = await this.repository.save(normalized, id);
      const expense: Expense = { ...normalized, id: savedId, createdAt: original?.createdAt ?? new Date().toISOString() };
      // Update from the committed write. A separate failed reload must never turn a successful save into a duplicate retry.
      this.patch({ expenses: [...this.state.expenses.filter(e => e.id !== savedId), expense] });
    });
  }
  remove(id: number) {
    return this.mutate(async () => {
      await this.repository.remove(id);
      this.patch({ expenses: this.state.expenses.filter(e => e.id !== id) });
    });
  }
  loadDemoData() {
    return this.mutate(async () => {
      const expenses = await this.repository.loadDemoData();
      this.patch({ expenses });
    });
  }
  setCurrency(currency: Currency) {
    return this.mutate(async () => {
      await this.repository.setCurrency(currency);
      this.patch({ currency });
      void this.refreshRates();
    });
  }
}
