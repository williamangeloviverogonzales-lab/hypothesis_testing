import { useMemo, useState } from 'react';
import type {
  HypothesisSession,
  HypothesisSetup,
  SampleInputs,
  TailDirection,
  TestConfiguration,
  TestType,
} from './types/hypothesis';
import { evaluateSession } from './utils/stats';
import { buildInterpretation } from './utils/interpretation';
import { Step1Setup } from './components/Step1Setup';
import { Step2Config } from './components/Step2Config';
import { Step3Compute } from './components/Step3Compute';
import { Step4Decision } from './components/Step4Decision';
import { Step5Interpretation } from './components/Step5Interpretation';

const STEP_LABELS: { step: 1 | 2 | 3 | 4 | 5; title: string }[] = [
  { step: 1, title: 'H0, Ha & Claim' },
  { step: 2, title: 'Tail, Test & Crit' },
  { step: 3, title: 'Stat & p-value' },
  { step: 4, title: 'Decision Rules' },
  { step: 5, title: 'Interpretation' },
];

function createInitialSession(): HypothesisSession {
  return {
    currentStep: 1,
    setup: {
      parameter: 'mean',
      nullValue: null,
      haOperator: '!=',
      claimTarget: 'Ha',
      claimContext: '',
    },
    config: {
      tail: 'two-tailed',
      alpha: 0.05,
      testType: 'z-mean',
      sampleSize: null,
    },
    inputs: {
      sampleMean: null,
      populationStdDev: null,
      sampleStdDev: null,
      proportionInputMode: 'phat',
      sampleProportion: null,
      successCount: null,
    },
    results: {
      degreesOfFreedom: null,
      criticalValues: [],
      testStatistic: null,
      pValue: null,
      pValueRule: null,
      criticalValueRule: null,
      decision: null,
      rulesAgree: null,
      interpretation: null,
    },
  };
}

export function App() {
  const [session, setSession] = useState<HypothesisSession>(createInitialSession);

  const computedResults = useMemo(() => {
    const base = evaluateSession(session);
    const interpretation = buildInterpretation(
      base.decision,
      session.setup.claimContext
    );
    return {
      ...base,
      interpretation,
    };
  }, [session]);

  const activeSession: HypothesisSession = {
    ...session,
    results: computedResults,
  };

  const setStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setSession((prev) => ({ ...prev, currentStep: step }));
  };

  const handleSetupChange = (
    nextSetup: HypothesisSetup,
    suggestedTestType?: TestType
  ) => {
    setSession((prev) => ({
      ...prev,
      setup: nextSetup,
      config: {
        ...prev.config,
        testType: suggestedTestType ?? prev.config.testType,
      },
    }));
  };

  const handleSyncTail = (tail: TailDirection) => {
    setSession((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        tail,
      },
    }));
  };

  const handleConfigChange = (nextConfig: TestConfiguration) => {
    setSession((prev) => ({
      ...prev,
      config: nextConfig,
    }));
  };

  const handleInputsChange = (nextInputs: SampleInputs) => {
    setSession((prev) => ({
      ...prev,
      inputs: nextInputs,
    }));
  };

  const handleClaimContextChange = (nextContext: string) => {
    setSession((prev) => ({
      ...prev,
      setup: {
        ...prev.setup,
        claimContext: nextContext,
      },
    }));
  };

  const handleReset = () => {
    setSession(createInitialSession());
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">5-Step Hypothesis Testing Guide</h1>
          <p className="app-subtitle">
            One-sample z-test (mean & proportion) and one-sample t-test (mean) by W.A. Gonzales
          </p>
        </div>
        <button type="button" className="btn" onClick={handleReset}>
          Reset
        </button>
      </header>

      <nav className="stepper-nav" aria-label="Hypothesis testing steps">
        {STEP_LABELS.map(({ step, title }) => {
          const isActive = activeSession.currentStep === step;
          return (
            <button
              key={step}
              type="button"
              className="step-tab"
              onClick={() => setStep(step)}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="step-tab-num">Step {step}</span>
              <span className="step-tab-title">{title}</span>
            </button>
          );
        })}
      </nav>

      <section className="workspace-card">
        {activeSession.currentStep === 1 && (
          <Step1Setup
            setup={activeSession.setup}
            currentTestType={activeSession.config.testType}
            onChangeSetup={handleSetupChange}
            onSyncTail={handleSyncTail}
          />
        )}

        {activeSession.currentStep === 2 && (
          <Step2Config
            parameter={activeSession.setup.parameter}
            haOperator={activeSession.setup.haOperator}
            config={activeSession.config}
            criticalValues={activeSession.results.criticalValues}
            degreesOfFreedom={activeSession.results.degreesOfFreedom}
            onChangeConfig={handleConfigChange}
          />
        )}

        {activeSession.currentStep === 3 && (
          <Step3Compute
            nullValue={activeSession.setup.nullValue}
            config={activeSession.config}
            inputs={activeSession.inputs}
            testStatistic={activeSession.results.testStatistic}
            pValue={activeSession.results.pValue}
            degreesOfFreedom={activeSession.results.degreesOfFreedom}
            onChangeConfig={handleConfigChange}
            onChangeInputs={handleInputsChange}
          />
        )}

        {activeSession.currentStep === 4 && (
          <Step4Decision
            decision={activeSession.results.decision}
            pValueRule={activeSession.results.pValueRule}
            criticalValueRule={activeSession.results.criticalValueRule}
            rulesAgree={activeSession.results.rulesAgree}
            testStatistic={activeSession.results.testStatistic}
            pValue={activeSession.results.pValue}
            criticalValues={activeSession.results.criticalValues}
            alpha={activeSession.config.alpha}
          />
        )}

        {activeSession.currentStep === 5 && (
          <Step5Interpretation
            decision={activeSession.results.decision}
            claimTarget={activeSession.setup.claimTarget}
            claimContext={activeSession.setup.claimContext}
            interpretation={activeSession.results.interpretation}
            onChangeClaimContext={handleClaimContextChange}
          />
        )}
      </section>

      <footer className="workspace-footer">
        <button
          type="button"
          className="btn"
          disabled={activeSession.currentStep === 1}
          onClick={() =>
            setStep(Math.max(1, activeSession.currentStep - 1) as 1 | 2 | 3 | 4 | 5)
          }
        >
          Previous Step
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={activeSession.currentStep === 5}
          onClick={() =>
            setStep(Math.min(5, activeSession.currentStep + 1) as 1 | 2 | 3 | 4 | 5)
          }
        >
          Next Step
        </button>
      </footer>
    </main>
  );
}

export default App;