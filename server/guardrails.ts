import {
  CustomerFatigueStatus,
  FailureDiagnosis,
  FailureResponsibilityInfo,
  GuardrailCheckResult,
  GuardrailStatus,
  MerchantPolicies,
  RecoveryAction,
  TransactionRecord,
} from './types.js';

export function evaluateGuardrails(
  tx: TransactionRecord,
  diagnosis: FailureDiagnosis,
  policies: MerchantPolicies,
  fatigueStatus?: CustomerFatigueStatus,
  responsibilityInfo?: FailureResponsibilityInfo,
  intendedAction?: RecoveryAction
): {
  checks: GuardrailCheckResult[];
  overallStatus: GuardrailStatus;
  allowedActions: RecoveryAction[];
  blockedActions: { action: RecoveryAction; reason: string }[];
} {
  const checks: GuardrailCheckResult[] = [];
  const blockedActions: { action: RecoveryAction; reason: string }[] = [];

  // Rule 1: Fraud Risk Score Guardrail
  const isHighFraud = tx.fraudScore >= policies.fraudThreshold;
  checks.push({
    ruleId: 'GR-01-FRAUD',
    name: 'Fraud & Anti-Abuse Risk',
    description: `Block automated recovery if fraud score is above ${policies.fraudThreshold.toFixed(2)}.`,
    status: isHighFraud ? 'BLOCK' : 'PASS',
    triggered: isHighFraud,
    reason: isHighFraud
      ? `Customer fraud score (${tx.fraudScore.toFixed(2)}) meets or exceeds danger threshold (${policies.fraudThreshold.toFixed(2)}). All automated retries blocked.`
      : `Customer fraud score (${tx.fraudScore.toFixed(2)}) is within safe parameters.`,
  });

  if (isHighFraud) {
    blockedActions.push(
      { action: 'RETRY_NOW', reason: 'Fraud score exceeds safe policy threshold.' },
      { action: 'RETRY_LATER', reason: 'Fraud score exceeds safe policy threshold.' },
      { action: 'WHATSAPP', reason: 'High fraud accounts cannot receive automated recovery links.' },
      { action: 'EMAIL', reason: 'High fraud accounts cannot receive automated recovery links.' },
      { action: 'ALTERNATIVE_PAYMENT_METHOD', reason: 'Automated payment method switch blocked for high-risk accounts.' }
    );
  }

  // Rule 2: Max Attempts / Retry Fatigue Guardrail
  const isMaxAttempts = tx.attemptCount >= policies.maxRetries;
  checks.push({
    ruleId: 'GR-02-ATTEMPTS',
    name: 'Intervention Velocity & Fatigue',
    description: `Halt attempts when transaction has reached ${policies.maxRetries} tries to prevent bank throttling & annoyance.`,
    status: isMaxAttempts ? 'BLOCK' : 'PASS',
    triggered: isMaxAttempts,
    reason: isMaxAttempts
      ? `Payment has reached attempt cap (${tx.attemptCount}/${policies.maxRetries}). Further retries and automated outreach are prohibited.`
      : `Attempt count (${tx.attemptCount}/${policies.maxRetries}) is within allowed intervention volume.`,
  });

  if (isMaxAttempts) {
    blockedActions.push(
      { action: 'RETRY_NOW', reason: 'Max retry limit reached.' },
      { action: 'RETRY_LATER', reason: 'Max retry limit reached.' },
      { action: 'WHATSAPP', reason: 'Max notification fatigue reached.' },
      { action: 'EMAIL', reason: 'Max notification fatigue reached.' },
      { action: 'ALTERNATIVE_PAYMENT_METHOD', reason: 'Max attempt velocity cap reached. Stop automated intervention.' }
    );
  }

  // Rule 3: Customer Opt-Out / DND Guardrail
  const isOptOut = tx.customerOptOut;
  checks.push({
    ruleId: 'GR-03-OPT-OUT',
    name: 'Customer Communication Preference (DND)',
    description: 'Enforce TRAI/DND and privacy opt-out against automated messaging.',
    status: isOptOut ? 'BLOCK' : 'PASS',
    triggered: isOptOut,
    reason: isOptOut
      ? 'Customer has actively opted out of recovery communications. WhatsApp, SMS, and Email outreach are strictly blocked.'
      : 'Customer has active consent for payment status communications.',
  });

  if (isOptOut) {
    blockedActions.push(
      { action: 'WHATSAPP', reason: 'Customer has opted out of communications.' },
      { action: 'EMAIL', reason: 'Customer has opted out of communications.' }
    );
  }

  // Rule 4: High-Value Transaction Guardrail (Human in the Loop)
  const isHighValue = tx.amount >= policies.highValueThreshold;
  checks.push({
    ruleId: 'GR-04-HIGH-VALUE',
    name: 'High-Value Escrow & Review Threshold',
    description: `Flag transactions >= ₹${policies.highValueThreshold.toLocaleString('en-IN')} for human ops oversight.`,
    status: isHighValue ? 'REVIEW' : 'PASS',
    triggered: isHighValue,
    reason: isHighValue
      ? `Transaction amount (₹${tx.amount.toLocaleString('en-IN')}) exceeds auto-recovery threshold (₹${policies.highValueThreshold.toLocaleString('en-IN')}). Requires human oversight.`
      : `Transaction amount (₹${tx.amount.toLocaleString('en-IN')}) is within automated clearance limits.`,
  });

  // Rule 5: Permanent Failure Guardrail (Never blindly retry permanent errors)
  const isPermanent = diagnosis.category === 'permanent';
  checks.push({
    ruleId: 'GR-05-PERMANENT-FAILURE',
    name: 'Taxonomy Failure Integrity',
    description: 'Strict prohibition on blind automatic retries for permanent payment failures.',
    status: isPermanent ? 'BLOCK' : 'PASS',
    triggered: isPermanent,
    reason: isPermanent
      ? `Failure code ${diagnosis.failureCode} is classified as PERMANENT (${diagnosis.description}). Direct retries will consistently fail.`
      : `Failure code ${diagnosis.failureCode} is classified as ${diagnosis.category.toUpperCase()} and can be recovered with proper strategy.`,
  });

  if (isPermanent) {
    blockedActions.push(
      { action: 'RETRY_NOW', reason: 'Cannot retry permanent failures.' },
      { action: 'RETRY_LATER', reason: 'Cannot retry permanent failures.' }
    );
    if (diagnosis.failureCode === 'CUSTOMER_CANCELLED') {
      blockedActions.push(
        { action: 'ALTERNATIVE_PAYMENT_METHOD', reason: 'Customer explicitly dismissed checkout. Inaction respected.' },
        { action: 'WHATSAPP', reason: 'Customer explicitly dismissed checkout.' },
        { action: 'EMAIL', reason: 'Customer explicitly dismissed checkout.' }
      );
    }
  }

  // Rule 6: Intervention Budget Exhaustion Guardrail
  const isBudgetExhausted = policies.budgetSpent >= policies.interventionBudget;
  checks.push({
    ruleId: 'GR-06-BUDGET',
    name: 'Intervention Budget Ceiling',
    description: `Halt billable interventions if merchant budget (₹${policies.interventionBudget.toLocaleString('en-IN')}) is spent.`,
    status: isBudgetExhausted ? 'BLOCK' : 'PASS',
    triggered: isBudgetExhausted,
    reason: isBudgetExhausted
      ? `Merchant recovery budget spent (₹${policies.budgetSpent.toLocaleString('en-IN')} / ₹${policies.interventionBudget.toLocaleString('en-IN')}). Paid interventions disabled.`
      : `Intervention budget healthy (₹${(policies.interventionBudget - policies.budgetSpent).toLocaleString('en-IN')} remaining).`,
  });

  if (isBudgetExhausted) {
    blockedActions.push(
      { action: 'WHATSAPP', reason: 'Intervention budget exhausted for billing cycle.' },
      { action: 'HUMAN_REVIEW', reason: 'Intervention budget exhausted for manual operations.' }
    );
  }

  // Rule 7: Customer Intervention Fatigue & Cooldown Guardrail
  const isFatigued = fatigueStatus?.isFatigued ?? false;
  checks.push({
    ruleId: 'GR-07-FATIGUE',
    name: 'Customer Intervention Fatigue & Cooldown',
    description: `Prevent customer notification exhaustion (max ${policies.maxNotifications24h} in 24h, ${policies.cooldownHours}h cooldown).`,
    status: isFatigued ? 'BLOCK' : 'PASS',
    triggered: isFatigued,
    reason: isFatigued
      ? `Customer reached notification fatigue limit: ${fatigueStatus?.fatigueReason || 'Active cooldown'}. Direct communication blocked.`
      : `Customer communication velocity is safe (${fatigueStatus?.interventions24h || 0}/${policies.maxNotifications24h} messages in 24h).`,
  });

  if (isFatigued) {
    blockedActions.push(
      { action: 'WHATSAPP', reason: fatigueStatus?.fatigueReason || 'Customer intervention fatigue policy reached.' },
      { action: 'EMAIL', reason: fatigueStatus?.fatigueReason || 'Customer intervention fatigue policy reached.' },
      { action: 'ALTERNATIVE_PAYMENT_METHOD', reason: fatigueStatus?.fatigueReason || 'Customer intervention fatigue policy reached. Suppressing alternative payment prompts.' }
    );
  }

  // Rule 8: Technical Failure Customer Protection (Prevent unnecessary notification spam)
  const isTechnical = responsibilityInfo?.responsibility === 'TECHNICAL';
  checks.push({
    ruleId: 'GR-08-TECHNICAL-DISCIPLINE',
    name: 'Technical Decline Customer Shield',
    description: 'Shield customer from unnecessary outreach when failure is caused by bank/network switch downtime.',
    status: 'PASS',
    triggered: isTechnical,
    reason: isTechnical
      ? 'Failure is technical/infrastructure related. System delayed retry prioritized over customer messaging.'
      : 'Failure is not purely infrastructure-based; customer intervention may be evaluated.',
  });

  if (isTechnical) {
    blockedActions.push(
      { action: 'WHATSAPP', reason: 'Technical infrastructure failure. Customer cannot fix bank switch timeout; notification avoided.' },
      { action: 'EMAIL', reason: 'Technical infrastructure failure. Customer cannot fix bank switch timeout; notification avoided.' }
    );
  }

  // Calculate Overall Status
  let overallStatus: GuardrailStatus = 'PASS';
  if (checks.some((c) => c.status === 'BLOCK')) {
    overallStatus = 'BLOCK';
  } else if (checks.some((c) => c.status === 'REVIEW')) {
    overallStatus = 'REVIEW';
  }

  // Determine permitted actions
  const allActions: RecoveryAction[] = [
    'RETRY_NOW',
    'RETRY_LATER',
    'WHATSAPP',
    'EMAIL',
    'ALTERNATIVE_PAYMENT_METHOD',
    'HUMAN_REVIEW',
    'NO_ACTION',
  ];

  const blockedActionSet = new Set(blockedActions.map((b) => b.action));
  const allowedActions = allActions.filter((a) => !blockedActionSet.has(a));

  return {
    checks,
    overallStatus,
    allowedActions,
    blockedActions,
  };
}
