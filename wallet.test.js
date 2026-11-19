import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWallet, resetWallet, equity, pnl, decide, execute, POSITION, SIGNAL } from './wallet.js';

test('new wallet starts with 10,000 USDT, no BTC, holding cash', () => {
  const w = createWallet();
  assert.equal(w.usdt, 10000);
  assert.equal(w.btc, 0);
  assert.equal(w.position, POSITION.CASH);
  assert.deepEqual(w.trades, []);
});

test('BUY spends all USDT at the given price', () => {
  const w = createWallet();
  const t = execute(w, SIGNAL.BUY, { price: 50000, time: 1, change: 0.001 });
  assert.equal(w.usdt, 0);
  assert.equal(w.btc, 0.2);
  assert.equal(w.position, POSITION.BTC);
  assert.deepEqual(t, { time: 1, side: 'BUY', price: 50000, qty: 0.2, change: 0.001, usdt: 0, btc: 0.2, equity: 10000 });
});

test('SELL sells all BTC and books the profit', () => {
  const w = createWallet();
  execute(w, SIGNAL.BUY, { price: 50000, time: 1, change: 0.001 });
  const t = execute(w, SIGNAL.SELL, { price: 55000, time: 2, change: -0.001 });
  assert.equal(w.btc, 0);
  assert.equal(w.usdt, 11000);
  assert.equal(w.position, POSITION.CASH);
  assert.equal(t.qty, 0.2);
  assert.equal(w.trades.length, 2);
  assert.equal(pnl(w, 60000), 1000);
});

test('equity and PnL follow the price while holding BTC', () => {
  const w = createWallet();
  execute(w, SIGNAL.BUY, { price: 50000, time: 1, change: 0.001 });
  assert.equal(equity(w, 45000), 9000);
  assert.equal(pnl(w, 45000), -1000);
});

test('SELL is rejected while holding cash', () => {
  const w = createWallet();
  assert.equal(execute(w, SIGNAL.SELL, { price: 50000, time: 1, change: -0.01 }), null);
  assert.equal(w.usdt, 10000);
  assert.equal(w.trades.length, 0);
});

test('BUY is rejected while holding BTC', () => {
  const w = createWallet();
  execute(w, SIGNAL.BUY, { price: 50000, time: 1, change: 0.001 });
  assert.equal(execute(w, SIGNAL.BUY, { price: 40000, time: 2, change: 0.01 }), null);
  assert.equal(w.btc, 0.2);
  assert.equal(w.trades.length, 1);
});

test('HOLD never trades', () => {
  const w = createWallet();
  assert.equal(execute(w, SIGNAL.HOLD, { price: 50000, time: 1, change: 0 }), null);
});

test('reset restores the starting balance and clears trades', () => {
  const w = createWallet();
  execute(w, SIGNAL.BUY, { price: 50000, time: 1, change: 0.001 });
  resetWallet(w);
  assert.deepEqual(w, createWallet());
});

test('decide: BUY above +threshold with cash', () => {
  const d = decide({ lastClose: 100, forecast: 100.1, position: POSITION.CASH });
  assert.equal(d.signal, SIGNAL.BUY);
  assert.ok(Math.abs(d.change - 0.001) < 1e-12);
});

test('decide: SELL below -threshold with BTC', () => {
  assert.equal(decide({ lastClose: 100, forecast: 99.9, position: POSITION.BTC }).signal, SIGNAL.SELL);
});

test('decide: HOLD inside the threshold band', () => {
  assert.equal(decide({ lastClose: 100, forecast: 100.04, position: POSITION.CASH }).signal, SIGNAL.HOLD);
  assert.equal(decide({ lastClose: 100, forecast: 99.96, position: POSITION.BTC }).signal, SIGNAL.HOLD);
});

test('decide: HOLD when the signal does not fit the position', () => {
  assert.equal(decide({ lastClose: 100, forecast: 101, position: POSITION.BTC }).signal, SIGNAL.HOLD);
  assert.equal(decide({ lastClose: 100, forecast: 99, position: POSITION.CASH }).signal, SIGNAL.HOLD);
});
