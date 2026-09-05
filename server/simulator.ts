import { buildCustomerContext } from './customerContext.js';
import { calculateCustomerFatigue } from './fatigue.js';
import { buildFallbackExplanation, generateAiExplanation } from './geminiService.js';
import { evaluateGuardrails } from './guardrails.js';
import { calculateOpportunityScore } from './opportunityScore.js';
import { getPolicies } from './policies.js';
import { classifyFailureResponsibility } from './responsibility.js';
import { calculateCandidateStrategies } from './scoring.js';
import { diagnoseFailure } from './taxonomy.js';
import {
  CandidateStrategy,
  RecoveryAction,
  SimulationResult,
  TransactionRecord,
} from './types.js';

export async function simulateRecovery(
  tx: TransactionRecord,
  skipAi = false
): Promise<SimulationResult> {
  const policies = getPolicies();
  const diagnosis = diagnoseFailure(tx.failureCode);
  const customerContext = buildCustomerContext(tx);

  // 1. Classify failure responsibility (Technical vs Business vs Payment Method vs Permanent vs Risk)
  const failureResponsibility = classifyFailureResponsibility(
    tx.failureCode,
    tx.fraudScore,
    tx.amount,
    policies.highValueThreshold,
    policies.fraudThreshold
  );

  // 2. Evaluate Customer Intervention Fatigue & Cooldown state
  const customerFatigue = calculateCustomerFatigue(tx, policies);

  // 3. Evaluate deterministic guardrails with fatigue and responsibility telemetry
  const guardrailsResult = evaluateGuardrails(
    tx,
    diagnosis,
    policies,
    customerFatigue,
    failureResponsibility
  );
  const allowedActionSet = new Set<RecoveryAction>(guardrailsResult.allowedActions);
  const blockedActionMap = new Map<RecoveryAction, string>(
    guardrailsResult.blockedActions.map((b) => [b.action, b.reason])
  );

  // 4. Calculate candidate strategies with responsibility & fatigue weighting
  const candidateStrategies = calculateCandidateStrategies(
    tx,
    customerContext,
    diagnosis,
    policies,
    allowedActionSet,
    blockedActionMap,
    failureResponsibility,
    customerFatigue
  );

  // Decision logic: Select best permissible strategy based on expected value & guardrails
  let recommendedAction: RecoveryAction = 'NO_ACTION';
  let recommendationReason = '';

  // Case 1: Fraud Risk guardrail triggered - Automated recovery blocked
  if (failureResponsibility.responsibility === 'RISK' || tx.fraudScore >= policies.fraudThreshold) {
    recommendedAction = 'NO_ACTION';
    recommendationReason = `High fraud risk score (${tx.fraudScore.toFixed(2)}) exceeds safety threshold (${policies.fraudThreshold}). Automated recovery terminated.`;
  }
  // Case 2: Permanent failure / explicit cancellation
  else if (
    failureResponsibility.responsibility === 'PERMANENT' ||
    tx.failureCode === 'CUSTOMER_CANCELLED' ||
    tx.failureCode === 'MANDATE_REVOKED'
  ) {
    recommendedAction = 'NO_ACTION';
    recommendationReason = 'Customer deliberately dismissed payment prompt or revoked mandate. Inaction respected.';
  }
  // Case 3: High Value guardrail requires VIP / Human Review
  else if (
    guardrailsResult.checks.some((c) => c.ruleId === 'GR-04-HIGH-VALUE' && c.status === 'REVIEW')
  ) {
    const hrStrat = candidateStrategies.find((s) => s.action === 'HUMAN_REVIEW');
    if (hrStrat && hrStrat.eligible) {
      recommendedAction = 'HUMAN_REVIEW';
      recommendationReason = `Mandated by high-value escrow policy (>= ₹${policies.highValueThreshold.toLocaleString('en-IN')}) for VIP customer protection.`;
    }
  }

  // Case 4: Pick eligible candidate with highest netExpectedValue
  if (recommendedAction === 'NO_ACTION' && failureResponsibility.responsibility !== 'RISK' && tx.failureCode !== 'CUSTOMER_CANCELLED') {
    const eligibleStrategies = candidateStrategies.filter((s) => s.eligible);

    if (eligibleStrategies.length === 0) {
      recommendedAction = 'NO_ACTION';
      if (customerFatigue.isFatigued) {
        recommendationReason =
          'Recovery probability is acceptable, but contacting the customer now exceeds the customer-intervention fatigue policy.';
      } else if (tx.attemptCount >= policies.maxRetries) {
        recommendationReason = `Maximum recovery attempts exhausted (${tx.attemptCount}/${policies.maxRetries}). Payment halted to prevent customer fatigue.`;
      } else if (tx.customerOptOut) {
        recommendationReason = 'Customer opted out of notifications and failure requires customer action. Inaction chosen to respect privacy.';
      } else {
        recommendationReason = 'No candidate recovery action met eligibility, policy safety, and profitability criteria.';
      }
    } else {
      // Sort by netExpectedValue descending
      const sorted = [...eligibleStrategies].sort(
        (a, b) => b.netExpectedValue - a.netExpectedValue
      );
      const topStrat = sorted[0];

      // If top candidate's net recovery isn't substantially better than NO_ACTION, or is low probability, choose NO_ACTION
      const noActionStrat = candidateStrategies.find((s) => s.action === 'NO_ACTION');
      if (
        topStrat.action !== 'NO_ACTION' &&
        noActionStrat &&
        topStrat.netExpectedValue <= noActionStrat.netExpectedValue
      ) {
        recommendedAction = 'NO_ACTION';
        recommendationReason = 'Net expected return from active intervention does not exceed baseline inaction value after costs and friction.';
      } else {
        recommendedAction = topStrat.action;
        recommendationReason = `Highest net expected recovery value (₹${topStrat.netExpectedValue.toLocaleString('en-IN')}) with ${Math.round(topStrat.recoveryProbability * 100)}% success likelihood.`;
      }
    }
  }

  // Calculate deterministic Recovery Opportunity Score (0-100)
  const chosenStrat = candidateStrategies.find((s) => s.action === recommendedAction);
  const bestProb = chosenStrat ? chosenStrat.recoveryProbability : 0;
  const bestCost = chosenStrat ? chosenStrat.actionCost : 0;
  const { score: recoveryOpportunityScore } = calculateOpportunityScore(
    tx,
    failureResponsibility,
    diagnosis,
    customerFatigue,
    bestProb,
    bestCost
  );

  // Rejection reasons map for UI
  const rejectionReasons: Record<string, string> = {};
  for (const s of candidateStrategies) {
    if (s.action !== recommendedAction) {
      rejectionReasons[s.action] =
        s.rejectionReason ||
        (s.eligible
          ? `Lower net expected return (₹${s.netExpectedValue.toFixed(0)}) than chosen ${recommendedAction}.`
          : 'Ineligible based on safety policy or failure taxonomy.');
    }
  }

  // Generate AI Explanation with Gemini (or deterministic fallback if skipAi requested)
  const recStrat = candidateStrategies.find((s) => s.action === recommendedAction);
  const aiExplanation = skipAi
    ? buildFallbackExplanation(tx, customerContext, diagnosis, recommendedAction, recStrat)
    : await generateAiExplanation(
        tx,
        customerContext,
        diagnosis,
        candidateStrategies,
        recommendedAction,
        guardrailsResult.checks
      );

  const isBlocked = guardrailsResult.overallStatus === 'BLOCK';
  const isNoAction = recommendedAction === 'NO_ACTION';
  const isHumanReview = recommendedAction === 'HUMAN_REVIEW';
  const isExecutable = !isBlocked && !isNoAction && !isHumanReview;

  let executionBlockReason: string | undefined = undefined;
  if (isBlocked) {
    const blockingCheck = guardrailsResult.checks.find((c) => c.status === 'BLOCK');
    executionBlockReason = `Execution Blocked: Guardrail rule ${blockingCheck?.ruleId || 'POLICY'} (${blockingCheck?.name || 'Policy Guardrail'}) triggered — ${blockingCheck?.reason || 'Automated recovery is blocked.'}`;
  } else if (isNoAction) {
    executionBlockReason = 'No Action — Recovery Intentionally Withheld: Inaction selected to avoid customer annoyance, respect cancellation intent, or preserve margin.';
  } else if (isHumanReview) {
    executionBlockReason = 'Human Review Required: High-value transaction requires manual operations verification before execution.';
  }

  return {
    transactionId: tx.transactionId,
    amount: tx.amount,
    currency: tx.currency,
    failureDiagnosis: diagnosis,
    customerContext,
    failureResponsibility,
    customerFatigue,
    recoveryOpportunityScore,
    candidateStrategies,
    recommendedAction,
    recommendationReason,
    rejectionReasons,
    guardrails: guardrailsResult.checks,
    overallGuardrailStatus: guardrailsResult.overallStatus,
    isExecutable,
    executionBlockReason,
    aiExplanation,
    policyConstraintsApplied: {
      maxAttemptsExceeded: tx.attemptCount >= policies.maxRetries,
      budgetRemaining: Math.max(0, policies.interventionBudget - policies.budgetSpent),
      withinRecoveryWindow: true,
    },
    timestamp: new Date().toISOString(),
  };
}
