import type { DecisionOutcome } from '../types/hypothesis';

function cleanClaimContext(rawContext: string): string {
  const trimmed = rawContext.trim().replace(/[.!?]+$/, '');
  if (!trimmed) {
    return '[state the claim in the context of the problem]';
  }
  // Avoid "claim that that ..." if the user already starts with "that "
  return trimmed.replace(/^that\s+/i, '');
}

export function buildInterpretation(
  decision: DecisionOutcome | null,
  claimContext: string
): { sentence1: string; sentence2: string } | null {
  if (!decision) {
    return null;
  }

  const isReject = decision === 'reject-h0';
  const context = cleanClaimContext(claimContext);

  const sentence1 = isReject
    ? 'Since the decision is to reject H0, there is significant evidence to support the claim.'
    : 'Since the decision is to fail to reject H0, there is no significant evidence to support the claim.';

  const sentence2 = isReject
    ? `Thus, there is significant evidence to claim that ${context}.`
    : `Thus, there is no significant evidence to claim that ${context}.`;

  return {
    sentence1,
    sentence2,
  };
}