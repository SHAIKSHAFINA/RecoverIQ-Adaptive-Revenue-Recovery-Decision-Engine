from ..models import FailureCode, FailureCategory, TransactionRecord, MerchantPolicies, RecoveryAction, GuardrailStatus
from ..diagnosis import diagnose_failure
from ..guardrails import evaluate_guardrails

def test_transient_diagnosis():
    diag = diagnose_failure(FailureCode.UPI_TIMEOUT)
    assert diag.category == FailureCategory.TRANSIENT
    assert diag.is_retryable is True
    assert diag.upi_specific is True

def test_permanent_diagnosis():
    diag = diagnose_failure(FailureCode.CUSTOMER_CANCELLED)
    assert diag.category == FailureCategory.PERMANENT
    assert diag.is_retryable is False

def test_fraud_guardrail_blocks_retry():
    tx = TransactionRecord(
        transaction_id="TX-TEST-01",
        customer_id="CUST-01",
        customer_name="Test User",
        customer_email="test@example.com",
        customer_phone="+919999999999",
        merchant_id="M-01",
        amount=1500,
        currency="INR",
        payment_method="UPI",
        failure_code=FailureCode.UPI_TIMEOUT,
        timestamp="2026-01-01T12:00:00Z",
        status="FAILED",
        attempt_count=1,
        previous_successes=2,
        previous_failures=0,
        customer_lifetime_value=3000,
        subscription="active",
        subscription_age_days=60,
        channel_preference="WHATSAPP",
        typical_payment_hour=14,
        days_since_last_success=30,
        customer_opt_out=False,
        fraud_score=0.85, # Trigger fraud guardrail
    )
    diag = diagnose_failure(tx.failure_code)
    policies = MerchantPolicies()
    checks, overall, allowed, blocked = evaluate_guardrails(tx, diag, policies)

    assert overall == GuardrailStatus.BLOCK
    assert RecoveryAction.RETRY_NOW in blocked
    assert RecoveryAction.NO_ACTION in allowed

def test_high_value_guardrail_triggers_review():
    tx = TransactionRecord(
        transaction_id="TX-TEST-02",
        customer_id="CUST-02",
        customer_name="Enterprise VIP",
        customer_email="vip@corp.com",
        customer_phone="+919999999999",
        merchant_id="M-01",
        amount=45000, # Above 25,000 threshold
        currency="INR",
        payment_method="Card",
        failure_code=FailureCode.CARD_AUTHENTICATION_FAILURE,
        timestamp="2026-01-01T12:00:00Z",
        status="FAILED",
        attempt_count=1,
        previous_successes=10,
        previous_failures=0,
        customer_lifetime_value=120000,
        subscription="active",
        subscription_age_days=180,
        channel_preference="EMAIL",
        typical_payment_hour=11,
        days_since_last_success=25,
        customer_opt_out=False,
        fraud_score=0.02,
    )
    diag = diagnose_failure(tx.failure_code)
    policies = MerchantPolicies()
    checks, overall, allowed, blocked = evaluate_guardrails(tx, diag, policies)

    assert overall == GuardrailStatus.REVIEW
