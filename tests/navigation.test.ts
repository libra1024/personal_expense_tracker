import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exitExpense } from '../src/navigation.ts';

test('closing a form returns to its previous screen when history exists', () => {
  const actions: string[] = [];
  exitExpense({ canGoBack: () => true, back: () => { actions.push('back'); }, replace: href => { actions.push(href); } });
  assert.deepEqual(actions, ['back']);
});

test('a cold-start expense link can exit to the overview without history', () => {
  const actions: string[] = [];
  exitExpense({ canGoBack: () => false, back: () => { actions.push('back'); }, replace: href => { actions.push(href); } });
  assert.deepEqual(actions, ['/']);
});
