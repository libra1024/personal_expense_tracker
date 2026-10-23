import type { Currency, Expense } from '../../../domain/expenses';
import { ExpenseRow } from '../expense-display';
import { Card } from '../layout';

/** Displays the latest three expenses without duplicating row presentation logic. */
export function RecentExpenses({
  entries,
  currency,
  baseCurrency,
}: {
  entries: Expense[];
  currency: Currency;
  baseCurrency: Currency;
}) {
  const recentEntries = entries.slice(0, 3);
  return (
    <Card className="gap-0 py-[3px]">
      {recentEntries.map((expense, index) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          currency={currency}
          baseCurrency={baseCurrency}
          last={index === recentEntries.length - 1}
        />
      ))}
    </Card>
  );
}
