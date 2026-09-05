from typing import List, Tuple, Set, Dict
from .models import (
    TransactionRecord,
    FailureDiagnosis,
    MerchantPolicies,
    GuardrailCheckResult,
    GuardrailStatus,
    RecoveryAction,
    FailureCategory,
)

def evaluate_guardrails(
    tx: TransactionRecord,
    diagnosis: FailureDiagnosis,
    policies: MerchantPolicies,
) -> Tuple[List[GuardrailCheckResult], GuardrailStatus, Set[RecoveryAction], Dict[RecoveryAction, str]]:
    checks: List[GuardrailCheckResult] = []
    blocked_actions: Dict[RecoveryAction, str] = {}

    # 1. Fraud score
    is_high_fraud = tx.fraud_score >= policies.fraud_threshold
    checks.append(GuardrailCheckResult(
        rule_id="GR-01-FRAUD",
        name="Fraud & Anti-Abuse Risk",
        description=f"Block automated recovery if fraud score >= {policies.fraud_threshold:.2f}.",
        status=GuardrailStatus.BLOCK if is_high_fraud else GuardrailStatus.PASS,
        triggered=is_high_fraud,
        reason=f"Fraud score ({tx.fraud_score:.2f}) exceeds policy safety limit." if is_high_fraud else "Within normal fraud range.",
    ))
    if is_high_fraud:
        blocked_actions[RecoveryAction.RETRY_NOW] = "Fraud score exceeds safe threshold."
        blocked_actions[RecoveryAction.RETRY_LATER] = "Fraud score exceeds safe threshold."
        blocked_actions[RecoveryAction.WHATSAPP] = "Outreach blocked for high risk fraud accounts."
        blocked_actions[RecoveryAction.EMAIL] = "Outreach blocked for high risk fraud accounts."
        blocked_actions[RecoveryAction.ALTERNATIVE_PAYMENT_METHOD] = "Method switch blocked for high risk accounts."

    # 2. Max attempts
    is_max_attempts = tx.attempt_count >= policies.max_retries
    checks.append(GuardrailCheckResult(
        rule_id="GR-02-ATTEMPTS",
        name="Intervention Velocity & Fatigue",
        description=f"Halt attempts once reaching {policies.max_retries} attempts.",
        status=GuardrailStatus.BLOCK if is_max_attempts else GuardrailStatus.PASS,
        triggered=is_max_attempts,
        reason=f"Attempt count ({tx.attempt_count}/{policies.max_retries}) reached." if is_max_attempts else "Within velocity limits.",
    ))
    if is_max_attempts:
        blocked_actions[RecoveryAction.RETRY_NOW] = "Max retry cap reached."
        blocked_actions[RecoveryAction.RETRY_LATER] = "Max retry cap reached."
        blocked_actions[RecoveryAction.WHATSAPP] = "Notification fatigue cap reached."
        blocked_actions[RecoveryAction.EMAIL] = "Notification fatigue cap reached."

    # 3. Customer opt out
    is_opt_out = tx.customer_opt_out
    checks.append(GuardrailCheckResult(
        rule_id="GR-03-OPT-OUT",
        name="Customer Communication Preference (DND)",
        description="Honor customer opt-out against recovery communications.",
        status=GuardrailStatus.BLOCK if is_opt_out else GuardrailStatus.PASS,
        triggered=is_opt_out,
        reason="Customer has opted out of communications." if is_opt_out else "Active customer communication consent.",
    ))
    if is_opt_out:
        blocked_actions[RecoveryAction.WHATSAPP] = "Customer opted out."
        blocked_actions[RecoveryAction.EMAIL] = "Customer opted out."

    # 4. High value
    is_high_value = tx.amount >= policies.high_value_threshold
    checks.append(GuardrailCheckResult(
        rule_id="GR-04-HIGH-VALUE",
        name="High-Value Escrow & Review Threshold",
        description=f"Flag transactions >= ₹{policies.high_value_threshold:,.0f} for human ops review.",
        status=GuardrailStatus.REVIEW if is_high_value else GuardrailStatus.PASS,
        triggered=is_high_value,
        reason=f"Transaction value (₹{tx.amount:,.0f}) requires human sign-off." if is_high_value else "Standard automated processing tier.",
    ))

    # 5. Permanent failure
    is_permanent = diagnosis.category == FailureCategory.PERMANENT
    checks.append(GuardrailCheckResult(
        rule_id="GR-05-PERMANENT-FAILURE",
        name="Taxonomy Failure Integrity",
        description="Prevent blind automatic retries on permanent failures.",
        status=GuardrailStatus.BLOCK if is_permanent else GuardrailStatus.PASS,
        triggered=is_permanent,
        reason=f"{diagnosis.failure_code} is a permanent failure." if is_permanent else "Failure is potentially recoverable.",
    ))
    if is_permanent:
        blocked_actions[RecoveryAction.RETRY_NOW] = "Permanent failure cannot be retried."
        blocked_actions[RecoveryAction.RETRY_LATER] = "Permanent failure cannot be retried."

    # 6. Budget
    is_budget_spent = policies.budget_spent >= policies.intervention_budget
    checks.append(GuardrailCheckResult(
        rule_id="GR-06-BUDGET",
        name="Intervention Budget Ceiling",
        description="Stop billable actions if budget ceiling is exceeded.",
        status=GuardrailStatus.BLOCK if is_budget_spent else GuardrailStatus.PASS,
        triggered=is_budget_spent,
        reason="Merchant recovery budget spent." if is_budget_spent else "Intervention budget available.",
    ))
    if is_budget_spent:
        blocked_actions[RecoveryAction.WHATSAPP] = "Intervention budget exhausted."
        blocked_actions[RecoveryAction.HUMAN_REVIEW] = "Intervention budget exhausted."

    overall_status = GuardrailStatus.PASS
    if any(c.status == GuardrailStatus.BLOCK for c in checks):
        overall_status = GuardrailStatus.BLOCK
    elif any(c.status == GuardrailStatus.REVIEW for c in checks):
        overall_status = GuardrailStatus.REVIEW

    all_actions = {
        RecoveryAction.RETRY_NOW,
        RecoveryAction.RETRY_LATER,
        RecoveryAction.WHATSAPP,
        RecoveryAction.EMAIL,
        RecoveryAction.ALTERNATIVE_PAYMENT_METHOD,
        RecoveryAction.HUMAN_REVIEW,
        RecoveryAction.NO_ACTION,
    }
    allowed_actions = all_actions - set(blocked_actions.keys())

    return checks, overall_status, allowed_actions, blocked_actions
