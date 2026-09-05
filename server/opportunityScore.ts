import {
  CustomerFatigueStatus,
  FailureDiagnosis,
  FailureResponsibilityInfo,
  TransactionRecord,
} from './types.js';

export function calculateOpportunityScore(
  tx: TransactionRecord,
  responsibilityInfo: FailureResponsibilityInfo,
  diagnosis: FailureDiagnosis,
  fatigueStatus: CustomerFatigueStatus,
  recoveryProbability: number,
  actionCost: number = 0
): { score: number; reason: string } {
  // 1. Immediate disqualify / zero-score cases
  if (responsibilityInfo.responsibility === 'RISK' || tx.fraudScore >= 0.70) {
    return {
      score: 0,
      reason: `Blocked by fraud risk score (${tx.fraudScore.toFixed(2)}). Recovery opportunity nullified to protect merchant.`,
    };
  }

  if (
    responsibilityInfo.responsibility === 'PERMANENT' ||
    diagnosis.failureCode === 'CUSTOMER_CANCELLED' ||
    diagnosis.failureCode === 'MANDATE_REVOKED'
  ) {
    return {
      score: 5,
      reason: 'Permanent failure or customer checkout dismissal. Further recovery attempts ineffective.',
    };
  }

  if (tx.attemptCount >= 3) {
    return {
      score: 10,
      reason: `Attempt velocity cap reached (${tx.attemptCount}/3). Opportunity diminished by fatigue.`,
    };
  }

  let total = 0;

  // 2. Financial Amount Leverage (Max 25 pts)
  if (tx.amount >= 25000) {
    total += 25;
  } else if (tx.amount >= 5000) {
    total += 22;
  } else if (tx.amount >= 1500) {
    total += 16;
  } else if (tx.amount >= 500) {
    total += 10;
  } else {
    total += 5;
  }

  // 3. Recovery Probability Contribution (Max 30 pts)
  total += Math.round(recoveryProbability * 30);

  // 4. Responsibility & Retryability Alignment (Max 20 pts)
  if (responsibilityInfo.responsibility === 'TECHNICAL') {
    total += 20; // High win-rate backend transient issue
  } else if (responsibilityInfo.responsibility === 'BUSINESS') {
    total += 12; // Customer action required
  } else if (responsibilityInfo.responsibility === 'PAYMENT_METHOD') {
    total += 14; // Can be saved by method switch modal
  }

  // 5. Customer Trust & Success Rate (Max 12 pts)
  const totalPrior = tx.previousSuccesses + tx.previousFailures;
  const successRate = totalPrior > 0 ? tx.previousSuccesses / totalPrior : 0.75;
  total += Math.round(successRate * 12);

  // 6. Customer Lifetime Value (CLV) VIP Priority (Max 5 pts)
  if (tx.customerLifetimeValue >= 50000) {
    total += 5;
  } else if (tx.customerLifetimeValue >= 10000) {
    total += 3;
  }

  // 7. Freshness & Attempt History
  if (tx.attemptCount === 1) {
    total += 5;
  } else if (tx.attemptCount === 2) {
    total += 1;
  }

  // Deduct if customer is in fatigue state
  if (fatigueStatus.isFatigued) {
    total -= 25;
  }

  // Deduct if customer opted out of communication and failure requires customer action
  if (tx.customerOptOut && responsibilityInfo.responsibility === 'BUSINESS') {
    total -= 20;
  }

  // Cost penalty if intervention is expensive relative to amount
  if (actionCost > 0 && actionCost / tx.amount > 0.1) {
    total -= 10;
  }

  const score = Math.max(0, Math.min(100, Math.round(total)));

  // Generate dynamic contextual reason
  let reason = '';
  if (score >= 80) {
    reason = `Prime recovery target: ₹${tx.amount.toLocaleString('en-IN')} ${responsibilityInfo.responsibility.toLowerCase()} issue with high ${(recoveryProbability * 100).toFixed(0)}% recovery odds.`;
  } else if (score >= 60) {
    reason = `Solid candidate: ₹${tx.amount.toLocaleString('en-IN')} with proven customer track record and clearable obstacle.`;
  } else if (score >= 35) {
    reason = `Moderate potential: requires customer action with potential friction.`;
  } else {
    reason = `Low priority: marginal expected gain after factoring friction, fatigue, or decline permanence.`;
  }

  return { score, reason };
}
