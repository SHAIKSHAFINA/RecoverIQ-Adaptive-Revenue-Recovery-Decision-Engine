import React, { useEffect, useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Sparkles,
  MessageSquare,
  Mail,
  UserCheck,
  Ban,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { GuardrailBadge } from '../components/GuardrailBadge';
import { RiskIndicator } from '../components/RiskIndicator';
import { executeRecovery, simulateRecovery } from '../services/api';
import {
  CandidateStrategy,
  ExecutionResult,
  RecoveryAction,
  SimulationResult,
} from '../types';

interface Props {
  transactionId: string;
  onNavigateToLedger: () => void;
  onTxUpdated?: () => void;
}

export const SimulatorPage: React.FC<Props> = ({
  transactionId,
  onNavigateToLedger,
  onTxUpdated,
}) => {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected candidate action in UI (defaults to recommendedAction)
  const [selectedAction, setSelectedAction] = useState<RecoveryAction | null>(null);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await simulateRecovery(transactionId);
      setSimulation(res);
      setSelectedAction(res.recommendedAction);
    } catch (err: any) {
      setError(err.message || 'Failed to run recovery simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      runSimulation();
    }
  }, [transactionId]);

  const handleExecute = async () => {
    if (!simulation) return;
    const isBlocked = simulation.overallGuardrailStatus === 'BLOCK';
    const isNoAction = simulation.recommendedAction === 'NO_ACTION';
    const isHumanReview = simulation.recommendedAction === 'HUMAN_REVIEW';
    if (isBlocked || isNoAction || isHumanReview) {
      return;
    }
    try {
      setExecuting(true);
      const actionToExecute = selectedAction || simulation.recommendedAction;
      const res = await executeRecovery(simulation.transactionId, actionToExecute);
      setExecutionResult(res);
      setShowExecutionModal(true);
      if (onTxUpdated) onTxUpdated();
    } catch (err: any) {
      alert(err.message || 'Execution simulation failed');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <Cpu className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-800">
          Running Counterfactual Recovery Simulator...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating 7 candidate strategies, scoring net expected value, and verifying guardrails.
        </p>
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-3">
          <h2 className="font-bold text-base">Simulation Error</h2>
          <p className="text-sm">{error || 'Could not load simulation result for transaction.'}</p>
          <button
            onClick={runSimulation}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry Simulation
          </button>
        </div>
      </div>
    );
  }

  const {
    amount,
    currency,
    failureDiagnosis,
    customerContext,
    candidateStrategies,
    recommendedAction,
    recommendationReason,
    rejectionReasons,
    guardrails,
    overallGuardrailStatus,
    aiExplanation,
  } = simulation;

  const isBlocked = overallGuardrailStatus === 'BLOCK';
  const isNoAction = recommendedAction === 'NO_ACTION';
  const isHumanReview = recommendedAction === 'HUMAN_REVIEW';
  const isExecutable = !isBlocked && !isNoAction && !isHumanReview;

  const blockingGuardrail = guardrails.find((g) => g.status === 'BLOCK');

  const currentStrategy =
    candidateStrategies.find((s) => s.action === selectedAction) ||
    candidateStrategies.find((s) => s.action === recommendedAction)!;

  return (
    <div id="simulator-hero-page" className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Hero Title & Quick Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Recovery Decision Simulator
            </h1>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
              Simulation Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluating recovery strategies for Payment{' '}
            <strong className="font-mono text-slate-800">{transactionId}</strong> (
            ₹{amount.toLocaleString('en-IN')})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Policy Status:</span>
            <GuardrailBadge status={overallGuardrailStatus} />
          </div>

          {/* Conditional Execution Button based on Engine Enforcement */}
          {isBlocked ? (
            <button
              id="btn-execute-simulation"
              disabled
              title={`Execution Blocked: Guardrail ${blockingGuardrail?.ruleId || 'POLICY'} triggered. ${blockingGuardrail?.reason || ''}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-md text-xs font-medium cursor-not-allowed select-none"
            >
              <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Execution Blocked</span>
            </button>
          ) : isNoAction ? (
            <button
              id="btn-execute-simulation"
              disabled
              title="No Action: Recovery intentionally withheld"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-md text-xs font-medium cursor-not-allowed select-none"
            >
              <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>No Action Withheld</span>
            </button>
          ) : isHumanReview ? (
            <button
              id="btn-execute-simulation"
              disabled
              title="Human Review Required: High-value transaction requires manual operations approval"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-medium cursor-not-allowed select-none"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Manual Review Required</span>
            </button>
          ) : (
            <button
              id="btn-execute-simulation"
              onClick={handleExecute}
              disabled={executing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Executing...' : 'Execute Recovery Action'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Execution Policy Banner when Non-Executable */}
      {isBlocked && (
        <div
          id="execution-blocked-callout"
          className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-950"
        >
          <div className="p-1 bg-rose-100 rounded text-rose-700 shrink-0 mt-0.5">
            <Ban className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-rose-900">
                Blocked by Guardrail: {blockingGuardrail?.ruleId || 'POLICY'} ({blockingGuardrail?.name || 'Safety Rule'})
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded font-medium">
                Policy Enforced
              </span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              <strong>Reason:</strong> {blockingGuardrail?.reason || 'Safety guardrail prevents automated execution.'}
            </p>
            <p className="text-[11px] text-rose-700/80">
              The policy engine has halted automated recovery for this record. Strategy modeling remains accessible for audit.
            </p>
          </div>
        </div>
      )}

      {!isBlocked && isNoAction && (
        <div
          id="execution-withheld-callout"
          className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
        >
          <div className="p-1 bg-slate-200 rounded text-slate-700 shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-900">
                No Action — Recovery Withheld
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-medium">
                Strategic Inaction
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>Policy Rationale:</strong> {recommendationReason || 'Intervention cost or customer fatigue does not justify outbound recovery action.'}
            </p>
            <p className="text-[11px] text-slate-500">
              No recovery action dispatched. This protects margins and prevents customer fatigue.
            </p>
          </div>
        </div>
      )}

      {!isBlocked && isHumanReview && (
        <div
          id="execution-human-review-callout"
          className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950"
        >
          <div className="p-1 bg-amber-100 rounded text-amber-800 shrink-0 mt-0.5">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-amber-900">
                Manual Operations Review Required
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-medium">
                Escrow Hold
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Mandate:</strong> {recommendationReason || 'High-value transaction exceeds automated recovery threshold. Held for review.'}
            </p>
            <p className="text-[11px] text-amber-700/80">
              Automated execution withheld. A support specialist must verify relationship context before dispatching outreach.
            </p>
          </div>
        </div>
      )}

      {/* Row 1: Three Context Panels (Payment, Diagnosis, Customer Context) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: Payment Summary & Opportunity Score */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Payment Details</span>
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-mono font-bold text-slate-900">
                ₹{amount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 ml-1">INR</span>
            </div>
            {simulation.recoveryOpportunityScore !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Opportunity</span>
                <span
                  className={`font-mono text-xs font-semibold px-1.5 py-0.2 rounded border ${
                    simulation.recoveryOpportunityScore >= 70
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : simulation.recoveryOpportunityScore >= 40
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {simulation.recoveryOpportunityScore}/100
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">Instrument:</span>
              <span className="font-medium text-slate-800">
                {customerContext.preferredPaymentMethod}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">Attempt Count:</span>
              <span
                className={`font-mono text-xs ${
                  customerContext.attemptCount >= 3 ? 'text-rose-700 font-semibold' : 'text-slate-700'
                }`}
              >
                {customerContext.attemptCount} / 3
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Preferred Channel:</span>
              <span className="font-medium text-slate-800">
                {customerContext.preferredChannel}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: India / UPI Failure Diagnosis & Failure Responsibility */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Failure Diagnosis</span>
            {simulation.failureResponsibility ? (
              <span
                className={`text-[10px] font-mono font-medium uppercase px-1.5 py-0.2 rounded border ${
                  simulation.failureResponsibility.responsibility === 'TECHNICAL'
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                    : simulation.failureResponsibility.responsibility === 'BUSINESS'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : simulation.failureResponsibility.responsibility === 'PAYMENT_METHOD'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : simulation.failureResponsibility.responsibility === 'RISK'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                {simulation.failureResponsibility.responsibility}
              </span>
            ) : (
              <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                {failureDiagnosis.category}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-xs text-slate-900">
                {failureDiagnosis.failureCode}
              </span>
              {simulation.failureResponsibility && (
                <span className="text-[11px] text-slate-500">
                  Party: <strong className="text-slate-800">{simulation.failureResponsibility.responsibleParty}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {simulation.failureResponsibility?.explanation || failureDiagnosis.description}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-400 text-[11px]">Retryable: </span>
              <strong className={failureDiagnosis.isRetryable ? 'text-emerald-700' : 'text-rose-700'}>
                {failureDiagnosis.isRetryable ? 'YES' : 'NO'}
              </strong>
            </div>
            {failureDiagnosis.recommendedWaitMinutes > 0 && (
              <div>
                <span className="text-slate-400 text-[11px]">Backoff: </span>
                <strong className="text-slate-800">
                  {failureDiagnosis.recommendedWaitMinutes}m
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Customer Context & Recovery Fatigue */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Customer Context</span>
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div>
            <div className="font-medium text-xs text-slate-900">{customerContext.customerName}</div>
            <div className="text-[11px] text-slate-400 font-mono">{customerContext.email}</div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">Lifetime Value:</span>
              <span className="font-mono font-medium text-slate-900">
                ₹{customerContext.customerLifetimeValue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">24h Interventions:</span>
              <span
                className={`font-mono text-xs ${
                  simulation.customerFatigue?.isFatigued ? 'text-rose-700 font-semibold' : 'text-slate-700'
                }`}
              >
                {simulation.customerFatigue?.interventions24h ?? 0} / 2
                {simulation.customerFatigue?.isFatigued ? ' (Fatigued)' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-500">Cooldown Active:</span>
              <span
                className={`font-medium ${
                  simulation.customerFatigue?.isInCooldown ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {simulation.customerFatigue?.isInCooldown ? 'Yes (60m Rest)' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Candidate Recovery Actions Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Strategy Comparison
              </h2>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                Expected Value Model
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative analysis across conversion probability, expected recovery, customer friction, and action cost.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Selected Action:</span>
            <span className="font-medium text-slate-900 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              {selectedAction || recommendedAction}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <th className="py-2.5 px-4">Strategy</th>
                <th className="py-2.5 px-4 text-center">Probability</th>
                <th className="py-2.5 px-4 text-right">Expected Revenue</th>
                <th className="py-2.5 px-4 text-center">Friction</th>
                <th className="py-2.5 px-4 text-center">Action Cost</th>
                <th className="py-2.5 px-4 text-right">Net Expected Value</th>
                <th className="py-2.5 px-4 text-center">Risk</th>
                <th className="py-2.5 px-4 text-center">Eligibility</th>
                <th className="py-2.5 px-4 text-right">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {candidateStrategies.map((strat) => {
                const isRecommended = strat.action === recommendedAction;
                const isSelected = strat.action === selectedAction;
                const isEligible = strat.eligible;

                return (
                  <tr
                    key={strat.action}
                    onClick={() => setSelectedAction(strat.action)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-50/90'
                        : isRecommended
                        ? 'bg-emerald-50/30'
                        : !isEligible
                        ? 'opacity-60 bg-slate-50/30'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Action Name */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono text-slate-900">
                          {strat.action}
                        </span>
                        {isRecommended && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{strat.label}</div>
                    </td>

                    {/* Recovery Probability */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`font-mono font-medium text-xs ${
                          strat.recoveryProbability >= 0.65
                            ? 'text-emerald-700'
                            : strat.recoveryProbability >= 0.35
                            ? 'text-slate-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {Math.round(strat.recoveryProbability * 100)}%
                      </span>
                    </td>

                    {/* Expected Revenue */}
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                      ₹{strat.expectedRecoveredRevenue.toLocaleString('en-IN')}
                    </td>

                    {/* Customer Friction */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium border ${
                          strat.customerFriction === 'NONE'
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : strat.customerFriction === 'LOW'
                            ? 'bg-slate-50 text-slate-700 border-slate-200'
                            : strat.customerFriction === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {strat.customerFriction}
                      </span>
                    </td>

                    {/* Action Cost */}
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                      {strat.actionCost === 0 ? '₹0.00' : `₹${strat.actionCost.toFixed(2)}`}
                    </td>

                    {/* Net Expected Value */}
                    <td className="py-2.5 px-4 text-right font-mono font-medium">
                      <span
                        className={
                          strat.netExpectedValue > 0 ? 'text-slate-900' : 'text-slate-400'
                        }
                      >
                        ₹{strat.netExpectedValue.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Risk */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          strat.risk === 'LOW'
                            ? 'text-slate-700 bg-slate-50 border-slate-200'
                            : strat.risk === 'MEDIUM'
                            ? 'text-amber-800 bg-amber-50 border-amber-200'
                            : 'text-rose-800 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {strat.risk}
                      </span>
                    </td>

                    {/* Eligibility */}
                    <td className="py-2.5 px-4 text-center">
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]"
                          title={strat.rejectionReason || 'Ineligible'}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Excluded
                        </span>
                      )}
                    </td>

                    {/* Selection Radio */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex justify-end">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Strategy Timing Guidance */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Dispatch Window:</span>
            <span className="text-slate-600">{currentStrategy.timingRecommendation}</span>
          </div>
          {currentStrategy.rejectionReason && (
            <span className="text-rose-700 text-xs font-medium">
              Constraint: {currentStrategy.rejectionReason}
            </span>
          )}
        </div>
      </div>

      {/* Row 3: Decision Rationale & Alternative Exclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Why this action? */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="font-bold text-xs text-slate-900">Recommended Action: {recommendedAction}</h3>
            </div>
            {aiExplanation.isAiGenerated && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                Analysis Generated
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {aiExplanation.whyRecommended || recommendationReason}
          </p>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium">
            <span className="text-slate-500">Key Decision Driver: </span>{recommendationReason}
          </div>
        </div>

        {/* Why not alternatives? */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="font-bold text-xs text-slate-900">Alternative Strategy Analysis</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {aiExplanation.whyAlternativesRejected}
          </p>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1 divide-y divide-slate-100">
            {Object.entries(rejectionReasons).map(([act, reason]) => (
              <div key={act} className="text-[11px] flex items-start gap-2 py-1">
                <span className="font-mono font-medium text-slate-700 shrink-0">{act}:</span>
                <span className="text-slate-500">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Deterministic Guardrails Checklist */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <h3 className="font-bold text-xs text-slate-900">
                Deterministic Policy Guardrails
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Server-side enforcement checks evaluated prior to intervention dispatch.
            </p>
          </div>
          <GuardrailBadge status={overallGuardrailStatus} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {guardrails.map((rule) => (
            <div
              key={rule.ruleId}
              className={`p-3 rounded-md border text-xs space-y-1 ${
                rule.status === 'PASS'
                  ? 'bg-white border-slate-200'
                  : rule.status === 'REVIEW'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400 font-medium">
                  {rule.ruleId}
                </span>
                <GuardrailBadge status={rule.status} size="sm" />
              </div>
              <div className="font-medium text-slate-800">{rule.name}</div>
              <p className="text-[11px] text-slate-500 leading-snug">{rule.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: AI Customer Communication Draft Preview (WhatsApp / Email) */}
      {aiExplanation.customerCommunicationDraft && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {aiExplanation.customerCommunicationDraft.channel === 'WHATSAPP' ? (
                <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-slate-700" />
              )}
              <h3 className="font-bold text-xs text-slate-900">
                {aiExplanation.customerCommunicationDraft.channel} Outreach Preview
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Recipient: {customerContext.customerName}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            {aiExplanation.customerCommunicationDraft.subject && (
              <div className="text-xs font-medium text-slate-700 pb-2 border-b border-slate-200 font-mono">
                Subject: {aiExplanation.customerCommunicationDraft.subject}
              </div>
            )}
            <p className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {aiExplanation.customerCommunicationDraft.message}
            </p>
          </div>
        </div>
      )}

      {/* Simulated Execution Modal */}
      {showExecutionModal && executionResult && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Execution Outcome</h3>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Simulated
              </span>
            </div>

            {/* Outcome Banner */}
            <div
              className={`p-3.5 rounded-md border space-y-1.5 ${
                executionResult.status === 'SIMULATED_SUCCESS'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : executionResult.status === 'SIMULATED_BLOCKED'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : executionResult.status === 'SIMULATED_HUMAN_REVIEW'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs">
                  {executionResult.status === 'SIMULATED_SUCCESS'
                    ? 'Payment Successfully Recovered'
                    : executionResult.status === 'SIMULATED_BLOCKED'
                    ? 'Execution Halted by Policy'
                    : executionResult.status === 'SIMULATED_HUMAN_REVIEW'
                    ? 'Queued for Manual Operations Review'
                    : 'Strategic Inaction Recorded'}
                </span>
                <span className="font-mono font-bold text-xs">
                  {executionResult.recoveredAmount > 0
                    ? `+₹${executionResult.recoveredAmount.toLocaleString('en-IN')}`
                    : '₹0'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">{executionResult.simulatedNote}</p>
            </div>

            {/* Execution Audit Metrics */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 text-[11px]">Action Dispatched</span>
                <p className="font-medium font-mono text-slate-800 mt-0.5">
                  {executionResult.actionTaken}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 text-[11px]">Intervention Cost</span>
                <p className="font-medium font-mono text-slate-800 mt-0.5">
                  ₹{executionResult.costIncurred.toFixed(2)}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 text-[11px]">Audit Log ID</span>
                <p className="font-mono text-slate-600 truncate mt-0.5">
                  {executionResult.auditLogId}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 text-[11px]">Policy Status</span>
                <p className="font-medium text-emerald-700 mt-0.5">
                  Verified
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowExecutionModal(false);
                  runSimulation();
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowExecutionModal(false);
                  onNavigateToLedger();
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors"
              >
                View in Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
