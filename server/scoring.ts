import {
  CandidateStrategy,
  CustomerContext,
  CustomerFatigueStatus,
  FailureDiagnosis,
  FailureResponsibilityInfo,
  MerchantPolicies,
  RecoveryAction,
  TransactionRecord,
} from './types.js';

export function calculateCandidateStrategies(
  tx: TransactionRecord,
  context: CustomerContext,
  diagnosis: FailureDiagnosis,
  policies: MerchantPolicies,
  allowedActionSet: Set<RecoveryAction>,
  blockedActionMap: Map<RecoveryAction, string>,
  responsibilityInfo?: FailureResponsibilityInfo,
  fatigueStatus?: CustomerFatigueStatus
): CandidateStrategy[] {
  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 22 || currentHour < 7;
  const isHighValue = tx.amount >= policies.highValueThreshold;
  const hasHistory = context.previousSuccesses > 0;
  const successRate = context.successRate;
  const isTechnical = responsibilityInfo?.responsibility === 'TECHNICAL';
  const isBusiness = responsibilityInfo?.responsibility === 'BUSINESS';
  const isFatigued = fatigueStatus?.isFatigued ?? false;

  // Base probabilities depending on failure category and customer trust
  let baseTransientProb = 0.40;
  let baseCustomerActionProb = 0.60;
  let basePaymentMethodProb = 0.55;

  if (hasHistory) {
    baseTransientProb += Math.min(0.25, successRate * 0.25);
    baseCustomerActionProb += Math.min(0.20, successRate * 0.20);
    basePaymentMethodProb += Math.min(0.15, successRate * 0.15);
  }

  // Adjust for fraud score penalty
  const fraudPenalty = tx.fraudScore * 0.35;
  baseTransientProb = Math.max(0.05, baseTransientProb - fraudPenalty);
  baseCustomerActionProb = Math.max(0.05, baseCustomerActionProb - fraudPenalty);

  // Define strategies
  const strategies: CandidateStrategy[] = [];

  // 1. RETRY_NOW
  {
    const action: RecoveryAction = 'RETRY_NOW';
    const isAllowed = allowedActionSet.has(action);
    let prob = 0.05;
    let timing = 'Immediate automated retry (0m delay)';

    if (diagnosis.category === 'transient') {
      prob = Math.max(0.15, baseTransientProb * 0.65);
    } else if (diagnosis.category === 'customer_action_required' || isBusiness) {
      prob = 0.04; // Retrying without customer fixing balance will fail
    } else {
      prob = 0.02;
    }

    const expectedRevenue = Number((prob * tx.amount).toFixed(2));
    const cost = 0.0;
    const frictionPenalty = 5.0; // small chance of duplicate auth / irritation
    const netValue = Number((expectedRevenue - cost - frictionPenalty).toFixed(2));

    const isEligible = isAllowed && prob >= policies.minRecoveryProbability && !isBusiness;

    strategies.push({
      action,
      label: 'Retry Now (Immediate)',
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: expectedRevenue,
      customerFriction: 'LOW',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: diagnosis.category === 'transient' ? 'LOW' : 'HIGH',
      eligible: isEligible,
      rejectionReason: !isAllowed
        ? blockedActionMap.get(action)
        : isBusiness
        ? 'Customer action required (balance/limits). Immediate retry will fail without customer funding account.'
        : prob < policies.minRecoveryProbability
        ? `Recovery probability (${Math.round(prob * 100)}%) below threshold (${Math.round(policies.minRecoveryProbability * 100)}%). Direct immediate retry likely to fail again.`
        : undefined,
      timingRecommendation: timing,
    });
  }

  // 2. RETRY_LATER
  {
    const action: RecoveryAction = 'RETRY_LATER';
    const isAllowed = allowedActionSet.has(action);
    let prob = 0.10;
    const waitMins = diagnosis.recommendedWaitMinutes || 25;
    const timing = isTechnical
      ? `Wait ${waitMins} mins for bank clearing queues to drain (no customer spam)`
      : `Wait ${waitMins} mins for bank clearing / off-peak window`;

    if (isTechnical || diagnosis.category === 'transient') {
      // Waiting allows bank downtime/switch traffic to subside
      prob = Math.min(0.88, baseTransientProb + 0.32);
    } else if (diagnosis.category === 'payment_method_problem') {
      prob = 0.12;
    } else if (diagnosis.category === 'customer_action_required' || isBusiness) {
      prob = 0.08;
    }

    const expectedRevenue = Number((prob * tx.amount).toFixed(2));
    const cost = 0.0;
    const frictionPenalty = 0.0; // zero customer friction
    const netValue = Number((expectedRevenue - cost - frictionPenalty).toFixed(2));

    const isEligible = isAllowed && prob >= policies.minRecoveryProbability && !isBusiness;

    strategies.push({
      action,
      label: `Smart Delayed Retry (${waitMins}m)`,
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: expectedRevenue,
      customerFriction: 'NONE',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: 'LOW',
      eligible: isEligible,
      rejectionReason: !isAllowed
        ? blockedActionMap.get(action)
        : isBusiness
        ? 'Decline requires customer action (e.g. balance deposit). Delayed automated retry will not resolve customer deficit.'
        : prob < policies.minRecoveryProbability
        ? `Recovery probability (${Math.round(prob * 100)}%) below policy threshold. Not a transient infrastructure issue.`
        : undefined,
      timingRecommendation: timing,
    });
  }

  // 3. WHATSAPP
  {
    const action: RecoveryAction = 'WHATSAPP';
    const isAllowed = allowedActionSet.has(action);
    let prob = 0.15;
    let timing = isNightTime ? 'Schedule for 09:00 AM (DND compliant)' : 'Instant 1-click UPI deep-link message';

    if (diagnosis.category === 'customer_action_required' || isBusiness) {
      prob = Math.min(0.85, baseCustomerActionProb + 0.22);
    } else if (diagnosis.category === 'payment_method_problem') {
      prob = Math.min(0.68, basePaymentMethodProb + 0.10);
    } else if (isTechnical) {
      prob = 0.20; // Poor strategy to message customer for a backend switch timeout
    } else if (diagnosis.category === 'transient') {
      prob = Math.min(0.72, baseTransientProb + 0.15);
    }

    const cost = 1.50; // ₹1.50 WhatsApp Business API template cost
    const frictionPenalty = 10.0; // Notification intrusion friction
    const netValue = Number((prob * tx.amount - cost - frictionPenalty).toFixed(2));

    const isEligible =
      isAllowed &&
      prob >= policies.minRecoveryProbability &&
      !tx.customerOptOut &&
      !isFatigued &&
      !isTechnical;

    strategies.push({
      action,
      label: 'Interactive WhatsApp Prompt',
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: Number((prob * tx.amount).toFixed(2)),
      customerFriction: 'MEDIUM',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: tx.customerOptOut ? 'HIGH' : 'LOW',
      eligible: isEligible,
      rejectionReason: !isAllowed
        ? blockedActionMap.get(action)
        : isTechnical
        ? 'Technical infrastructure failure. Customer cannot fix bank switch timeout; unnecessary notification avoided.'
        : isFatigued
        ? (fatigueStatus?.fatigueReason || 'Customer intervention fatigue limit reached.')
        : tx.customerOptOut
        ? 'Customer has opted out of marketing/notification messaging.'
        : prob < policies.minRecoveryProbability
        ? 'Probability does not justify notification.'
        : undefined,
      timingRecommendation: timing,
    });
  }

  // 4. EMAIL
  {
    const action: RecoveryAction = 'EMAIL';
    const isAllowed = allowedActionSet.has(action);
    let prob = 0.12;
    const timing = 'Send detailed failure breakdown & receipt link';

    if (diagnosis.category === 'customer_action_required' || isBusiness) {
      prob = Math.min(0.68, baseCustomerActionProb * 0.88);
    } else if (diagnosis.category === 'payment_method_problem') {
      prob = Math.min(0.58, basePaymentMethodProb * 0.85);
    } else if (isTechnical) {
      prob = 0.15;
    } else {
      prob = Math.min(0.45, baseTransientProb * 0.70);
    }

    const cost = 0.20; // ₹0.20 transactional email
    const frictionPenalty = 2.0; // very low friction
    const netValue = Number((prob * tx.amount - cost - frictionPenalty).toFixed(2));

    const isEligible =
      isAllowed &&
      prob >= policies.minRecoveryProbability &&
      !tx.customerOptOut &&
      !isFatigued &&
      !isTechnical;

    strategies.push({
      action,
      label: 'Email Payment Link & Invoice',
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: Number((prob * tx.amount).toFixed(2)),
      customerFriction: 'LOW',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: 'LOW',
      eligible: isEligible,
      rejectionReason: !isAllowed
        ? blockedActionMap.get(action)
        : isTechnical
        ? 'Technical failure detected. Customer intervention is unnecessary.'
        : isFatigued
        ? (fatigueStatus?.fatigueReason || 'Customer intervention fatigue policy reached.')
        : tx.customerOptOut
        ? 'Customer has opted out of communications.'
        : prob < policies.minRecoveryProbability
        ? 'Recovery probability too low.'
        : undefined,
      timingRecommendation: timing,
    });
  }

  // 5. ALTERNATIVE_PAYMENT_METHOD
  {
    const action: RecoveryAction = 'ALTERNATIVE_PAYMENT_METHOD';
    const isAllowed = allowedActionSet.has(action);
    let prob = 0.20;
    const timing = 'Serve dynamic checkout modal with UPI Intent / NetBanking';

    if (diagnosis.category === 'payment_method_problem') {
      prob = 0.74; // High chance of success when switching from expired card to UPI
    } else if (diagnosis.failureCode === 'CARD_DECLINED' || diagnosis.failureCode === 'BANK_DECLINED') {
      prob = 0.66;
    } else {
      prob = 0.40;
    }

    const cost = 5.0; // UI checkout redirection / session cost
    const frictionPenalty = 15.0; // requires customer to enter new card or switch app
    const netValue = Number((prob * tx.amount - cost - frictionPenalty).toFixed(2));

    strategies.push({
      action,
      label: 'Offer Alternative Payment Method (UPI/Card)',
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: Number((prob * tx.amount).toFixed(2)),
      customerFriction: 'HIGH',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: 'MEDIUM',
      eligible: isAllowed && prob >= policies.minRecoveryProbability && !isFatigued,
      rejectionReason: !isAllowed
        ? blockedActionMap.get(action)
        : isFatigued
        ? (fatigueStatus?.fatigueReason || 'Customer intervention fatigue policy reached.')
        : prob < policies.minRecoveryProbability
        ? 'Low probability of switching methods.'
        : undefined,
      timingRecommendation: timing,
    });
  }

  // 6. HUMAN_REVIEW
  {
    const action: RecoveryAction = 'HUMAN_REVIEW';
    const isAllowed = allowedActionSet.has(action);
    let prob = isHighValue ? 0.82 : 0.45;
    const timing = 'Assign to Senior Ops / VIP Concierge Desk (SLA: 2 hours)';

    const cost = 50.0; // ₹50 human agent time cost
    const frictionPenalty = 5.0;
    const netValue = Number((prob * tx.amount - cost - frictionPenalty).toFixed(2));

    // Only economically viable or needed for high value transactions or complex mandates
    const isJustified = isHighValue || tx.amount >= 15000 || tx.fraudScore >= 0.50;

    strategies.push({
      action,
      label: 'Human Operations Review',
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: Number((prob * tx.amount).toFixed(2)),
      customerFriction: 'LOW',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: 'LOW',
      eligible: isAllowed && isJustified && netValue > 0,
      rejectionReason: !isAllowed
        ? blockedActionMap.get(action)
        : !isJustified
        ? `Transaction value (₹${tx.amount.toLocaleString('en-IN')}) does not warrant ₹50 human review overhead.`
        : undefined,
      timingRecommendation: timing,
    });
  }

  // 7. NO_ACTION
  {
    const action: RecoveryAction = 'NO_ACTION';
    const isAllowed = true;
    const prob = 0.08; // natural spontaneous recovery rate without any intervention
    const timing = 'Do not intervene; preserve budget and customer relationship';

    const cost = 0.0;
    const frictionPenalty = 0.0;
    const expectedRevenue = Number((prob * tx.amount).toFixed(2));
    const netValue = expectedRevenue;

    strategies.push({
      action,
      label: 'No Action (Strategic Inaction)',
      recoveryProbability: Number(prob.toFixed(2)),
      expectedRecoveredRevenue: expectedRevenue,
      customerFriction: 'NONE',
      actionCost: cost,
      netExpectedValue: netValue,
      risk: 'LOW',
      eligible: isAllowed,
      timingRecommendation: timing,
    });
  }

  return strategies;
}
