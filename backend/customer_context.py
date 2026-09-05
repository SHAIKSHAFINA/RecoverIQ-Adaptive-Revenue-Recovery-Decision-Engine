from .models import TransactionRecord, CustomerContext

def build_customer_context(tx: TransactionRecord) -> CustomerContext:
    total_attempts = tx.previous_successes + tx.previous_failures
    success_rate = tx.previous_successes / total_attempts if total_attempts > 0 else 0.8
    
    risk_tier = "LOW"
    if tx.fraud_score >= 0.70 or (tx.previous_failures > 4 and success_rate < 0.3):
        risk_tier = "HIGH"
    elif tx.fraud_score >= 0.35 or tx.days_since_last_success > 60:
        risk_tier = "MEDIUM"

    return CustomerContext(
        customer_id=tx.customer_id,
        customer_name=tx.customer_name or f"Customer {tx.customer_id}",
        email=tx.customer_email or f"{tx.customer_id.lower()}@example.in",
        phone=tx.customer_phone or "+91 98765 43210",
        previous_successes=tx.previous_successes,
        previous_failures=tx.previous_failures,
        success_rate=round(success_rate, 2),
        attempt_count=tx.attempt_count,
        customer_lifetime_value=tx.customer_lifetime_value,
        subscription=tx.subscription,
        subscription_age_days=tx.subscription_age_days,
        preferred_payment_method=tx.payment_method,
        preferred_channel=tx.channel_preference,
        typical_payment_hour=tx.typical_payment_hour,
        days_since_last_success=tx.days_since_last_success,
        customer_opt_out=tx.customer_opt_out,
        fraud_score=tx.fraud_score,
        risk_tier=risk_tier,
    )
