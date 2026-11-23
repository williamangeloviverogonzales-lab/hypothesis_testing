import type {
  DecisionOutcome,
  DecisionRuleResult,
  HypothesisResults,
  HypothesisSession,
  TailDirection,
  TestType,
} from '../types/hypothesis';

// --- Standard Normal Helpers ---

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * ax);
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);

  return sign * y;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Acklam's rational approximation for inverse standard normal CDF (upper tail probability p in (0, 1))
export function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('Probability p must be strictly between 0 and 1.');
  }

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p <= phigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

// --- Student's t Helpers (continued fraction via Lentz's method) ---

function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return (
      Math.log(Math.PI) -
      Math.log(Math.sin(Math.PI * z)) -
      logGamma(1 - z)
    );
  }

  let x = p[0];
  const t = z - 1;
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (t + i);
  }
  const w = t + g + 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) +
    (t + 0.5) * Math.log(w) -
    w +
    Math.log(x)
  );
}

function betacf(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const eps = 3e-12;
  const fpMin = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) d = fpMin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < eps) break;
  }

  return h;
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }

  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

export function tCdf(t: number, df: number): number {
  if (df <= 0) {
    throw new Error('Degrees of freedom must be positive.');
  }
  const x = df / (df + t * t);
  const ibeta = regularizedIncompleteBeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - 0.5 * ibeta : 0.5 * ibeta;
}

// Inverse two-tailed t quantile: finds t > 0 such that P(|T| <= t) = 1 - twoTailAlpha
export function tCriticalPositive(alphaTwoTail: number, df: number): number {
  if (alphaTwoTail <= 0 || alphaTwoTail >= 1) {
    throw new Error('Alpha must be between 0 and 1.');
  }
  let low = 0;
  let high = 100;

  while (2 * (1 - tCdf(high, df)) > alphaTwoTail && high < 1e6) {
    high *= 2;
  }

  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (low + high);
    const twoTailProb = 2 * (1 - tCdf(mid, df));
    if (twoTailProb > alphaTwoTail) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return 0.5 * (low + high);
}

// --- Hypothesis Testing Core Calculations ---

export function computeCriticalValues(
  testType: TestType,
  tail: TailDirection,
  alpha: number,
  df: number | null
): number[] | null {
  if (alpha <= 0 || alpha >= 1) return null;

  if (testType === 't-mean') {
    if (df === null || df < 1) return null;
    if (tail === 'two-tailed') {
      const crit = tCriticalPositive(alpha, df);
      return [-crit, crit];
    }
    const crit = tCriticalPositive(2 * alpha, df);
    return tail === 'right' ? [crit] : [-crit];
  }

  // z-mean and z-prop use standard normal
  if (tail === 'two-tailed') {
    const crit = Math.abs(normalQuantile(alpha / 2));
    return [-crit, crit];
  }
  const crit = Math.abs(normalQuantile(alpha));
  return tail === 'right' ? [crit] : [-crit];
}

export function computePValue(
  testType: TestType,
  tail: TailDirection,
  stat: number,
  df: number | null
): number | null {
  if (!Number.isFinite(stat)) return null;

  if (testType === 't-mean') {
    if (df === null || df < 1) return null;
    const lower = tCdf(stat, df);
    const upper = 1 - lower;
    if (tail === 'left') return lower;
    if (tail === 'right') return upper;
    return Math.min(1, 2 * Math.min(lower, upper));
  }

  const lower = normalCdf(stat);
  const upper = 1 - lower;
  if (tail === 'left') return lower;
  if (tail === 'right') return upper;
  return Math.min(1, 2 * Math.min(lower, upper));
}

