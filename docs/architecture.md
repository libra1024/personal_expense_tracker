# Architecture

## Purpose

Pocket is an offline-first personal expense tracker. The device database is
its source of truth. Network exchange rates are optional cached reference data
for future expense snapshots; a refresh must never block local expense work or
rewrite historical records.

## Boundaries

- **Domain** — expense and currency rules: validation, exact money handling,
  filtering, summaries, and historical-rate calculations. No React, SQLite, or
  network imports.
- **Application** — use cases and state orchestration: initialize, save,
  delete, select a display currency, load samples, and refresh a rate cache.
  It depends on repository contracts, not Expo APIs.
- **Infrastructure** — Expo SQLite repository and the Frankfurter rate client.
  This layer implements ports used by the application layer.
- **Presentation** — Expo Router screens, React provider, and reusable React
  Native UI components. Screens invoke application use cases and render state;
  they do not execute SQL or own exchange-rate policy.

## Dependency direction

`presentation → application → domain`

`infrastructure → application/domain`

Domain code cannot import inward-facing infrastructure or presentation code.
Infrastructure is composed at the application boundary by the native provider.

## Offline-first rules

1. Expense mutations commit to SQLite before presentation state changes.
2. Database initialization, local CRUD, and sample data work without a
   network connection.
3. Rate responses are validated before caching. Refresh errors preserve cached
   values and do not block expense mutations.
4. An expense stores its original currency and rate snapshot. Current rate
   updates apply only to future expenses; historical values are immutable.
5. Legacy records without rate metadata remain in their stored base currency.
