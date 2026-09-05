export type FailureCode =
  | 'UPI_TIMEOUT'
  | 'UPI_BANK_UNAVAILABLE'
  | 'UPI_INSUFFICIENT_BALANCE'
  | 'UPI_INVALID_VPA'
  | 'UPI_PSP_FAILURE'
  | 'CUSTOMER_CANCELLED'
  | 'CARD_EXPIRED'
  | 'CARD_DECLINED'
  | 'CARD_INSUFFICIENT_FUNDS'
  | 'CARD_AUTHENTICATION_FAILURE'
  | 'NETWORK_ERROR'
  | 'MANDATE_PAUSED'
  | 'MANDATE_REVOKED'
  | 'BANK_DECLINED';

export type FailureCategory =
  | 'transient'
  | 'customer_action_required'
  | 'payment_method_problem'
  | 'permanent'
  | 'potentially_risky';

export type FailureResponsibility =
  | 'TECHNICAL'
  | 'BUSINESS'
  | 'PAYMENT_METHOD'
  | 'PERMANENT'
  | 'RISK';

export type ResponsibleParty =
  | 'SYSTEM'
  | 'CUSTOMER'
  | 'PAYMENT_METHOD'
  | 'MERCHANT'
  | 'HUMAN_REVIEW';

export interface FailureResponsibilityInfo {
  responsibility: FailureResponsibility;
  responsibleParty: ResponsibleParty;
  explanation: string;
  resolutionGuidance: string;
}

export interface CustomerFatigueStatus {
  interventions24h: number;
  interventions72h: number;
  lastInterventionTimestamp: string | null;
  consecutiveFailedInterventions: number;
  isInCooldown: boolean;
  cooldownRemainingHours: number;
  isFatigued: boolean;
  fatigueReason?: string;
}

export interface RecoveryOpportunity {
  transactionId: string;
  score: number; // 0-100 deterministic
  amount: number;
  currency: string;
  failureCode: FailureCode;
  responsibility: FailureResponsibility;
  responsibleParty: ResponsibleParty;
  recommendedAction: RecoveryAction;
  expectedRecovery: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  customer: {
    id: string;
    name: string;
    clv: number;
    fraudScore: number;
  };
}

export type ExceptionCategory =
  | 'STOPPED'
  | 'BLOCKED'
  | 'HUMAN_REVIEW'
  | 'WAITING'
  | 'NO_ACTION'
  | 'CUSTOMER_OPTED_OUT'
  | 'RECOVERY_FATIGUE';

export interface HonestException {
  transactionId: string;
  amount: number;
  failureCode: FailureCode;
  category: ExceptionCategory;
  decision: RecoveryAction | 'WAIT' | 'HALT' | 'BLOCKED';
  reason: string;
  avoidedCostOrIntervention: string;
  timestamp: string;
  customer: {
    id: string;
    name: string;
  };
}

export type RecoveryAction =
  | 'RETRY_NOW'
  | 'RETRY_LATER'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'ALTERNATIVE_PAYMENT_METHOD'
  | 'HUMAN_REVIEW'
  | 'NO_ACTION';

export type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'AutoPay';

export type CustomerSubscriptionStatus = 'active' | 'past_due' | 'trialing' | 'churned';

export type GuardrailStatus = 'PASS' | 'BLOCK' | 'REVIEW';

export interface GuardrailCheckResult {
  ruleId: string;
  name: string;
  description: string;
  status: GuardrailStatus;
  triggered: boolean;
  reason: string;
}

export interface FailureDiagnosis {
  failureCode: FailureCode;
  category: FailureCategory;
  description: string;
  isRetryable: boolean;
  recommendedWaitMinutes: number;
  customerActionRequired: boolean;
  upiSpecific: boolean;
}

