import { useState } from 'react';
import type { ClaimTarget, DecisionOutcome } from '../types/hypothesis';

interface Step5InterpretationProps {
  decision: DecisionOutcome | null;
  claimTarget: ClaimTarget;
  claimContext: string;
  interpretation: {
    sentence1: string;
    sentence2: string;
  } | null;
  onChangeClaimContext: (nextContext: string) => void;
}

export function Step5Interpretation({
  decision,
  claimTarget,
  claimContext,
  interpretation,
  onChangeClaimContext,
}: Step5InterpretationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!interpretation) return;
    const fullText = `${interpretation.sentence1} ${interpretation.sentence2}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem' }}>
          Step 5: Two-Sentence Claim Interpretation
        </h2>
        <p style={{ margin: 0, opacity: 0.78, fontSize: '0.92rem' }}>
          State the final conclusion in two structured sentences tied to the decision on
          H0 and the problem context (Claim marked as <strong>{claimTarget}</strong>).
        </p>
      </div>

      {/* Inline Claim Context Input */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.9rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          Claim Context
        </legend>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.86rem', opacity: 0.82 }}>
            Completes Sentence 2 (“Thus, there is [no] significant evidence to claim
            that ...”)
          </span>
          <input
            type="text"
            value={claimContext}
            onChange={(e) => onChangeClaimContext(e.target.value)}
            placeholder="e.g., the proportion of on-time deliveries is greater than 0.90"
            style={{ padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #8886' }}
          />
        </label>
      </fieldset>

      {/* Two-Sentence Interpretation Output */}
      <fieldset style={{ border: '1px solid #8884', borderRadius: 8, padding: '0.95rem' }}>
        <legend style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          Final Two-Sentence Interpretation
        </legend>

        {!decision || !interpretation ? (
          <p style={{ margin: 0, opacity: 0.8 }}>
            Complete Steps 1–4 first so a decision on H0 is available to generate the
            interpretation.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                padding: '0.9rem',
                borderRadius: 8,
                border: '1px solid #8886',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: '0 0 0.55rem' }}>{interpretation.sentence1}</p>
              <p style={{ margin: 0 }}>{interpretation.sentence2}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button type="button" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy Two-Sentence Interpretation'}
              </button>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}