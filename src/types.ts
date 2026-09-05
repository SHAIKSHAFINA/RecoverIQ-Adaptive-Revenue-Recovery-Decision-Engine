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
  score: number;
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
  subscription: string;
  subscriptionAgeDays: number;
  preferredPaymentMethod: PaymentMethod;
  preferredChannel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  typicalPaymentHour: number;
  daysSinceLastSuccess: number;
  customerOptOut: boolean;
  fraudScore: number;
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
  subscription: string;
  subscriptionAgeDays: number;
  channelPreference: 'WHATSAPP' | 'EMAIL' | 'SMS';
  typicalPaymentHour: number;
  daysSinceLastSuccess: number;
  customerOptOut: boolean;
  fraudScore: number;
  demoTag?: string;
  lastDecision?: RecoveryAction;
  lastSimulatedOutcome?: 'SUCCESS' | 'FAILURE' | 'PENDING_REVIEW' | 'SKIPPED';
  recoveredAt?: string;
}

export interface CandidateStrategy {
  action: RecoveryAction;
  label: string;
  recoveryProbability: number;
  expectedRecoveredRevenue: number;
  customerFriction: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  actionCost: number;
  netExpectedValue: number;
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
  failureResponsibility: FailureResponsibilityInfo;
  customerFatigue: CustomerFatigueStatus;
  recoveryOpportunityScore: number;
  customerContext: CustomerContext;
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
  maxNotifications24h: number;
  cooldownHours: number;
  maxConsecutiveFailedInterventions: number;
  highValueThreshold: number;
  fraudThreshold: number;
  minRecoveryProbability: number;
  interventionBudget: number;
  budgetSpent: number;
  recoveryWindowHours: number;
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

export interface DashboardData {
  revenueProcessed: number;
  revenueAtRisk: number;
  recoverableRevenue: number;
  revenueRecovered: number;
  recoveryRate: number;
  eligiblePayments: number;
  successfulRecoveries: number;
  interventions: number;
  blockedActions: number;
  noActionDecisions: number;
  failureDistribution: { code: string; count: number; category: string }[];
  paymentMethodStats: { method: string; total: number; interventions?: number; recovered: number; recoveredRevenue?: number; rate: number }[];
  funnel: { stage: string; count: number; value: number }[];
  recentDecisions: AuditLogEntry[];
  policies: MerchantPolicies;
}

export interface EvaluationData {
  totalAnalyzed: number;
  baseline: {
    name: string;
    description: string;
    eligiblePayments: number;
    interventions: number;
    successfulRecoveries: number;
    recoveryRate: number;
    revenueRecovered: number;
    totalCost: number;
    netRevenueGain: number;
    revenuePerIntervention: number;
    noActionDecisions: number;
    blockedRiskyActions: number;
    unnecessaryInterventionRate: number;
    customerFrictionScore: number;
  };
  recoverAi: {
    name: string;
    description: string;
    eligiblePayments: number;
    interventions: number;
    successfulRecoveries: number;
    recoveryRate: number;
    revenueRecovered: number;
    totalCost: number;
    netRevenueGain: number;
    revenuePerIntervention: number;
    noActionDecisions: number;
    blockedRiskyActions: number;
    unnecessaryInterventionRate: number;
    customerFrictionScore: number;
  };
  lift: {
    revenueLiftPercent: number;
    recoveryRateLiftPercent: number;
    interventionEfficiencyMultiplier: number;
    wastedInterventionsSaved: number;
  };
}

export interface VerificationCaseResult {
  id: string;
  scenario: string;
  failureCode: FailureCode;
  amount: number;
  currency: string;
  customerName: string;
  failureResponsibility: FailureResponsibility;
  responsibleParty: ResponsibleParty;
  expectedDecision: string;
  actualDecision: string;
  opportunityScore: number;
  fatigueStatus: 'NORMAL' | 'FATIGUED';
  guardrailStatus: 'PASS' | 'BLOCK' | 'REVIEW';
  passed: boolean;
  reason?: string;
}

export interface VerificationResponse {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  executionTimestamp: string;
  results: VerificationCaseResult[];
}

export interface EngineHealthCheck {
  component: string;
  endpoint: string;
  status: 'PASS' | 'FAIL';
  latencyMs: number;
  details: string;
}

export interface EngineHealthResponse {
  allPassed: boolean;
  totalChecked: number;
  totalPassed: number;
  totalTimeMs: number;
  checks: EngineHealthCheck[];
}
