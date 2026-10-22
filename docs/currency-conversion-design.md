# Historical currency conversion design

## Rule

An expense is immutable financial history. A rate update must never change the
value that was recorded for a past expense.

## Storage

All expense records, the latest validated rate cache, and each expense's rate snapshot are stored locally in the app's existing Expo SQLite database. This makes the history available after restarts and offline; there is no cloud account or automatic sync.

## New expenses

- The form selects a transaction currency: MXN, USD, or EUR.
- It saves the entered amount in that original currency plus a complete exchange
  rate snapshot for MXN, USD, and EUR from the time of saving.
- The snapshot comes from the newest cached daily rates when offline and from a
  refreshed cache when online.
- A foreign-currency expense cannot be saved without a valid cached snapshot.
  A base-currency expense remains saveable offline.

Example: an $80 USD expense saved when 1 USD = 18 MXN stores USD 80.00 and
MXN 1,440.00. Later rate changes do not change either value.

## Existing expenses

Records created before this feature have no original-currency or rate history.
They remain MXN records and are never retroactively converted or relabeled.

## Display

When viewing a saved expense in MXN, USD, or EUR, conversion uses that
expense's saved snapshot. It never uses today's rate. A row shows the original
currency/amount when it differs from the selected display currency.

## Rate updates

The app uses Frankfurter daily reference rates. It caches the latest valid
complete rate set locally. Network refreshes update the cache for future
expenses only; they do not mutate expenses. No expense details are sent to the
rate service.