export function evaluateDecisionRules(
  tail: TailDirection,
  alpha: number,
  pValue: number | null,
  testStatistic: number | null,
  criticalValues: number[] | null
): {
  pValueRule: DecisionRuleResult | null;
  criticalValueRule: DecisionRuleResult | null;
  decision: DecisionOutcome | null;
  rulesAgree: boolean | null;
} {
  if (pValue === null || testStatistic === null || !criticalValues || criticalValues.length === 0) {
    return {
      pValueRule: null,
      criticalValueRule: null,
      decision: null,
      rulesAgree: null,
    };
  }

  const rejectByP = pValue < alpha;
  const pValueRule: DecisionRuleResult = {
    ruleName: 'p-value',
    conditionText: `Reject H0 if p-value < ${alpha}`,
    comparisonText: `p-value (${pValue.toFixed(4)}) ${rejectByP ? '<' : '≥'} α (${alpha})`,
    rejectNull: rejectByP,
  };

  let rejectByCrit = false;
  let comparisonText = '';
  let conditionText = '';

  if (tail === 'two-tailed') {
    const critMag = Math.abs(criticalValues[criticalValues.length - 1]);
    const absStat = Math.abs(testStatistic);
    rejectByCrit = absStat > critMag;
    conditionText = `Reject H0 if |Test Stat| > |Critical Value|`;
    comparisonText = `|${testStatistic.toFixed(4)}| (${absStat.toFixed(4)}) ${rejectByCrit ? '>' : '≤'} ${critMag.toFixed(4)}`;
  } else if (tail === 'right') {
    const critVal = criticalValues[0];
    rejectByCrit = testStatistic > critVal;
    conditionText = `Reject H0 if Test Stat > Critical Value`;
    comparisonText = `${testStatistic.toFixed(4)} ${rejectByCrit ? '>' : '≤'} ${critVal.toFixed(4)}`;
  } else {
    const critVal = criticalValues[0];
    rejectByCrit = testStatistic < critVal;
    conditionText = `Reject H0 if Test Stat < Critical Value`;
    comparisonText = `${testStatistic.toFixed(4)} ${rejectByCrit ? '<' : '≥'} ${critVal.toFixed(4)}`;
  }

  const criticalValueRule: DecisionRuleResult = {
    ruleName: 'critical-value',
    conditionText,
    comparisonText,
    rejectNull: rejectByCrit,
  };

  // Primary decision follows p-value rule; rulesAgree flags if critical-value rule differs
  const decision: DecisionOutcome = rejectByP ? 'reject-h0' : 'fail-to-reject-h0';

  return {
    pValueRule,
    criticalValueRule,
    decision,
    rulesAgree: rejectByP === rejectByCrit,
  };
}

export function evaluateSession(
  session: HypothesisSession
): Omit<HypothesisResults, 'interpretation'> {
  const { setup, config, inputs } = session;
  const n = config.sampleSize;
  const df =
    config.testType === 't-mean' && n !== null && Number.isInteger(n) && n > 1
      ? n - 1
      : null;

  const criticalValues = computeCriticalValues(
    config.testType,
    config.tail,
    config.alpha,
    df
  );

  let testStatistic: number | null = null;
  const nullVal = setup.nullValue;

  if (nullVal !== null && Number.isFinite(nullVal)) {
    if (config.testType === 'z-mean') {
      const xBar = inputs.sampleMean;
      const sigma = inputs.populationStdDev;
      if (
        xBar !== null &&
        sigma !== null &&
        n !== null &&
        sigma > 0 &&
        n > 0 &&
        Number.isFinite(xBar)
      ) {
        testStatistic = (xBar - nullVal) / (sigma / Math.sqrt(n));
      }
    } else if (config.testType === 't-mean') {
      const xBar = inputs.sampleMean;
      const s = inputs.sampleStdDev;
      if (
        xBar !== null &&
        s !== null &&
        df !== null &&
        n !== null &&
        s > 0 &&
        n > 1 &&
        Number.isFinite(xBar)
      ) {
        testStatistic = (xBar - nullVal) / (s / Math.sqrt(n));
      }
    } else if (config.testType === 'z-prop') {
      const pHat =
        inputs.proportionInputMode === 'count'
          ? inputs.successCount !== null && n !== null && n > 0
            ? inputs.successCount / n
            : null
          : inputs.sampleProportion;

      if (
        pHat !== null &&
        n !== null &&
        n > 0 &&
        nullVal > 0 &&
        nullVal < 1 &&
        Number.isFinite(pHat)
      ) {
        const se = Math.sqrt((nullVal * (1 - nullVal)) / n);
        testStatistic = se > 0 ? (pHat - nullVal) / se : null;
      }
    }
  }

  const pValue = computePValue(config.testType, config.tail, testStatistic ?? NaN, df);
  const validPValue = testStatistic !== null ? pValue : null;

  const { pValueRule, criticalValueRule, decision, rulesAgree } =
    evaluateDecisionRules(
      config.tail,
      config.alpha,
      validPValue,
      testStatistic,
      criticalValues
    );

  return {
    degreesOfFreedom: df,
    criticalValues: criticalValues ?? [],
    testStatistic,
    pValue: validPValue,
    pValueRule,
    criticalValueRule,
    decision,
    rulesAgree,
  };
}