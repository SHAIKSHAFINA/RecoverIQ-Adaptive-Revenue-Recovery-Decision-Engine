import {
  FailureCode,
  FailureResponsibility,
  FailureResponsibilityInfo,
  ResponsibleParty,
} from './types.js';

export function classifyFailureResponsibility(
  failureCode: FailureCode,
  fraudScore: number = 0,
  amount: number = 0,
  highValueThreshold: number = 25000,
  fraudThreshold: number = 0.70
): FailureResponsibilityInfo {
  // 1. High Fraud Risk is ALWAYS classified as RISK
  if (fraudScore >= fraudThreshold) {
    return {
      responsibility: 'RISK',
      responsibleParty: 'HUMAN_REVIEW',
      explanation: `Suspicious payment telemetry & risk velocity (fraud score ${fraudScore.toFixed(2)}). Automated recovery suspended.`,
      resolutionGuidance: 'Route to Fraud Operations & Anti-Abuse review for KYC/identity check.',
    };
  }

  // 2. High-Value Escrow requires Human Review
  if (amount >= highValueThreshold) {
    return {
      responsibility: 'BUSINESS',
      responsibleParty: 'HUMAN_REVIEW',
      explanation: `High-value order (₹${amount.toLocaleString('en-IN')}) exceeds automated clearance threshold.`,
      resolutionGuidance: 'Assign to VIP Concierge Desk / Operations Specialist for guided white-glove settlement.',
    };
  }

  // 3. Taxonomy-based classification
  switch (failureCode) {
    // TECHNICAL declines (System / Bank Switch / PSP / Infrastructure)
    case 'UPI_TIMEOUT':
      return {
        responsibility: 'TECHNICAL',
        responsibleParty: 'SYSTEM',
        explanation: 'NPCI/PSP bank switch timed out waiting for beneficiary bank ACK.',
        resolutionGuidance: 'System delayed retry after bank queue drain (20m). Do not send customer messaging.',
      };
    case 'UPI_BANK_UNAVAILABLE':
      return {
        responsibility: 'TECHNICAL',
        responsibleParty: 'SYSTEM',
        explanation: 'Issuer Core Banking Solution (CBS) downtime or scheduled clearing maintenance.',
        resolutionGuidance: 'Automated retry during next clearing window (45m). Customer cannot fix bank switch downtime.',
      };
    case 'UPI_PSP_FAILURE':
      return {
        responsibility: 'TECHNICAL',
        responsibleParty: 'SYSTEM',
        explanation: 'Third-party PSP gateway (PhonePe/GPay/Paytm) internal server or socket error.',
        resolutionGuidance: 'Automated routing failover or delayed retry. Customer intervention not required.',
      };
    case 'NETWORK_ERROR':
      return {
        responsibility: 'TECHNICAL',
        responsibleParty: 'SYSTEM',
        explanation: 'Transient socket drop or packet loss between checkout client and payment processor.',
        resolutionGuidance: 'Perform fast automated retry with idempotent transaction token.',
      };

    // BUSINESS declines (Customer balance / intent / authentication / limits)
    case 'UPI_INSUFFICIENT_BALANCE':
      return {
        responsibility: 'BUSINESS',
        responsibleParty: 'CUSTOMER',
        explanation: 'Customer bank account balance insufficient for UPI debit.',
        resolutionGuidance: 'Prompt customer via WhatsApp/Email to fund bank account or select alternate VPA.',
      };
    case 'CARD_INSUFFICIENT_FUNDS':
      return {
        responsibility: 'BUSINESS',
        responsibleParty: 'CUSTOMER',
        explanation: 'Credit card limit reached or insufficient debit balance on card account.',
        resolutionGuidance: 'Notify customer to clear card balance or use alternate payment method.',
      };
    case 'MANDATE_PAUSED':
      return {
        responsibility: 'BUSINESS',
        responsibleParty: 'CUSTOMER',
        explanation: 'Customer paused recurring standing instruction / UPI AutoPay mandate in banking app.',
        resolutionGuidance: 'Send notification link allowing customer to unpause mandate or perform one-time checkout.',
      };
    case 'UPI_INVALID_VPA':
      return {
        responsibility: 'BUSINESS',
        responsibleParty: 'CUSTOMER',
        explanation: 'Virtual Payment Address (handle@bank) does not exist, closed, or deactivated.',
        resolutionGuidance: 'Prompt customer to re-enter valid UPI VPA or switch to QR/Card checkout.',
      };
    case 'CARD_AUTHENTICATION_FAILURE':
      return {
        responsibility: 'BUSINESS',
        responsibleParty: 'CUSTOMER',
        explanation: 'Customer OTP input timed out or failed RBI-mandated 3DS 2FA challenge.',
        resolutionGuidance: 'Prompt customer with fresh OTP authentication session.',
      };

    // PAYMENT_METHOD problems (Expired / Restricted instrument)
    case 'CARD_EXPIRED':
      return {
        responsibility: 'PAYMENT_METHOD',
        responsibleParty: 'PAYMENT_METHOD',
        explanation: 'Card expiry date is in the past. Instrument cannot be charged.',
        resolutionGuidance: 'Offer Alternative Payment Method (UPI Intent / new card input). Never retry expired card.',
      };
    case 'CARD_DECLINED':
    case 'BANK_DECLINED':
      return {
        responsibility: 'PAYMENT_METHOD',
        responsibleParty: 'CUSTOMER',
        explanation: 'Issuing bank declined charge due to card controls or velocity limits.',
        resolutionGuidance: 'Advise customer to enable online commerce in bank app or use UPI instead.',
      };

    // PERMANENT failures (Terminal drop-off / revocation)
    case 'CUSTOMER_CANCELLED':
      return {
        responsibility: 'PERMANENT',
        responsibleParty: 'CUSTOMER',
        explanation: 'Customer deliberately dismissed payment prompt or clicked Cancel.',
        resolutionGuidance: 'Respect customer intent. Do not send unsolicited messages; close with NO_ACTION.',
      };
    case 'MANDATE_REVOKED':
      return {
        responsibility: 'PERMANENT',
        responsibleParty: 'CUSTOMER',
        explanation: 'Standing instruction mandate was permanently revoked by customer.',
        resolutionGuidance: 'Mandate is cancelled. Terminate automated retries; request manual renewal.',
      };

    default:
      return {
        responsibility: 'TECHNICAL',
        responsibleParty: 'SYSTEM',
        explanation: 'Unclassified payment failure.',
        resolutionGuidance: 'Default system evaluation under standard guardrails.',
      };
  }
}
