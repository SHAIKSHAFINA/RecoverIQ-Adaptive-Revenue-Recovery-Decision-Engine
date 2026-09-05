from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FailureCategory(str, Enum):
    TRANSIENT = "transient"
    CUSTOMER_ACTION_REQUIRED = "customer_action_required"
    PAYMENT_METHOD_PROBLEM = "payment_method_problem"
    PERMANENT = "permanent"
    POTENTIALLY_RISKY = "potentially_risky"

class FailureCode(str, Enum):
    UPI_TIMEOUT = "UPI_TIMEOUT"
    UPI_BANK_UNAVAILABLE = "UPI_BANK_UNAVAILABLE"
    UPI_INSUFFICIENT_BALANCE = "UPI_INSUFFICIENT_BALANCE"
    UPI_INVALID_VPA = "UPI_INVALID_VPA"
    UPI_PSP_FAILURE = "UPI_PSP_FAILURE"
    CUSTOMER_CANCELLED = "CUSTOMER_CANCELLED"
    CARD_EXPIRED = "CARD_EXPIRED"
    CARD_DECLINED = "CARD_DECLINED"
    CARD_INSUFFICIENT_FUNDS = "CARD_INSUFFICIENT_FUNDS"
    CARD_AUTHENTICATION_FAILURE = "CARD_AUTHENTICATION_FAILURE"
    NETWORK_ERROR = "NETWORK_ERROR"
    MANDATE_PAUSED = "MANDATE_PAUSED"
    MANDATE_REVOKED = "MANDATE_REVOKED"
    BANK_DECLINED = "BANK_DECLINED"

class RecoveryAction(str, Enum):
    RETRY_NOW = "RETRY_NOW"
    RETRY_LATER = "RETRY_LATER"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    ALTERNATIVE_PAYMENT_METHOD = "ALTERNATIVE_PAYMENT_METHOD"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    NO_ACTION = "NO_ACTION"

class GuardrailStatus(str, Enum):
    PASS = "PASS"
    BLOCK = "BLOCK"
    REVIEW = "REVIEW"

class GuardrailCheckResult(BaseModel):
    rule_id: str
    name: str
    description: str
    status: GuardrailStatus
    triggered: bool
    reason: str

class FailureDiagnosis(BaseModel):
    failure_code: FailureCode
    category: FailureCategory
    description: str
    is_retryable: bool
    recommended_wait_minutes: int
    customer_action_required: bool
    upi_specific: bool

class CustomerContext(BaseModel):
    customer_id: str
    customer_name: str
    email: str
    phone: str
    previous_successes: int
    previous_failures: int
    success_rate: float
    attempt_count: int
    customer_lifetime_value: float
    subscription: str
    subscription_age_days: int
    preferred_payment_method: str
    preferred_channel: str
    typical_payment_hour: int
    days_since_last_success: int
    customer_opt_out: bool
    fraud_score: float
    risk_tier: str

class TransactionRecord(BaseModel):
    transaction_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    merchant_id: str
    amount: float
    currency: str = "INR"
    payment_method: str
    failure_code: FailureCode
    timestamp: str
    status: str
    attempt_count: int
    previous_successes: int
    previous_failures: int
    customer_lifetime_value: float
    subscription: str
    subscription_age_days: int
    channel_preference: str
    typical_payment_hour: int
    days_since_last_success: int
    customer_opt_out: bool
    fraud_score: float
    demo_tag: Optional[str] = None
    last_decision: Optional[RecoveryAction] = None
    last_simulated_outcome: Optional[str] = None

class CandidateStrategy(BaseModel):
    action: RecoveryAction
    label: str
    recovery_probability: float
    expected_recovered_revenue: float
    customer_friction: str
    action_cost: float
    net_expected_value: float
    risk: str
    eligible: bool
    rejection_reason: Optional[str] = None
    timing_recommendation: str

class MerchantPolicies(BaseModel):
    max_retries: int = 3
    max_notifications: int = 2
    high_value_threshold: float = 25000.0
    fraud_threshold: float = 0.70
    min_recovery_probability: float = 0.15
    intervention_budget: float = 25000.0
    budget_spent: float = 4280.0
    recovery_window_hours: int = 72
