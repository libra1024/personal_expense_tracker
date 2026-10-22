# Mocks para pruebas

Ejecuta todas las pruebas con `npm test`. No necesitan Expo Go ni paquetes npm instalados; requieren Node 24.3 o posterior.

`mocks/repository.ts` exporta `createMockRepository()`, un repositorio en memoria con la interfaz del repositorio de producción. Cada llamada crea datos y controles independientes. `fixtures/expenses.ts` contiene tres gastos ficticios de distintas fechas y categorías, que solo se cargan si la prueba los solicita.

```ts
import assert from 'node:assert/strict';
import { ExpenseStore } from '../src/store.ts';
import { createMockRepository } from './mocks/repository.ts';
import { sampleExpenses } from './fixtures/expenses.ts';

const disk = createMockRepository({ expenses: sampleExpenses, currency: 'MXN' });
const store = new ExpenseStore(disk.repo);
await store.initialize();
const input = { amountMinor: 1500, category: 'Other', date: '2026-10-21', note: '' } as const;

// Fallo puntual: el siguiente guardado falla; los posteriores funcionan.
disk.failNext('save', new Error('Disk full'));
await assert.rejects(store.save(input), /Disk full/);

// Fallo persistente y recuperación.
disk.fail(true);
disk.fail(false);

// Controlar cuándo termina una operación.
const resume = disk.pauseNext('save');
const saving = store.save(input);
resume();
await saving;
```

Los controles `failNext` y `pauseNext` aceptan `initialize`, `list`, `getCurrency`, `setCurrency`, `save`, `remove` y `loadDemoData`. La opción `now: () => '2026-10-21T12:00:00Z'` permite fijar la fecha de creación para resultados deterministas.

Las pruebas verifican el comportamiento del store: recuperación, conservación de datos, guardados demorados y prevención de duplicados. Las pruebas de integración del repositorio siguen usando SQLite real, para comprobar las consultas, migraciones y persistencia.
