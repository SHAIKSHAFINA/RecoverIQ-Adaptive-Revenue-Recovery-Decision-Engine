import { CustomerContext, TransactionRecord } from './types.js';

export function buildCustomerContext(tx: TransactionRecord): CustomerContext {
  const totalAttempts = tx.previousSuccesses + tx.previousFailures;
  const successRate = totalAttempts > 0 ? tx.previousSuccesses / totalAttempts : 0.8;

  let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (tx.fraudScore >= 0.70 || (tx.previousFailures > 4 && successRate < 0.3)) {
    riskTier = 'HIGH';
  } else if (tx.fraudScore >= 0.35 || tx.daysSinceLastSuccess > 60) {
    riskTier = 'MEDIUM';
  }

  return {
    customerId: tx.customerId,
    customerName: tx.customerName || `Customer ${tx.customerId}`,
    email: tx.customerEmail || `${tx.customerId.toLowerCase()}@example.in`,
    phone: tx.customerPhone || '+91 98765 43210',
    previousSuccesses: tx.previousSuccesses,
    previousFailures: tx.previousFailures,
    successRate: Number(successRate.toFixed(2)),
    attemptCount: tx.attemptCount,
    customerLifetimeValue: tx.customerLifetimeValue,
    subscription: tx.subscription,
    subscriptionAgeDays: tx.subscriptionAgeDays,
    preferredPaymentMethod: tx.paymentMethod,
    preferredChannel: tx.channelPreference,
    typicalPaymentHour: tx.typicalPaymentHour,
    daysSinceLastSuccess: tx.daysSinceLastSuccess,
    customerOptOut: tx.customerOptOut,
    fraudScore: tx.fraudScore,
    riskTier,
  };
}
