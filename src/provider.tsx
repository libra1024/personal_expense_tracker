import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { openDatabaseAsync } from 'expo-sqlite';
import { createRepository, type Repository } from './repository.ts';
import { ExpenseStore } from './store.ts';

function nativeRepository(): Repository {
  let connection: Promise<Repository> | undefined;
  const get = () => connection ??= openDatabaseAsync('pocket-expenses.db')
    .then(db => createRepository(db, { demoData: true }))
    .catch(error => { connection = undefined; throw error; });
  return {
    initialize: async () => (await get()).initialize(),
    list: async () => (await get()).list(),
    loadDemoData: async () => (await get()).loadDemoData(),
    save: async (input, id) => (await get()).save(input, id),
    remove: async id => (await get()).remove(id),
    getCurrency: async () => (await get()).getCurrency(),
    setCurrency: async currency => (await get()).setCurrency(currency),
  };
}

const StoreContext = createContext<ExpenseStore | null>(null);
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new ExpenseStore(nativeRepository()));
  useEffect(() => { void store.initialize(); }, [store]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
export function useExpenses() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('ExpenseProvider is required.');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, store };
}
