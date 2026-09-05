import { FailureCategory, FailureCode, FailureDiagnosis } from './types.js';

export const FAILURE_TAXONOMY: Record<
  FailureCode,
  {
    category: FailureCategory;
    description: string;
    isRetryable: boolean;
    recommendedWaitMinutes: number;
    customerActionRequired: boolean;
    upiSpecific: boolean;
  }
> = {
  UPI_TIMEOUT: {
    category: 'transient',
    description: 'NPCI/PSP bank switch timed out waiting for beneficiary bank ACK.',
    isRetryable: true,
    recommendedWaitMinutes: 20,
    customerActionRequired: false,
    upiSpecific: true,
  },
  UPI_BANK_UNAVAILABLE: {
    category: 'transient',
    description: 'Issuer CBS (Core Banking Solution) is undergoing scheduled maintenance or experiencing downtime.',
    isRetryable: true,
    recommendedWaitMinutes: 45,
    customerActionRequired: false,
    upiSpecific: true,
  },
  UPI_INSUFFICIENT_BALANCE: {
    category: 'customer_action_required',
    description: 'Customer bank account balance insufficient for UPI debit.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: true,
  },
  UPI_INVALID_VPA: {
    category: 'payment_method_problem',
    description: 'Virtual Payment Address (handle@bank) does not exist, closed, or deactivated.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: true,
  },
  UPI_PSP_FAILURE: {
    category: 'transient',
    description: 'Third-party app (PhonePe/GPay/Paytm) PSP gateway returned internal server error.',
    isRetryable: true,
    recommendedWaitMinutes: 10,
    customerActionRequired: false,
    upiSpecific: true,
  },
  CUSTOMER_CANCELLED: {
    category: 'permanent',
    description: 'Customer deliberately dismissed payment prompt or clicked Cancel.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: false,
  },
  CARD_EXPIRED: {
    category: 'payment_method_problem',
    description: 'Credit/Debit card expiry month/year is in the past.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: false,
  },
  CARD_DECLINED: {
    category: 'potentially_risky',
    description: 'Card issuing bank blocked charge due to velocity limits, risk check, or card block.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: false,
  },
  CARD_INSUFFICIENT_FUNDS: {
    category: 'customer_action_required',
    description: 'Credit limit reached or insufficient debit balance on card account.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: false,
  },
  CARD_AUTHENTICATION_FAILURE: {
    category: 'potentially_risky',
    description: '3DS OTP entered incorrectly or session expired during RBI-mandated 2FA.',
    isRetryable: true,
    recommendedWaitMinutes: 5,
    customerActionRequired: true,
    upiSpecific: false,
  },
  NETWORK_ERROR: {
    category: 'transient',
    description: 'Socket reset or packet drop between merchant payment SDK and gateway.',
    isRetryable: true,
    recommendedWaitMinutes: 5,
    customerActionRequired: false,
    upiSpecific: false,
  },
  MANDATE_PAUSED: {
    category: 'customer_action_required',
    description: 'Customer paused UPI AutoPay / e-mandate via bank or UPI app.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: true,
  },
  MANDATE_REVOKED: {
    category: 'permanent',
    description: 'Customer cancelled recurring standing instruction mandate completely.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: true,
  },
  BANK_DECLINED: {
    category: 'potentially_risky',
    description: 'Acquiring bank or clearing house declined the transaction code without specific reason.',
    isRetryable: false,
    recommendedWaitMinutes: 0,
    customerActionRequired: true,
    upiSpecific: false,
  },
};

export function diagnoseFailure(code: FailureCode): FailureDiagnosis {
  const taxonomy = FAILURE_TAXONOMY[code] || {
    category: 'transient' as FailureCategory,
    description: 'Unknown payment failure encountered.',
    isRetryable: true,
    recommendedWaitMinutes: 15,
    customerActionRequired: false,
    upiSpecific: false,
  };

  return {
    failureCode: code,
    category: taxonomy.category,
    description: taxonomy.description,
    isRetryable: taxonomy.isRetryable,
    recommendedWaitMinutes: taxonomy.recommendedWaitMinutes,
    customerActionRequired: taxonomy.customerActionRequired,
    upiSpecific: taxonomy.upiSpecific,
  };
}
