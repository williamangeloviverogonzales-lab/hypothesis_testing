export type ParameterType = 'mean' | 'proportion';

export type TestType = 'z-mean' | 't-mean' | 'z-prop';

export type TailDirection = 'left' | 'right' | 'two-tailed';

export type HaOperator = '<' | '>' | '!=';

export type H0Operator = '>=' | '<=' | '=';

export type ClaimTarget = 'H0' | 'Ha';

export type DecisionOutcome = 'reject-h0' | 'fail-to-reject-h0';

export type ProportionInputMode = 'phat' | 'count';

export interface HypothesisSetup {
  parameter: ParameterType;
  nullValue: number | null;
  haOperator: HaOperator;
  claimTarget: ClaimTarget;
  claimContext: string;
}

export interface TestConfiguration {
  tail: TailDirection;
  alpha: number;
  testType: TestType;
  sampleSize: number | null; // Required for t-test df (n - 1) and helpful across tests
}

export interface SampleInputs {
  // For one-sample z-mean and t-mean
  sampleMean: number | null; // x-bar
  populationStdDev: number | null; // sigma (for z-mean)
  sampleStdDev: number | null; // s (for t-mean)

  // For one-sample z-proportion (supports p-hat directly or x out of n)
  proportionInputMode: ProportionInputMode;
  sampleProportion: number | null; // p-hat
  successCount: number | null; // x
}

export interface DecisionRuleResult {
  ruleName: 'p-value' | 'critical-value';
  conditionText: string;
  comparisonText: string;
  rejectNull: boolean;
}

export interface HypothesisResults {
  degreesOfFreedom: number | null; // n - 1 for t-test, null for z-tests
  criticalValues: number[]; // e.g. [-1.96, 1.96] for two-tailed z, or [1.645] for right-tailed
  testStatistic: number | null;
  pValue: number | null;
  pValueRule: DecisionRuleResult | null;
  criticalValueRule: DecisionRuleResult | null;
  decision: DecisionOutcome | null;
  rulesAgree: boolean | null;
  interpretation: {
    sentence1: string;
    sentence2: string;
  } | null;
}

export interface HypothesisSession {
  currentStep: 1 | 2 | 3 | 4 | 5;
  setup: HypothesisSetup;
  config: TestConfiguration;
  inputs: SampleInputs;
  results: HypothesisResults;
}