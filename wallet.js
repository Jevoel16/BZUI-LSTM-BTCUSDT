// In-code dummy account for paper trading. No exchange, no API keys: balances live only in this object.

export const INITIAL_USDT = 10000;
export const THRESHOLD = 0.0005; // ±0.05% predicted move needed to trade

export const POSITION = Object.freeze({ CASH: 'cash', BTC: 'btc' });
export const SIGNAL = Object.freeze({ BUY: 'BUY', SELL: 'SELL', HOLD: 'HOLD' });

export function createWallet(usdt = INITIAL_USDT) {
  return { initialUsdt: usdt, usdt, btc: 0, position: POSITION.CASH, trades: [] };
}

/** Restores the starting balance and clears the trade history. */
export function resetWallet(wallet) {
  Object.assign(wallet, createWallet(wallet.initialUsdt));
}

export const equity = (wallet, price) => wallet.usdt + wallet.btc * price;
export const pnl = (wallet, price) => equity(wallet, price) - wallet.initialUsdt;

/**
 * BUY when the forecast is above the last close by more than the threshold and we hold cash,
 * SELL when it is below by more than the threshold and we hold BTC, HOLD otherwise.
 */
export function decide({ lastClose, forecast, position, threshold = THRESHOLD }) {
  const change = forecast / lastClose - 1;
  if (change > threshold && position === POSITION.CASH) return { signal: SIGNAL.BUY, change };
  if (change < -threshold && position === POSITION.BTC) return { signal: SIGNAL.SELL, change };
  return { signal: SIGNAL.HOLD, change };
}

/** All-in order sizing: BUY spends all USDT, SELL sells all BTC. Returns the trade, or null if the position doesn't allow it. */
export function execute(wallet, signal, { price, time, change }) {
  let qty;
  if (signal === SIGNAL.BUY && wallet.position === POSITION.CASH) {
    qty = wallet.usdt / price;
    wallet.btc += qty;
    wallet.usdt = 0;
    wallet.position = POSITION.BTC;
  } else if (signal === SIGNAL.SELL && wallet.position === POSITION.BTC) {
    qty = wallet.btc;
    wallet.usdt += qty * price;
    wallet.btc = 0;
    wallet.position = POSITION.CASH;
  } else {
    return null;
  }
  const trade = { time, side: signal, price, qty, change, usdt: wallet.usdt, btc: wallet.btc, equity: equity(wallet, price) };
  wallet.trades.push(trade);
  return trade;
}
