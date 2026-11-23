import type {
  ClaimTarget,
  HaOperator,
  H0Operator,
  HypothesisSetup,
  ParameterType,
  TailDirection,
  TestType,
} from '../types/hypothesis';

const HA_TO_H0: Record<HaOperator, H0Operator> = {
  '<': '>=',
  '>': '<=',
  '!=': '=',
};

const HA_TO_TAIL: Record<HaOperator, TailDirection> = {
  '<': 'left',
  '>': 'right',
  '!=': 'two-tailed',
};

function formatOperatorSymbol(op: HaOperator | H0Operator): string {
  if (op === '<=') return '≤';
  if (op === '>=') return '≥';
  if (op === '!=') return '≠';
  return op;
}

interface Step1SetupProps {
  setup: HypothesisSetup;
  currentTestType: TestType;
  onChangeSetup: (nextSetup: HypothesisSetup, suggestedTestType?: TestType) => void;
  onSyncTail: (tail: TailDirection) => void;
}

export function Step1Setup({
  setup,
  currentTestType,
  onChangeSetup,
  onSyncTail,
}: Step1SetupProps) {
  const symbol = setup.parameter === 'mean' ? 'μ' : 'p';
  const paramLabel =
    setup.parameter === 'mean' ? 'Population Mean (μ)' : 'Population Proportion (p)';
  const valueDisplay =
    setup.nullValue !== null && Number.isFinite(setup.nullValue)
      ? String(setup.nullValue)
      : setup.parameter === 'mean'
        ? 'μ₀'
        : 'p₀';

  const h0Op = HA_TO_H0[setup.haOperator];

  const handleParameterChange = (parameter: ParameterType) => {
    let suggestedTestType: TestType = currentTestType;
    if (parameter === 'proportion') {
      suggestedTestType = 'z-prop';
    } else if (currentTestType === 'z-prop') {
      suggestedTestType = 'z-mean';
    }

    onChangeSetup(
      {
        ...setup,
        parameter,
        nullValue: null,
      },
      suggestedTestType
    );
  };

  const handleHaOperatorChange = (haOperator: HaOperator) => {
    onChangeSetup({
      ...setup,
      haOperator,
    });
    onSyncTail(HA_TO_TAIL[haOperator]);
  };

  const handleNullValueChange = (raw: string) => {
    if (raw.trim() === '') {
      onChangeSetup({ ...setup, nullValue: null });
      return;
    }
    const parsed = Number(raw);
    onChangeSetup({
      ...setup,
      nullValue: Number.isFinite(parsed) ? parsed : null,
    });
  };

  const handleClaimTargetChange = (claimTarget: ClaimTarget) => {
    onChangeSetup({ ...setup, claimTarget });
  };

  const proportionOutOfRange =
    setup.parameter === 'proportion' &&
    setup.nullValue !== null &&
    (setup.nullValue <= 0 || setup.nullValue >= 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem' }}>
          Step 1: Set Up H0 and Ha & Identify the Claim
        </h2>
        <p style={{ margin: 0, opacity: 0.78, fontSize: '0.92rem' }}>
          Choose the parameter being tested, write contradictory hypotheses (H0 always
          includes equality), and mark which statement is the claim.
        </p>
      </div>

      {/* 1. Parameter Selection */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          1. Parameter Being Tested
        </legend>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'mean', label: 'Population Mean (μ)' },
              { id: 'proportion', label: 'Population Proportion (p)' },
            ] as { id: ParameterType; label: string }[]
          ).map((item) => {
            const active = setup.parameter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleParameterChange(item.id)}
                aria-pressed={active}
                style={{
                  padding: '0.55rem 0.9rem',
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
      </fieldset>

      {/* 2. Hypothesized Value & Ha Inequality */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          2. Hypothesized Value ({paramLabel}) & Alternative Inequality (Ha)
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Hypothesized value ({setup.parameter === 'mean' ? 'μ₀' : 'p₀'})
            </span>
            <input
              type="number"
              step="any"
              value={setup.nullValue ?? ''}
              onChange={(e) => handleNullValueChange(e.target.value)}
              placeholder={setup.parameter === 'mean' ? 'e.g., 50' : 'e.g., 0.65'}
              style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
            />
            {proportionOutOfRange && (
              <span style={{ fontSize: '0.8rem', color: '#c92a2a' }}>
                For a proportion, p₀ is typically strictly between 0 and 1.
              </span>
            )}
          </label>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.35rem',
              }}
            >
              Ha inequality (determines tail)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(
                [
                  { op: '<', label: `<` },
                  { op: '>', label: `>` },
                  { op: '!=', label: `≠` },
                ] as { op: HaOperator; label: string }[]
              ).map((choice) => {
                const active = setup.haOperator === choice.op;
                return (
                  <button
                    key={choice.op}
                    type="button"
                    onClick={() => handleHaOperatorChange(choice.op)}
                    aria-pressed={active}
                    style={{
                      padding: '0.45rem 0.7rem',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                      border: active ? '2px solid currentColor' : '1px solid #8886',
                    }}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contradictory H0 & Ha Preview + Claim Tagging */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.85rem',
            borderRadius: 8,
            border: '1px solid #8884',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <strong>H0:</strong> {symbol} {formatOperatorSymbol(h0Op)} {valueDisplay}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
              <input
                type="radio"
                name="claimTarget"
                checked={setup.claimTarget === 'H0'}
                onChange={() => handleClaimTargetChange('H0')}
              />
              Mark H0 as the claim
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <strong>Ha:</strong> {symbol} {formatOperatorSymbol(setup.haOperator)}{' '}
              {valueDisplay}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
              <input
                type="radio"
                name="claimTarget"
                checked={setup.claimTarget === 'Ha'}
                onChange={() => handleClaimTargetChange('Ha')}
              />
              Mark Ha as the claim
            </label>
          </div>

          <div style={{ fontSize: '0.82rem', opacity: 0.78 }}>
            Current claim: <strong>{setup.claimTarget}</strong> (H0 and Ha are set as
            exact contradictory statements).
          </div>
        </div>
      </fieldset>

      {/* 3. Problem Context for Step 5 */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          3. Claim Context (for Step 5 Interpretation)
        </legend>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.88rem', opacity: 0.85 }}>
            Describe the claim in the context of the problem (completes “Thus, there
            is [no] significant evidence to claim that ...”)
          </span>
          <input
            type="text"
            value={setup.claimContext}
            onChange={(e) =>
              onChangeSetup({ ...setup, claimContext: e.target.value })
            }
            placeholder="e.g., the mean daily study time of students differs from 3 hours"
            style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
          />
        </label>
      </fieldset>
    </div>
  );
}