import { getAuditLogs } from './audit.js';
import { CustomerFatigueStatus, MerchantPolicies, TransactionRecord } from './types.js';

export function calculateCustomerFatigue(
  tx: TransactionRecord,
  policies: MerchantPolicies
): CustomerFatigueStatus {
  const allLogs = getAuditLogs();
  const customerLogs = allLogs.filter(
    (l) => l.customer.id === tx.customerId || l.transactionId === tx.transactionId
  );

  const now = Date.now();
  const MS_PER_HOUR = 60 * 60 * 1000;

  // Count active interventions in audit history (outbound messages or prompts)
  let auditInterventions24h = 0;
  let auditInterventions72h = 0;
  let auditLastTimestamp: string | null = null;
  let auditConsecutiveFailures = 0;

  for (const log of customerLogs) {
    // Only count active customer outreach as fatigue interventions
    const isOutreach =
      log.selectedAction === 'WHATSAPP' ||
      log.selectedAction === 'EMAIL' ||
      log.selectedAction === 'ALTERNATIVE_PAYMENT_METHOD';

    if (isOutreach) {
      const logTime = new Date(log.timestamp).getTime();
      const ageHours = (now - logTime) / MS_PER_HOUR;

      if (ageHours <= 24) {
        auditInterventions24h += 1;
      }
      if (ageHours <= 72) {
        auditInterventions72h += 1;
      }
      if (!auditLastTimestamp || logTime > new Date(auditLastTimestamp).getTime()) {
        auditLastTimestamp = log.timestamp;
      }

      if (log.executionStatus === 'SIMULATED_FAILURE') {
        auditConsecutiveFailures += 1;
      } else if (log.executionStatus === 'SIMULATED_SUCCESS') {
        auditConsecutiveFailures = 0; // reset on success
      }
    }
  }

  // Combine with synthetic transaction telemetry
  const interventions24h = Math.max(
    auditInterventions24h,
    tx.recentInterventions24h !== undefined ? tx.recentInterventions24h : 0
  );

  const interventions72h = Math.max(
    auditInterventions72h,
    tx.recentInterventions72h !== undefined
      ? tx.recentInterventions72h
      : interventions24h
  );

  const consecutiveFailedInterventions = Math.max(
    auditConsecutiveFailures,
    tx.consecutiveFailedInterventions !== undefined ? tx.consecutiveFailedInterventions : 0
  );

  const lastInterventionTimestamp = auditLastTimestamp || tx.lastInterventionAt || null;

  // Calculate cooldown state
  let isInCooldown = false;
  let cooldownRemainingHours = 0;

  if (lastInterventionTimestamp) {
    const elapsedHours = (now - new Date(lastInterventionTimestamp).getTime()) / MS_PER_HOUR;
    if (elapsedHours >= 0 && elapsedHours < policies.cooldownHours) {
      isInCooldown = true;
      cooldownRemainingHours = Number((policies.cooldownHours - elapsedHours).toFixed(1));
    }
  }

  // If customer has already received max notifications in 24h, treat as in cooldown
  if (interventions24h >= policies.maxNotifications24h) {
    isInCooldown = true;
    if (cooldownRemainingHours === 0) {
      cooldownRemainingHours = policies.cooldownHours;
    }
  }

  // Determine fatigue verdict
  let isFatigued = false;
  let fatigueReason: string | undefined = undefined;

  if (interventions24h >= policies.maxNotifications24h) {
    isFatigued = true;
    fatigueReason = `Customer reached 24h notification cap (${interventions24h}/${policies.maxNotifications24h} messages sent).`;
  } else if (isInCooldown && cooldownRemainingHours > 0) {
    isFatigued = true;
    fatigueReason = `Active cooldown period in effect (${cooldownRemainingHours}h remaining of ${policies.cooldownHours}h policy).`;
  } else if (
    consecutiveFailedInterventions >= policies.maxConsecutiveFailedInterventions
  ) {
    isFatigued = true;
    fatigueReason = `Max consecutive failed interventions reached (${consecutiveFailedInterventions}/${policies.maxConsecutiveFailedInterventions}). Further outreach halted.`;
  }

  return {
    interventions24h,
    interventions72h,
    lastInterventionTimestamp,
    consecutiveFailedInterventions,
    isInCooldown,
    cooldownRemainingHours,
    isFatigued,
    fatigueReason,
  };
}
