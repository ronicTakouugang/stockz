export function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEMA: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      prevEMA = sum / period;
      ema.push(prevEMA);
    } else {
      const currentEMA = data[i] * k + prevEMA! * (1 - k);
      prevEMA = currentEMA;
      ema.push(currentEMA);
    }
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i <= period) {
      rsi.push(null);
    } else {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
  }
  return rsi;
}

export function calculateMACD(data: number[]): { 
  macd: (number | null)[], 
  signal: (number | null)[], 
  histogram: (number | null)[] 
} {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macdLine = ema12.map((e12, i) => {
    const e26 = ema26[i];
    return (e12 !== null && e26 !== null) ? e12 - e26 : null;
  });

  const validMacdValues = macdLine.filter((v): v is number => v !== null);
  const signalLineValues = calculateEMA(validMacdValues, 9);
  
  const signalLine: (number | null)[] = new Array(macdLine.length - validMacdValues.length + 8).fill(null).concat(signalLineValues);
  
  // Align signal line (it starts after 26 + 9 periods approximately)
  // Actually, let's just make sure it matches the indices of macdLine
  const finalSignalLine: (number | null)[] = [];
  let signalIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || i < 26 + 8) { // 26 for EMA26, then 9 more for signal
        finalSignalLine.push(null);
    } else {
        finalSignalLine.push(signalLineValues[signalIdx++] ?? null);
    }
  }

  const histogram = macdLine.map((m, i) => {
    const s = finalSignalLine[i];
    return (m !== null && s !== null) ? m - s : null;
  });

  return { macd: macdLine, signal: finalSignalLine, histogram };
}

export function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
  middle: (number | null)[],
  upper: (number | null)[],
  lower: (number | null)[]
} {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = middle[i]!;
      const variance = slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / period;
      const sd = Math.sqrt(variance);
      upper.push(avg + stdDev * sd);
      lower.push(avg - stdDev * sd);
    }
  }

  return { middle, upper, lower };
}

export function calculateATR(high: number[], low: number[], close: number[], period: number = 14): (number | null)[] {
  const tr: number[] = [high[0] - low[0]];
  for (let i = 1; i < close.length; i++) {
    tr.push(Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    ));
  }

  const atr: (number | null)[] = [];
  let prevATR = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      atr.push(null);
    } else if (i === period - 1) {
      atr.push(prevATR);
    } else {
      const currentATR = (prevATR * (period - 1) + tr[i]) / period;
      prevATR = currentATR;
      atr.push(currentATR);
    }
  }

  return atr;
}
