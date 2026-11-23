import type { DecisionOutcome, DecisionRuleResult } from '../types/hypothesis';

interface Step4DecisionProps {
  decision: DecisionOutcome | null;
  pValueRule: DecisionRuleResult | null;
  criticalValueRule: DecisionRuleResult | null;
  rulesAgree: boolean | null;
  testStatistic: number | null;
  pValue: number | null;
  criticalValues: number[];
  alpha: number;
}

export function Step4Decision({
  decision,
  pValueRule,
  criticalValueRule,
  rulesAgree,
  testStatistic,
  pValue,
  criticalValues,
  alpha,
}: Step4DecisionProps) {
  const isReady =
    pValueRule !== null &&
    criticalValueRule !== null &&
    decision !== null &&
    testStatistic !== null &&
    pValue !== null;

  const decisionLabel =
    decision === 'reject-h0' ? 'Reject H0' : 'Fail to Reject H0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem' }}>
          Step 4: Make a Decision About H0 (Dual Decision Rules)
        </h2>
        <p style={{ margin: 0, opacity: 0.78, fontSize: '0.92rem' }}>
          Compare both decision rules side-by-side—using the p-value against α and
          comparing the test statistic against the critical value(s).
        </p>
      </div>

      {!isReady ? (
        <div
          style={{
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid #8884',
            opacity: 0.85,
          }}
        >
          Complete Steps 1–3 (including critical values in Step 2 and sample inputs in
          Step 3) to evaluate both decision rules.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Rule 1: p-value rule */}
            <div
              style={{
                padding: '0.95rem',
                borderRadius: 8,
                border: '1px solid #8886',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                Rule 1: p-value Method
              </div>
              <div style={{ fontSize: '0.86rem', opacity: 0.85 }}>
                {pValueRule.conditionText}
              </div>
              <div style={{ fontSize: '0.92rem', marginTop: '0.2rem' }}>
                <strong>Comparison:</strong> {pValueRule.comparisonText}
              </div>
              <div style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
                <strong>Rule outcome:</strong>{' '}
                {pValueRule.rejectNull ? 'Reject H0' : 'Fail to reject H0'}
              </div>
            </div>

            {/* Rule 2: Critical / absolute value rule */}
            <div
              style={{
                padding: '0.95rem',
                borderRadius: 8,
                border: '1px solid #8886',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                Rule 2: Critical Value / Rejection Region Method
              </div>
              <div style={{ fontSize: '0.86rem', opacity: 0.85 }}>
                {criticalValueRule.conditionText}
              </div>
              <div style={{ fontSize: '0.92rem', marginTop: '0.2rem' }}>
                <strong>Comparison:</strong> {criticalValueRule.comparisonText}
              </div>
              <div style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
                <strong>Rule outcome:</strong>{' '}
                {criticalValueRule.rejectNull ? 'Reject H0' : 'Fail to reject H0'}
              </div>
            </div>
          </div>

          {/* Decision Summary Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 8,
              border: '2px solid currentColor',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ fontSize: '0.84rem', opacity: 0.78 }}>
              Decision About H0 (α = {alpha}, Critical Value
              {criticalValues.length > 1 ? 's' : ''}:{' '}
              {criticalValues.map((v) => v.toFixed(3)).join(', ')})
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{decisionLabel}</div>
            {rulesAgree === false && (
              <div style={{ fontSize: '0.85rem', color: '#c92a2a', marginTop: '0.25rem' }}>
                Note: The two rules gave different outcomes here (often due to
                boundary/rounding behavior). Double-check your test statistic, critical
                value, and α.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}