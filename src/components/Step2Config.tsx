import { useMemo } from 'react';
import type {
  HaOperator,
  ParameterType,
  TailDirection,
  TestConfiguration,
  TestType,
} from '../types/hypothesis';
import { tCdf } from '../utils/stats';

const HA_TO_TAIL: Record<HaOperator, TailDirection> = {
  '<': 'left',
  '>': 'right',
  '!=': 'two-tailed',
};

interface Step2ConfigProps {
  parameter: ParameterType;
  haOperator: HaOperator;
  config: TestConfiguration;
  criticalValues: number[];
  degreesOfFreedom: number | null;
  onChangeConfig: (nextConfig: TestConfiguration) => void;
}

function densityAt(x: number, isT: boolean, df: number | null): number {
  if (isT && df && df >= 1) {
    // Numerical derivative of tCdf for smooth SVG curve rendering
    const h = 1e-4;
    return Math.max(0, (tCdf(x + h, df) - tCdf(x - h, df)) / (2 * h));
  }
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

interface DistributionSketchProps {
  tail: TailDirection;
  criticalValues: number[];
  isT: boolean;
  df: number | null;
}

function DistributionSketch({
  tail,
  criticalValues,
  isT,
  df,
}: DistributionSketchProps) {
  const width = 520;
  const height = 180;
  const padLeft = 28;
  const padRight = 28;
  const padTop = 18;
  const padBottom = 32;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xMin = -4;
  const xMax = 4;

  const { curvePath, shadedPaths, markers } = useMemo(() => {
    const steps = 160;
    const points: { x: number; y: number; px: number; py: number }[] = [];
    let maxY = 0.4;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + ((xMax - xMin) * i) / steps;
      const y = densityAt(x, isT, df);
      if (y > maxY) maxY = y;
      points.push({ x, y, px: 0, py: 0 });
    }

    const scaleY = maxY * 1.15;
    for (const pt of points) {
      pt.px = padLeft + ((pt.x - xMin) / (xMax - xMin)) * plotW;
      pt.py = padTop + plotH - (pt.y / scaleY) * plotH;
    }

    const baselineY = padTop + plotH;
    const dCurve = points
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.px.toFixed(1)} ${pt.py.toFixed(1)}`)
      .join(' ');

    const buildArea = (filterFn: (x: number) => boolean): string => {
      const subset = points.filter((pt) => filterFn(pt.x));
      if (subset.length < 2) return '';
      const topLine = subset
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.px.toFixed(1)} ${pt.py.toFixed(1)}`)
        .join(' ');
      const firstX = subset[0].px.toFixed(1);
      const lastX = subset[subset.length - 1].px.toFixed(1);
      return `${topLine} L ${lastX} ${baselineY.toFixed(1)} L ${firstX} ${baselineY.toFixed(1)} Z`;
    };

    const areas: string[] = [];
    const markerList: { x: number; px: number; label: string }[] = [];

    if (criticalValues.length > 0) {
      if (tail === 'left') {
        const crit = criticalValues[0];
        const area = buildArea((x) => x <= crit);
        if (area) areas.push(area);
        const clamped = Math.max(xMin + 0.15, Math.min(xMax - 0.15, crit));
        markerList.push({
          x: crit,
          px: padLeft + ((clamped - xMin) / (xMax - xMin)) * plotW,
          label: crit.toFixed(2),
        });
      } else if (tail === 'right') {
        const crit = criticalValues[0];
        const area = buildArea((x) => x >= crit);
        if (area) areas.push(area);
        const clamped = Math.max(xMin + 0.15, Math.min(xMax - 0.15, crit));
        markerList.push({
          x: crit,
          px: padLeft + ((clamped - xMin) / (xMax - xMin)) * plotW,
          label: crit.toFixed(2),
        });
      } else {
        const leftCrit = criticalValues[0];
        const rightCrit = criticalValues[criticalValues.length - 1];
        const leftArea = buildArea((x) => x <= leftCrit);
        const rightArea = buildArea((x) => x >= rightCrit);
        if (leftArea) areas.push(leftArea);
        if (rightArea) areas.push(rightArea);

        const lClamped = Math.max(xMin + 0.15, Math.min(xMax - 0.15, leftCrit));
        const rClamped = Math.max(xMin + 0.15, Math.min(xMax - 0.15, rightCrit));
        markerList.push({
          x: leftCrit,
          px: padLeft + ((lClamped - xMin) / (xMax - xMin)) * plotW,
          label: leftCrit.toFixed(2),
        });
        markerList.push({
          x: rightCrit,
          px: padLeft + ((rClamped - xMin) / (xMax - xMin)) * plotW,
          label: `+${Math.abs(rightCrit).toFixed(2)}`,
        });
      }
    }

    return {
      curvePath: dCurve,
      shadedPaths: areas,
      markers: markerList,
    };
  }, [tail, criticalValues, isT, df, plotW, plotH]);

  const baselineY = padTop + plotH;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: 540, height: 'auto', display: 'block' }}
        role="img"
        aria-label="Sampling distribution with shaded rejection region"
      >
        {shadedPaths.map((d, idx) => (
          <path key={idx} d={d} fill="#e03131" fillOpacity={0.26} />
        ))}

        <line
          x1={padLeft}
          y1={baselineY}
          x2={width - padRight}
          y2={baselineY}
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1.2}
        />

        <path
          d={curvePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
        />

        {markers.map((m, idx) => (
          <g key={idx}>
            <line
              x1={m.px}
              y1={padTop + 6}
              x2={m.px}
              y2={baselineY}
              stroke="#e03131"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={m.px}
              y={baselineY + 16}
              textAnchor="middle"
              fontSize="11"
              fill="#e03131"
              fontWeight={600}
            >
              {m.label}
            </text>
          </g>
        ))}

        <text
          x={width / 2}
          y={height - 3}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          opacity={0.7}
        >
          {isT
            ? `t-distribution${df !== null ? ` (df = ${df})` : ''}`
            : 'Standard Normal (z)'}
        </text>
      </svg>
    </div>
  );
}