export interface CustomerContext {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  previousSuccesses: number;
  previousFailures: number;
  successRate: number;
  attemptCount: number;
  customerLifetimeValue: number;
  subscription: CustomerSubscriptionStatus;
  subscriptionAgeDays: number;
  preferredPaymentMethod: PaymentMethod;
  preferredChannel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  typicalPaymentHour: number;
  daysSinceLastSuccess: number;
  customerOptOut: boolean;
  fraudScore: number; // 0.0 to 1.0
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TransactionRecord {
  transactionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  failureCode: FailureCode;
  timestamp: string;
  status: 'FAILED' | 'RECOVERING' | 'RECOVERED' | 'HALTED' | 'CLOSED_NO_ACTION';
  attemptCount: number;
  previousSuccesses: number;
  previousFailures: number;
  customerLifetimeValue: number;
  subscription: CustomerSubscriptionStatus;
  subscriptionAgeDays: number;
  channelPreference: 'WHATSAPP' | 'EMAIL' | 'SMS';
  typicalPaymentHour: number;
  daysSinceLastSuccess: number;
  customerOptOut: boolean;
  fraudScore: number;
  
  // Tag / demo case identification
  demoTag?: string;
  
  // Fatigue / demo override telemetry
  recentInterventions24h?: number;
  recentInterventions72h?: number;
  lastInterventionAt?: string;
  consecutiveFailedInterventions?: number;
  
  // Execution metadata if already acted upon
  lastDecision?: RecoveryAction;
  lastSimulatedOutcome?: 'SUCCESS' | 'FAILURE' | 'PENDING_REVIEW' | 'SKIPPED';
  recoveredAt?: string;
}

export interface CandidateStrategy {
  action: RecoveryAction;
  label: string;
  recoveryProbability: number; // 0 to 1
  expectedRecoveredRevenue: number;
  customerFriction: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  actionCost: number; // in INR
  netExpectedValue: number; // expected revenue - action cost - friction discount
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  eligible: boolean;
  rejectionReason?: string;
  timingRecommendation: string;
}

export interface SimulationResult {
  transactionId: string;
  amount: number;
  currency: string;
  failureDiagnosis: FailureDiagnosis;
  customerContext: CustomerContext;
  failureResponsibility: FailureResponsibilityInfo;
  customerFatigue: CustomerFatigueStatus;
  recoveryOpportunityScore: number;
  candidateStrategies: CandidateStrategy[];
  recommendedAction: RecoveryAction;
  recommendationReason: string;
  rejectionReasons: Record<string, string>;
  guardrails: GuardrailCheckResult[];
  overallGuardrailStatus: GuardrailStatus;
  aiExplanation: {
    summary: string;
    whyRecommended: string;
    whyAlternativesRejected: string;
    customerCommunicationDraft?: {
      channel: 'WHATSAPP' | 'EMAIL';
      message: string;
      subject?: string;
    };
    isAiGenerated: boolean;
  };
  isExecutable: boolean;
  executionBlockReason?: string;
  policyConstraintsApplied: {
    maxAttemptsExceeded: boolean;
    budgetRemaining: number;
    withinRecoveryWindow: boolean;
  };
  timestamp: string;
}

export interface ExecutionResult {
  executionId: string;
  transactionId: string;
  actionTaken: RecoveryAction;
  status: 'SIMULATED_SUCCESS' | 'SIMULATED_FAILURE' | 'SIMULATED_HUMAN_REVIEW' | 'SIMULATED_BLOCKED' | 'SIMULATED_NO_ACTION';
  recoveredAmount: number;
  netRevenueGain: number;
  costIncurred: number;
  messageDispatched?: string;
  channelUsed?: string;
  guardrailsVerified: boolean;
  auditLogId: string;
  timestamp: string;
  simulatedNote: string;
}

export interface MerchantPolicies {
  maxRetries: number;
  maxNotifications: number;
  highValueThreshold: number; // e.g. 25000
  fraudThreshold: number; // e.g. 0.70
  minRecoveryProbability: number; // e.g. 0.15
  interventionBudget: number; // e.g. 15000
  budgetSpent: number;
  recoveryWindowHours: number; // e.g. 72
  maxNotifications24h: number; // e.g. 2
  cooldownHours: number; // e.g. 12
  maxConsecutiveFailedInterventions: number; // e.g. 2
}

export interface AuditLogEntry {
  auditId: string;
  transactionId: string;
  timestamp: string;
  amount: number;
  failureCode: FailureCode;
  failureCategory: FailureCategory;
  failureResponsibility?: FailureResponsibility;
  responsibleParty?: ResponsibleParty;
  recoveryOpportunityScore?: number;
  fatigueStatus?: CustomerFatigueStatus;
  interventionHistory?: {
    interventions24h: number;
    consecutiveFailures: number;
  };
  exceptionReason?: string;
  customer: {
    id: string;
    name: string;
    fraudScore: number;
    optOut: boolean;
    clv: number;
  };
  guardrails: GuardrailCheckResult[];
  candidateStrategies: {
    action: RecoveryAction;
    probability: number;
    expectedRecovery: number;
    eligible: boolean;
  }[];
  selectedAction: RecoveryAction;
  aiReasoning: string;
  executionStatus: string;
  simulatedOutcome: string;
  recoveredAmount: number;
  executionCost: number;
}
