# LSTM forecast (BTC/USDT)

This page trains a tiny LSTM in the browser on live Binance prices and forecasts the next candles. It is an educational demo, not a trading tool.

## How it works

1. **Fetch.** Every second, `app.js` requests the latest candles for `BTCUSDT` from the Binance public klines API. It keeps only closed candles, because the candle still forming changes every second.
2. **Transform.** The model predicts each candle's percentage change from the previous close, not the price itself. Changes are normalized to zero mean and unit standard deviation. The mean and standard deviation are set once, when the model is created.
3. **Window.** The model reads a sliding window of the last `WINDOW` normalized changes (default 20) and predicts the next one. Each window and its next value form one training sample.
4. **Train.** When a new closed candle arrives, the model trains for 30 epochs on all samples (learning rate 0.005). Training is skipped if no new candle has closed.
5. **Forecast.** The model is run recursively: each predicted change is fed back in as input. Over 20 steps it produces 20 future prices, which are converted back to prices from the last close.

## The model

[tiny-lstm.js](./tiny-lstm.js) defines `TinyLSTM`, a single-cell LSTM with scalar input and hidden state.

- Gates: forget `f`, input `i`, candidate `c̃`, and output `o`, each with two weights (for the previous hidden state and the current input) and a bias.
- Cell update: `c = f·c_prev + i·c̃`, hidden state `h = o·tanh(c)`.
- Output: a linear layer `ŷ = wy·h + by`.
- Training: backpropagation through time (BPTT) with a squared-error loss.

The model has 14 parameters, so it is far too small to forecast markets reliably.

## Settings

| Control | Effect |
| --- | --- |
| Style | Chart type: candlestick or line. |
| Timeframe | Candle interval (for example 1 second, 1 minute). Changing it clears predictions and retrains. |
| Data | Number of recent candles to load (up to 1000). Changing it retrains from scratch. |
| Window size | Number of candles the model reads before each prediction. Changing it retrains from scratch. |

## Reading the page

- **Chart.** The solid line is the actual price. *LSTM predicted* marks the model's one-step-ahead prediction for each past candle. *LSTM forecast* is the 20-candle forecast after the last close. *Repeat last close* is a naive baseline that holds the last price flat.
- **Live network.** Shows one LSTM cell evaluated on the newest window: gate values, cell and hidden states, and the output ŷ. Edge thickness follows the weight magnitude.
- **Unrolled LSTM cells.** A force-directed graph with one cell per window step. Each cell's hidden and cell states feed the next cell, and the last cell feeds the forecast. Drag nodes to move them, drag the background to pan, and scroll to zoom.
- **Prediction check.** Compares the LSTM's past predictions with actual prices. The MAPE (mean absolute percentage error) of the LSTM is shown next to the repeat-last-close baseline. If the LSTM does not beat the baseline, the model has learned nothing useful.


## Limitations

- Predictions are made on 1-second and other short-interval prices, which are noisy and mostly random. Small errors can look like a trend.
- The model is retrained in the browser on each new candle, so results change from run to run because the weights start at random values.
- Results are not financial advice.
