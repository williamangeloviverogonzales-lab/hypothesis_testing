import type {
  ProportionInputMode,
  SampleInputs,
  TestConfiguration,
} from '../types/hypothesis';

interface Step3ComputeProps {
  nullValue: number | null;
  config: TestConfiguration;
  inputs: SampleInputs;
  testStatistic: number | null;
  pValue: number | null;
  degreesOfFreedom: number | null;
  onChangeConfig: (nextConfig: TestConfiguration) => void;
  onChangeInputs: (nextInputs: SampleInputs) => void;
}

function parseNullableNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function Step3Compute({
  nullValue,
  config,
  inputs,
  testStatistic,
  pValue,
  degreesOfFreedom,
  onChangeConfig,
  onChangeInputs,
}: Step3ComputeProps) {
  const isProportion = config.testType === 'z-prop';
  const isT = config.testType === 't-mean';

  const handleSampleSizeChange = (raw: string) => {
    const parsed = parseNullableNumber(raw);
    onChangeConfig({
      ...config,
      sampleSize: parsed !== null && parsed > 0 ? parsed : null,
    });
  };

  const handleProportionModeChange = (mode: ProportionInputMode) => {
    onChangeInputs({
      ...inputs,
      proportionInputMode: mode,
    });
  };

  const computedPHat =
    inputs.proportionInputMode === 'count'
      ? inputs.successCount !== null &&
        config.sampleSize !== null &&
        config.sampleSize > 0
        ? inputs.successCount / config.sampleSize
        : null
      : inputs.sampleProportion;

  const formulaText =
    config.testType === 'z-mean'
      ? 'z = (x̄ − μ₀) / (σ / √n)'
      : config.testType === 't-mean'
        ? 't = (x̄ − μ₀) / (s / √n) with df = n − 1'
        : 'z = (p̂ − p₀) / √[p₀(1 − p₀) / n]';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem' }}>
          Step 3: Sample Inputs, Test Statistic & p-value
        </h2>
        <p style={{ margin: 0, opacity: 0.78, fontSize: '0.92rem' }}>
          Enter the sample values for your{' '}
          <strong>{config.testType}</strong> ({config.tail}) test. Hypothesized value:{' '}
          <strong>{nullValue !== null ? nullValue : 'not set in Step 1'}</strong>.
        </p>
      </div>

      {/* 1. Sample Inputs */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          1. Sample Data Inputs
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Sample size (n)
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={config.sampleSize ?? ''}
              onChange={(e) => handleSampleSizeChange(e.target.value)}
              placeholder="e.g., 30"
              style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
            />
          </label>

          {!isProportion && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Sample mean (x̄)
                </span>
                <input
                  type="number"
                  step="any"
                  value={inputs.sampleMean ?? ''}
                  onChange={(e) =>
                    onChangeInputs({
                      ...inputs,
                      sampleMean: parseNullableNumber(e.target.value),
                    })
                  }
                  placeholder="e.g., 52.4"
                  style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
                />
              </label>

              {config.testType === 'z-mean' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Population std. dev. (σ)
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    value={inputs.populationStdDev ?? ''}
                    onChange={(e) =>
                      onChangeInputs({
                        ...inputs,
                        populationStdDev: parseNullableNumber(e.target.value),
                      })
                    }
                    placeholder="e.g., 8.0"
                    style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
                  />
                </label>
              )}

              {config.testType === 't-mean' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Sample std. dev. (s)
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    value={inputs.sampleStdDev ?? ''}
                    onChange={(e) =>
                      onChangeInputs({
                        ...inputs,
                        sampleStdDev: parseNullableNumber(e.target.value),
                      })
                    }
                    placeholder="e.g., 6.5"
                    style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
                  />
                </label>
              )}
            </>
          )}
        </div>

        {isProportion && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                Enter proportion via:
              </span>
              <button
                type="button"
                aria-pressed={inputs.proportionInputMode === 'phat'}
                onClick={() => handleProportionModeChange('phat')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: inputs.proportionInputMode === 'phat' ? 700 : 500,
                  border:
                    inputs.proportionInputMode === 'phat'
                      ? '2px solid currentColor'
                      : '1px solid #8886',
                }}
              >
                Sample proportion (p̂)
              </button>
              <button
                type="button"
                aria-pressed={inputs.proportionInputMode === 'count'}
                onClick={() => handleProportionModeChange('count')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: inputs.proportionInputMode === 'count' ? 700 : 500,
                  border:
                    inputs.proportionInputMode === 'count'
                      ? '2px solid currentColor'
                      : '1px solid #8886',
                }}
              >
                Success count (x) & n
              </button>
            </div>

            {inputs.proportionInputMode === 'phat' ? (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  maxWidth: 240,
                }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Sample proportion (p̂)
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="1"
                  value={inputs.sampleProportion ?? ''}
                  onChange={(e) =>
                    onChangeInputs({
                      ...inputs,
                      sampleProportion: parseNullableNumber(e.target.value),
                    })
                  }
                  placeholder="e.g., 0.72"
                  style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
                />
              </label>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxWidth: 240 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Number of successes (x)
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={inputs.successCount ?? ''}
                    onChange={(e) =>
                      onChangeInputs({
                        ...inputs,
                        successCount: parseNullableNumber(e.target.value),
                      })
                    }
                    placeholder="e.g., 36"
                    style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
                  />
                </label>
                {computedPHat !== null && (
                  <span style={{ fontSize: '0.85rem', opacity: 0.82 }}>
                    Computed p̂ = x / n = <strong>{computedPHat.toFixed(4)}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* 2. Test Statistic & p-value */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          2. Computed Test Statistic & p-value
        </legend>

        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.75rem' }}>
          Formula: <code>{formulaText}</code>
          {isT && degreesOfFreedom !== null ? ` (df = ${degreesOfFreedom})` : ''}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 8,
              border: '1px solid #8884',
            }}
          >
            <div style={{ fontSize: '0.82rem', opacity: 0.75 }}>Test Statistic</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {testStatistic !== null ? testStatistic.toFixed(4) : '—'}
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 8,
              border: '1px solid #8884',
            }}
          >
            <div style={{ fontSize: '0.82rem', opacity: 0.75 }}>p-value ({config.tail})</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {pValue !== null ? pValue.toFixed(4) : '—'}
            </div>
          </div>
        </div>

        {(testStatistic === null || pValue === null) && (
          <p style={{ margin: '0.7rem 0 0', fontSize: '0.84rem', opacity: 0.78 }}>
            Enter all required values above (and ensure hypothesized value μ₀ or p₀ is set
            in Step 1) to compute the test statistic and p-value.
          </p>
        )}
      </fieldset>
    </div>
  );
}