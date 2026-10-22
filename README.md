# Pocket — personal expense tracker

An offline Expo app for Android and iOS. Record everyday spending, browse expenses by month and category, and see monthly totals and category breakdowns.

## Run the app

Requires Node.js 24.3+ and npm. From this directory:

```bash
npm install
npx expo start
```

Open the QR code in an Expo Go version compatible with SDK 57. Your phone and computer should be on the same network. You can also use `npm run android` with an Android emulator or `npm run ios` on macOS with an iOS simulator. If local networking is unavailable, try `npx expo start --tunnel` (requires internet and the tunnel dependency).

This project uses Expo SDK 57, React Native 0.86.3, React 19.2.3, Expo Router, and Expo SQLite. SDK 57 was selected for physical-device Expo Go compatibility according to the [Expo setup documentation](https://docs.expo.dev/get-started/create-a-project/). Check Expo Go compatibility if using a newer client.

## Features

- Overview: month navigation, spending total, expense count, category bars, and recent expenses.
- Expenses: date-grouped history, month/category filters, and an add expense action.
- Add/edit: positive decimal amount, one of nine categories, native date picker, and an optional note.
- Delete confirmation, unsaved-change confirmation, duplicate-submit prevention, and retryable save errors.
- Settings: MXN, USD, or EUR display currency. Changing currency relabels all amounts without conversion.
- Empty states and a recoverable database initialization screen.
- Five editable sample expenses load automatically into an empty mobile database on first launch after this update. They use dates in the current month and notes starting with `Sample ·`. Existing expenses are preserved, and samples do not return after deletion.
- Settings also offers **Load sample expenses** to explicitly restore examples when the expense list is empty. It shows success or storage errors and updates the overview immediately.

Data is stored locally in `pocket-expenses.db` using a versioned SQLite schema. It survives app restarts. Uninstalling the app, clearing its data, or removing its Expo Go project storage may delete it. There is no account, cloud backup, income tracking, or budgeting in this version.

Amounts are stored as integer minor units. All three supported currencies use two decimal places. The form accepts a decimal point or comma, but no thousands separators. Notes are limited to 500 characters. Dates are stored as local calendar dates rather than UTC timestamps.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npx expo install --check
```

The tests require no installed npm packages. They use Node's test runner and real SQLite through `node:sqlite` to verify calculations, calendar boundaries, filters, migrations, persistent CRUD, currency settings, failed mutations, retries, and duplicate submissions.

## Verification in the build environment

- All 30 automated tests passed, including automatic and explicit sample-data loading, preservation of existing expenses, rollback on import failure, safe exit from directly linked forms, and storage failure recovery.
- Full application TypeScript checking and ESLint passed after dependencies became available.
- Android and iOS production bundle exports succeeded (`npx expo export --platform all`).
- Expo dependency compatibility checking passes after aligning Expo, Expo Router, and TypeScript. React DOM is pinned to match React, and Expo Font is explicitly aligned with SDK 57 to prevent incompatible peer resolution.
- npm reported 22 audit findings (3 moderate, 19 high) during installation. These remain unresolved; do not apply breaking upgrades with `npm audit fix --force` without review.
- Physical-device behavior remains unverified. An earlier environment reported `EPERM` when binding a development server; this verification did not retest that restriction. Start Metro from your terminal to connect Expo Go. A successful bundle export does not confirm that a phone has loaded that bundle.

## If samples do not appear on the phone

Stop the existing Expo process with Ctrl+C, then start this exact project with a clean Metro cache:

```bash
cd /home/oliva/Documents/expense-tracker
npx expo start --clear
```

Close and reopen the project in Expo Go using that terminal's QR code. In the app, open **Settings → Load sample expenses**, then view the current month in **Overview**. The action is available only when the expense list is empty; it never replaces existing records. A normal fast refresh may preserve an already-initialized store, so use a full project reload when checking startup data loading.

After installing dependencies, run all checks above and test on both platforms:

1. Launch with an empty database; verify five sample expenses appear in the current month's overview and history. Edit/delete them, restart, and confirm they are not re-created. Existing user expenses must not be mixed with samples.
2. Add an expense, restart the app, and confirm persistence.
3. Edit its date, category, amount, and note; verify both history and overview refresh.
4. Change months and category filters; check totals and category bars.
5. Cancel and confirm deletion; verify the overview updates.
6. Select each currency, restart, and confirm the selection persists without changing amounts.
7. Try invalid amounts, leave the category blank, dismiss the keyboard, and cancel a dirty form.
8. Switch to airplane mode; add, edit, and delete expenses.
9. Cold-start through `pocketexpenses://expense`; save or close and confirm return to the overview.
10. Delete the five samples, load them explicitly from Settings, and verify immediate updates. With existing expenses, verify loading is unavailable.

## Structure

`app/` contains the three tab screens and expense modal. `src/expenses.ts` owns money, date, validation, filtering, and summary logic. The SQLite repository and subscribable store isolate persistence and mutation state from the React provider and shared UI. `tests/` contains domain, storage, and mutation tests.

Reusable storage mocks and fictional fixtures are documented in [tests/README.md](tests/README.md).
