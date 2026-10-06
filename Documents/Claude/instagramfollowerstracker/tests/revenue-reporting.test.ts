import test from 'node:test'; import assert from 'node:assert/strict'; import { rangeValue, safeRate } from '@/lib/revenue/reporting';
test('report rates are explicit and never NaN', () => { assert.equal(safeRate(0, 0), 0); assert.equal(safeRate(2, 4), 0.5); });
test('report range accepts supported values with 30d default', () => { assert.equal(rangeValue('7d'), '7d'); assert.equal(rangeValue('all'), 'all'); assert.equal(rangeValue('bad'), '30d'); });
