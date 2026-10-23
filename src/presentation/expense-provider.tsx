import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { openDatabaseAsync } from 'expo-sqlite';
import { createFrankfurterRateProvider } from '../infrastructure/frankfurter-rate-provider.ts';
import { createRepository } from '../infrastructure/sqlite-expense-repository.ts';
import type { ExpenseRepository } from '../application/expense-repository.ts';
import { ExpenseStore } from '../application/expense-store.ts';

/** Creates a lazy Expo SQLite adapter so presentation composes infrastructure without exposing it to screens. */
function nativeRepository(): ExpenseRepository {
  let connection: Promise<ExpenseRepository> | undefined;
  const get = () =>
    (connection ??= openDatabaseAsync('pocket-expenses.db')
      .then((db) => createRepository(db, { demoData: true }))
      .catch((error) => {
        connection = undefined;
        throw error;
      }));
  return {
    initialize: async () => (await get()).initialize(),
    list: async () => (await get()).list(),
    loadDemoData: async () => (await get()).loadDemoData(),
    save: async (input, id) => (await get()).save(input, id),
    remove: async (id) => (await get()).remove(id),
    getCurrency: async () => (await get()).getCurrency(),
    setCurrency: async (currency) => (await get()).setCurrency(currency),
    getBaseCurrency: async () => (await get()).getBaseCurrency(),
    getRateCache: async () => (await get()).getRateCache(),
    setRateCache: async (rates) => (await get()).setRateCache(rates),
  };
}

const StoreContext = createContext<ExpenseStore | null>(null);
/** Supplies the composed offline store to React screens and initializes it after mounting. */
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [store] = useState(
    () => new ExpenseStore(nativeRepository(), createFrankfurterRateProvider()),
  );
  useEffect(() => {
    void store.initialize();
  }, [store]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
export function useExpenses() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('ExpenseProvider is required.');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, store };
}
