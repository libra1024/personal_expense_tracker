import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

/** Reads a project module relative to this test file, independent of the process directory. */
function readProjectFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

/** Keeps the route focused on composing controlled fields and navigation. */
test('expense route delegates draft state and mutations to its editor hook', () => {
  const route = readProjectFile('app/expense.tsx');
  assert.match(route, /useExpenseEditor/);
  assert.doesNotMatch(
    route,
    /\b(?:useState|useEffect|useRef|Alert|BackHandler|validateDraft|toBaseMinor)\b/,
  );
  assert.doesNotMatch(route, /react-native|datetimepicker/);
  assert.doesNotMatch(route, /\bstore\.(?:save|remove)\(/);
  for (const component of [
    'ExpenseFormLayout',
    'ExpenseFormHeader',
    'ExpenseFormActions',
    'MissingExpense',
  ]) {
    assert.match(route, new RegExp(`<${component}\\b`));
  }
});

/** Keeps editor orchestration and its pure draft adapter free from infrastructure dependencies. */
test('editor hook composes the provider and pure draft model without constructing adapters', () => {
  const hookPath = new URL('../src/presentation/hooks/use-expense-editor.ts', import.meta.url);
  assert.ok(existsSync(hookPath), 'a dedicated editor hook must exist');
  const hook = readFileSync(hookPath, 'utf8');
  assert.match(hook, /useExpenses/);
  assert.match(hook, /buildExpenseInput/);
  assert.match(hook, /hasExpenseDraftChanges/);
  assert.doesNotMatch(hook, /infrastructure\/|expo-sqlite|\bfetch\s*\(/);
  const model = readProjectFile('src/presentation/expense-editor-model.ts');
  assert.match(model, /\btype Draft[,\s]/);
  assert.match(model, /ExpenseEditorDraft = Draft &/);
  assert.doesNotMatch(model, /from ['"](?:react|expo-|\.\/expense-provider|.*infrastructure\/)/);
});

/** Encapsulates the native calendar and its visibility state in the controlled date field. */
test('date field owns native picker rendering instead of the expense route', () => {
  const dateField = readProjectFile('src/presentation/components/expense-form/date-field.tsx');
  assert.match(dateField, /@react-native-community\/datetimepicker/);
  assert.match(dateField, /onChange:\s*\(value: string\) => void/);
  assert.match(dateField, /minimumDate=\{new Date\(1900, 0, 1\)\}/);
  assert.match(dateField, /maximumDate=\{new Date\(9999, 11, 31\)\}/);
  assert.doesNotMatch(readProjectFile('app/expense.tsx'), /DateTimePicker|showPicker/);
});
