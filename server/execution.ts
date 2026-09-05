import { appendAuditLog } from './audit.js';
import { buildCustomerContext } from './customerContext.js';
import { updateTransaction } from './dataService.js';
import { calculateCustomerFatigue } from './fatigue.js';
import { evaluateGuardrails } from './guardrails.js';
import { calculateOpportunityScore } from './opportunityScore.js';
import { getPolicies, recordInterventionCost } from './policies.js';
import { classifyFailureResponsibility } from './responsibility.js';
import { calculateCandidateStrategies } from './scoring.js';
import { diagnoseFailure } from './taxonomy.js';
import {
  AuditLogEntry,
  ExecutionResult,
  RecoveryAction,
  TransactionRecord,
} from './types.js';

export class ExecutionBlockedError extends Error {
  statusCode: number;
  code: string;
  ruleId?: string;

  constructor(message: string, code = 'EXECUTION_BLOCKED', ruleId?: string) {
    super(message);
    this.name = 'ExecutionBlockedError';
    this.statusCode = 400;
    this.code = code;
    this.ruleId = ruleId;
  }
}

export function executeSimulatedRecovery(
  tx: TransactionRecord,
  actionOverride?: RecoveryAction
): ExecutionResult {
  const policies = getPolicies();
  const diagnosis = diagnoseFailure(tx.failureCode);
  const context = buildCustomerContext(tx);

  const failureResponsibility = classifyFailureResponsibility(
    tx.failureCode,
    tx.fraudScore,
    tx.amount,
    policies.highValueThreshold,
    policies.fraudThreshold
  );

  const customerFatigue = calculateCustomerFatigue(tx, policies);

  // 1. Re-evaluate guardrails at time of execution
  const guardrailsResult = evaluateGuardrails(
    tx,
    diagnosis,
    policies,
    customerFatigue,
    failureResponsibility,
    actionOverride
  );
  const allowedSet = new Set(guardrailsResult.allowedActions);
  const blockedMap = new Map(guardrailsResult.blockedActions.map((b) => [b.action, b.reason]));

  const candidateStrategies = calculateCandidateStrategies(
    tx,
    context,
    diagnosis,
    policies,
    allowedSet,
    blockedMap,
    failureResponsibility,
    customerFatigue
  );

  // Determine the engine's canonical recommended action
  let recommendedAction: RecoveryAction = 'NO_ACTION';
  if (failureResponsibility.responsibility === 'RISK' || tx.fraudScore >= policies.fraudThreshold) {
    recommendedAction = 'NO_ACTION';
  } else if (
    failureResponsibility.responsibility === 'PERMANENT' ||
    tx.failureCode === 'CUSTOMER_CANCELLED' ||
    tx.failureCode === 'MANDATE_REVOKED'
  ) {
    recommendedAction = 'NO_ACTION';
  } else if (
    guardrailsResult.checks.some((c) => c.ruleId === 'GR-04-HIGH-VALUE' && c.status === 'REVIEW')
  ) {
    const hrStrat = candidateStrategies.find((s) => s.action === 'HUMAN_REVIEW');
    if (hrStrat && hrStrat.eligible) {
      recommendedAction = 'HUMAN_REVIEW';
    }
  }

  if (
    recommendedAction === 'NO_ACTION' &&
    failureResponsibility.responsibility !== 'RISK' &&
    tx.failureCode !== 'CUSTOMER_CANCELLED'
  ) {
    const eligible = candidateStrategies.filter((s) => s.eligible);
    if (eligible.length > 0) {
      const topStrat = [...eligible].sort((a, b) => b.netExpectedValue - a.netExpectedValue)[0];
      const noActionStrat = candidateStrategies.find((s) => s.action === 'NO_ACTION');
      if (
        topStrat.action !== 'NO_ACTION' &&
        noActionStrat &&
        topStrat.netExpectedValue <= noActionStrat.netExpectedValue
      ) {
        recommendedAction = 'NO_ACTION';
      } else {
        recommendedAction = topStrat.action;
      }
    }
  }

  const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Rule 1: Independent Backend Enforcement - Overall guardrail status BLOCK
  if (guardrailsResult.overallStatus === 'BLOCK') {
    const blockingRule = guardrailsResult.checks.find((c) => c.status === 'BLOCK');
    const note = `SIMULATED EXECUTION BLOCKED: Guardrail ${blockingRule?.ruleId || 'POLICY'} triggered. Reason: ${blockingRule?.reason}`;

    updateTransaction(tx.transactionId, {
      status: 'HALTED',
      lastDecision: 'NO_ACTION',
      lastSimulatedOutcome: 'SKIPPED',
    });

    const { score: oppScore } = calculateOpportunityScore(
      tx,
      failureResponsibility,
      diagnosis,
      customerFatigue,
      0,
      0
    );

    const auditEntry: AuditLogEntry = {
      auditId,
      transactionId: tx.transactionId,
      timestamp: new Date().toISOString(),
      amount: tx.amount,
      failureCode: tx.failureCode,
      failureCategory: diagnosis.category,
      failureResponsibility: failureResponsibility.responsibility,
      responsibleParty: failureResponsibility.responsibleParty,
      recoveryOpportunityScore: oppScore,
      fatigueStatus: customerFatigue,
      interventionHistory: {
        interventions24h: customerFatigue.interventions24h,
        consecutiveFailures: customerFatigue.consecutiveFailedInterventions,
      },
      exceptionReason: blockingRule?.reason || 'Blocked by risk & policy guardrails',
      customer: {
        id: tx.customerId,
        name: tx.customerName,
        fraudScore: tx.fraudScore,
        optOut: tx.customerOptOut,
        clv: tx.customerLifetimeValue,
      },
      guardrails: guardrailsResult.checks,
      candidateStrategies: candidateStrategies.map((s) => ({
        action: s.action,
        probability: s.recoveryProbability,
        expectedRecovery: s.expectedRecoveredRevenue,
        eligible: s.eligible,
      })),
      selectedAction: 'NO_ACTION',
      aiReasoning: note,
      executionStatus: 'BLOCKED',
      simulatedOutcome: 'EXECUTION_PREVENTED_BY_GUARDRAILS',
      recoveredAmount: 0,
      executionCost: 0,
    };
    appendAuditLog(auditEntry);

    throw new ExecutionBlockedError(
      `Execution Blocked: Guardrail rule ${blockingRule?.ruleId || 'POLICY'} (${blockingRule?.name || 'Policy Guardrail'}) triggered. ${blockingRule?.reason || 'Automated recovery is strictly blocked by policy.'}`,
      'GUARDRAIL_BLOCKED',
      blockingRule?.ruleId
    );
  }

  // Rule 2: Independent Backend Enforcement - Recommended action is NO_ACTION
  if (recommendedAction === 'NO_ACTION') {
    const note = `SIMULATED EXECUTION WITHHELD: Recommended action is NO_ACTION. Recovery intentionally withheld to prevent customer friction or negative margin.`;

    updateTransaction(tx.transactionId, {
      status: 'CLOSED_NO_ACTION',
      lastDecision: 'NO_ACTION',
      lastSimulatedOutcome: 'SKIPPED',
    });

    const { score: oppScore } = calculateOpportunityScore(
      tx,
      failureResponsibility,
      diagnosis,
      customerFatigue,
      0,
      0
    );

    const auditEntry: AuditLogEntry = {
      auditId,
      transactionId: tx.transactionId,
      timestamp: new Date().toISOString(),
      amount: tx.amount,
      failureCode: tx.failureCode,
      failureCategory: diagnosis.category,
      failureResponsibility: failureResponsibility.responsibility,
      responsibleParty: failureResponsibility.responsibleParty,
      recoveryOpportunityScore: oppScore,
      fatigueStatus: customerFatigue,
      interventionHistory: {
        interventions24h: customerFatigue.interventions24h,
        consecutiveFailures: customerFatigue.consecutiveFailedInterventions,
      },
      exceptionReason: 'Recommended action is NO_ACTION. Recovery intentionally withheld.',
      customer: {
        id: tx.customerId,
        name: tx.customerName,
        fraudScore: tx.fraudScore,
        optOut: tx.customerOptOut,
        clv: tx.customerLifetimeValue,
      },
      guardrails: guardrailsResult.checks,
      candidateStrategies: candidateStrategies.map((s) => ({
        action: s.action,
        probability: s.recoveryProbability,
        expectedRecovery: s.expectedRecoveredRevenue,
        eligible: s.eligible,
      })),
      selectedAction: 'NO_ACTION',
      aiReasoning: note,
      executionStatus: 'COMPLETED',
      simulatedOutcome: 'INTENTIONAL_INACTION',
      recoveredAmount: 0,
      executionCost: 0,
    };
    appendAuditLog(auditEntry);

    throw new ExecutionBlockedError(
      'Execution Rejected: Recommended action is NO_ACTION. Recovery is intentionally withheld to prevent customer friction or wasted budget.',
      'NO_ACTION_WITHHELD'
    );
  }

  // Rule 3: Independent Backend Enforcement - Recommended action is HUMAN_REVIEW
  if (recommendedAction === 'HUMAN_REVIEW') {
    const note = `SIMULATED EXECUTION WITHHELD: Human Review Required. High-value transactions cannot be executed automatically.`;

    const { score: oppScore } = calculateOpportunityScore(
      tx,
      failureResponsibility,
      diagnosis,
      customerFatigue,
      0,
      0
    );

    const auditEntry: AuditLogEntry = {
      auditId,
      transactionId: tx.transactionId,
      timestamp: new Date().toISOString(),
      amount: tx.amount,
      failureCode: tx.failureCode,
      failureCategory: diagnosis.category,
      failureResponsibility: failureResponsibility.responsibility,
      responsibleParty: failureResponsibility.responsibleParty,
      recoveryOpportunityScore: oppScore,
      fatigueStatus: customerFatigue,
      interventionHistory: {
        interventions24h: customerFatigue.interventions24h,
        consecutiveFailures: customerFatigue.consecutiveFailedInterventions,
      },
      exceptionReason: 'High-value transaction held in escrow for Human Operations Review.',
      customer: {
        id: tx.customerId,
        name: tx.customerName,
        fraudScore: tx.fraudScore,
        optOut: tx.customerOptOut,
        clv: tx.customerLifetimeValue,
      },
      guardrails: guardrailsResult.checks,
      candidateStrategies: candidateStrategies.map((s) => ({
        action: s.action,
        probability: s.recoveryProbability,
        expectedRecovery: s.expectedRecoveredRevenue,
        eligible: s.eligible,
      })),
      selectedAction: 'HUMAN_REVIEW',
      aiReasoning: note,
      executionStatus: 'QUEUED_FOR_REVIEW',
      simulatedOutcome: 'ESCALATED_TO_HUMAN_OPS',
      recoveredAmount: 0,
      executionCost: 0,
    };
    appendAuditLog(auditEntry);

    throw new ExecutionBlockedError(
      'Execution Rejected: Human Review Required. High-value transaction requires manual sign-off and cannot be executed automatically.',
      'HUMAN_REVIEW_REQUIRED'
    );
  }

  // Rule 4: Action Override Validation
  let targetAction: RecoveryAction = recommendedAction;
  if (actionOverride) {
    const overrideStrat = candidateStrategies.find((s) => s.action === actionOverride);
    if (!allowedSet.has(actionOverride) || !overrideStrat?.eligible) {
      const blockReason = blockedMap.get(actionOverride) || 'Action is ineligible under active policies';
      throw new ExecutionBlockedError(
        `Execution Blocked: Action ${actionOverride} is not permitted. Reason: ${blockReason}`,
        'ACTION_INELIGIBLE'
      );
    }
    targetAction = actionOverride;
  }

  const chosenStrat =
    candidateStrategies.find((s) => s.action === targetAction) || candidateStrategies[0];

  // Calculate opportunity score
  const { score: oppScore } = calculateOpportunityScore(
    tx,
    failureResponsibility,
    diagnosis,
    customerFatigue,
    chosenStrat ? chosenStrat.recoveryProbability : 0,
    chosenStrat ? chosenStrat.actionCost : 0
  );

  // Safe Execution Pipeline (for executable transactions such as TXN-DEMO-001, TXN-DEMO-008)
  const cost = chosenStrat.actionCost;
  recordInterventionCost(cost);

  const isSuccess = Math.random() <= chosenStrat.recoveryProbability;
  const recoveredAmount = isSuccess ? tx.amount : 0;
  const netRevenueGain = recoveredAmount - cost;

  const simulatedStatus = isSuccess ? 'SIMULATED_SUCCESS' : 'SIMULATED_FAILURE';
  const message = isSuccess
    ? `[SIMULATED] Successfully recovered ₹${tx.amount.toLocaleString('en-IN')} via ${chosenStrat.label}! Customer confirmed via NPCI/Gateway webhook.`
    : `[SIMULATED] Action ${chosenStrat.label} attempted. Customer did not complete payment within authorization window.`;

  // Update transaction record state
  const updatedAttemptCount = tx.attemptCount + 1;
  const newTxStatus = isSuccess
    ? 'RECOVERED'
    : updatedAttemptCount >= policies.maxRetries
    ? 'HALTED'
    : 'FAILED';

  updateTransaction(tx.transactionId, {
    status: newTxStatus,
    attemptCount: updatedAttemptCount,
    lastDecision: targetAction,
    lastSimulatedOutcome: isSuccess ? 'SUCCESS' : 'FAILURE',
    recoveredAt: isSuccess ? new Date().toISOString() : undefined,
  });

  const auditEntry: AuditLogEntry = {
    auditId,
    transactionId: tx.transactionId,
    timestamp: new Date().toISOString(),
    amount: tx.amount,
    failureCode: tx.failureCode,
    failureCategory: diagnosis.category,
    failureResponsibility: failureResponsibility.responsibility,
    responsibleParty: failureResponsibility.responsibleParty,
    recoveryOpportunityScore: oppScore,
    fatigueStatus: customerFatigue,
    interventionHistory: {
      interventions24h: customerFatigue.interventions24h,
      consecutiveFailures: customerFatigue.consecutiveFailedInterventions,
    },
    customer: {
      id: tx.customerId,
      name: tx.customerName,
      fraudScore: tx.fraudScore,
      optOut: tx.customerOptOut,
      clv: tx.customerLifetimeValue,
    },
    guardrails: guardrailsResult.checks,
    candidateStrategies: candidateStrategies.map((s) => ({
      action: s.action,
      probability: s.recoveryProbability,
      expectedRecovery: s.expectedRecoveredRevenue,
      eligible: s.eligible,
    })),
    selectedAction: targetAction,
    aiReasoning: chosenStrat.timingRecommendation,
    executionStatus: simulatedStatus,
    simulatedOutcome: message,
    recoveredAmount,
    executionCost: cost,
  };
  appendAuditLog(auditEntry);

  return {
    executionId: auditId,
    transactionId: tx.transactionId,
    actionTaken: targetAction,
    status: simulatedStatus,
    recoveredAmount,
    netRevenueGain,
    costIncurred: cost,
    messageDispatched:
      targetAction === 'WHATSAPP' || targetAction === 'EMAIL'
        ? 'Sent 1-click retry payment link'
        : undefined,
    channelUsed:
      targetAction === 'WHATSAPP'
        ? 'WHATSAPP_BUSINESS_API'
        : targetAction === 'EMAIL'
        ? 'TRANSACTIONAL_SES'
        : undefined,
    guardrailsVerified: true,
    auditLogId: auditId,
    timestamp: new Date().toISOString(),
    simulatedNote: `[SIMULATED EXECUTION] ${message}`,
  };
}
