import type { Currency, Expense, ExpenseInput } from './expenses.ts';
import { validateInput } from './expenses.ts';
import type { Repository } from './repository.ts';

type Snapshot = { expenses: Expense[]; currency: Currency; ready: boolean; loading: boolean; busy: boolean; error: string | null };

export class ExpenseStore {
  private repository: Repository;
  private listeners = new Set<() => void>();
  private state: Snapshot = { expenses: [], currency: 'MXN', ready: false, loading: false, busy: false, error: null };

  constructor(repository: Repository) { this.repository = repository; }
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
      this.patch({ expenses, currency, ready: true });
    } catch (error) {
      this.patch({ error: error instanceof Error ? error.message : 'Unable to open your expenses.' });
    } finally { this.patch({ loading: false }); }
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
    });
  }
}