export function Step2Config({
  parameter,
  haOperator,
  config,
  criticalValues,
  degreesOfFreedom,
  onChangeConfig,
}: Step2ConfigProps) {
  const expectedTail = HA_TO_TAIL[haOperator];
  const tailMatchesHa = config.tail === expectedTail;
  const isT = config.testType === 't-mean';

  const handleTailChange = (tail: TailDirection) => {
    onChangeConfig({ ...config, tail });
  };

  const handleAlphaChange = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0 && parsed < 1) {
      onChangeConfig({ ...config, alpha: parsed });
    }
  };

  const handleTestTypeChange = (testType: TestType) => {
    onChangeConfig({ ...config, testType });
  };

  const handleSampleSizeChange = (raw: string) => {
    if (raw.trim() === '') {
      onChangeConfig({ ...config, sampleSize: null });
      return;
    }
    const parsed = Number(raw);
    onChangeConfig({
      ...config,
      sampleSize: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    });
  };

  const formattedCriticalValues =
    criticalValues.length > 0
      ? criticalValues.map((v) => v.toFixed(3)).join(' and ')
      : isT && (config.sampleSize === null || config.sampleSize <= 1)
        ? 'Enter sample size n > 1 to compute df and t critical value'
        : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem' }}>
          Step 2: Tail, Alpha, Test Type, Sketch & Critical Values
        </h2>
        <p style={{ margin: 0, opacity: 0.78, fontSize: '0.92rem' }}>
          Match the tail to Ha, set significance level α, pick the appropriate test, and
          inspect the rejection region and critical value(s).
        </p>
      </div>

      {/* 1. Tail of the Test */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          1. Tail of the Test
        </legend>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'left', label: 'Left-tailed (<)' },
              { id: 'right', label: 'Right-tailed (>)' },
              { id: 'two-tailed', label: 'Two-tailed (≠)' },
            ] as { id: TailDirection; label: string }[]
          ).map((item) => {
            const active = config.tail === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTailChange(item.id)}
                aria-pressed={active}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: active ? 700 : 500,
                  border: active ? '2px solid currentColor' : '1px solid #8886',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.85rem' }}>
          {tailMatchesHa ? (
            <span style={{ opacity: 0.82 }}>
              Aligned with Step 1 where Ha uses <strong>{haOperator}</strong> ({expectedTail}
              ).
            </span>
          ) : (
            <span style={{ color: '#c92a2a', fontWeight: 500 }}>
              Check Step 1: Ha uses <strong>{haOperator}</strong>, which normally points to a{' '}
              <strong>{expectedTail}</strong> test.
            </span>
          )}
        </p>
      </fieldset>

      {/* 2. Significance Level (Alpha) & Test Type */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          2. Significance Level (α) & Test Type
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
              }}
            >
              Significance level (α)
            </span>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[0.01, 0.05, 0.1].map((preset) => {
                const active = config.alpha === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, alpha: preset })}
                    aria-pressed={active}
                    style={{
                      padding: '0.42rem 0.7rem',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                      border: active ? '2px solid currentColor' : '1px solid #8886',
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
              <input
                type="number"
                step="0.005"
                min="0.0001"
                max="0.9999"
                value={config.alpha}
                onChange={(e) => handleAlphaChange(e.target.value)}
                aria-label="Custom alpha"
                style={{
                  width: 84,
                  padding: '0.42rem 0.55rem',
                  borderRadius: 6,
                  border: '1px solid #8886',
                }}
              />
            </div>
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
              }}
            >
              Test statistic family
            </span>
            {parameter === 'mean' ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(
                  [
                    { id: 'z-mean', label: 'One-Sample z (σ known)' },
                    { id: 't-mean', label: 'One-Sample t (σ unknown)' },
                  ] as { id: TestType; label: string }[]
                ).map((item) => {
                  const active = config.testType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTestTypeChange(item.id)}
                      aria-pressed={active}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: active ? 700 : 500,
                        border: active ? '2px solid currentColor' : '1px solid #8886',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', paddingTop: '0.35rem' }}>
                <strong>One-Sample z-Test for Proportion</strong> (selected for parameter{' '}
                <em>p</em>)
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1rem', maxWidth: 260 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Sample size (n)
              {isT ? ' — needed for df = n − 1' : ' — also used in Step 3'}
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={config.sampleSize ?? ''}
              onChange={(e) => handleSampleSizeChange(e.target.value)}
              placeholder="e.g., 25"
              style={{ padding: '0.48rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
            />
          </label>
        </div>
      </fieldset>

      {/* 3. Distribution Sketch & Critical Value */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          3. Distribution Sketch & Critical Value(s)
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <DistributionSketch
            tail={config.tail}
            criticalValues={criticalValues}
            isT={isT}
            df={degreesOfFreedom}
          />

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 8,
              border: '1px solid #8884',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', opacity: 0.78 }}>
              Test: <strong>{config.testType}</strong> | Tail: <strong>{config.tail}</strong> |
              α: <strong>{config.alpha}</strong>
            </div>
            {isT && (
              <div style={{ fontSize: '0.88rem' }}>
                Degrees of freedom (df):{' '}
                <strong>{degreesOfFreedom !== null ? degreesOfFreedom : '—'}</strong>
              </div>
            )}
            <div style={{ fontSize: '0.95rem', marginTop: '0.2rem' }}>
              Critical value{criticalValues.length > 1 ? 's' : ''}:{' '}
              <strong>{formattedCriticalValues}</strong>
            </div>
            <div style={{ fontSize: '0.82rem', opacity: 0.75 }}>
              Shaded red region(s) show where the test statistic leads to rejecting H0.
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}