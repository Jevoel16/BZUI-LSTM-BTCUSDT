import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTheme } from './theme.js';

test('parseTheme keeps light and dark', () => {
  assert.equal(parseTheme('light'), 'light');
  assert.equal(parseTheme('dark'), 'dark');
});

test('parseTheme treats anything else as system', () => {
  for (const v of [null, undefined, '', 'system', 'Dark', 'blue']) assert.equal(parseTheme(v), 'system');
});
