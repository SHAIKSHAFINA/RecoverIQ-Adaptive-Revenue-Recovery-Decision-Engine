import fs from 'fs';
import path from 'path';
import {
  CustomerSubscriptionStatus,
  FailureCode,
  PaymentMethod,
  TransactionRecord,
} from './types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

let inMemoryTransactions: TransactionRecord[] = [];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advaith',
  'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Anika', 'Navya', 'Angel',
  'Myra', 'Sara', 'Ira', 'Avani', 'Riya', 'Siya', 'Kavya', 'Pooja', 'Rohan',
  'Vikram', 'Neha', 'Siddharth', 'Meera', 'Tarun', 'Anjali', 'Deepak', 'Sneha',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Menon',
  'Gupta', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Bhat', 'Pillai', 'Deshmukh',
  'Kulkarni', 'Choudhury', 'Banerjee', 'Chatterjee', 'Agarwal', 'Kapoor',
];

const FAILURE_CODES: FailureCode[] = [
  'UPI_TIMEOUT',
  'UPI_BANK_UNAVAILABLE',
  'UPI_INSUFFICIENT_BALANCE',
  'UPI_INVALID_VPA',
  'UPI_PSP_FAILURE',
  'CUSTOMER_CANCELLED',
  'CARD_EXPIRED',
  'CARD_DECLINED',
  'CARD_INSUFFICIENT_FUNDS',
  'CARD_AUTHENTICATION_FAILURE',
  'NETWORK_ERROR',
  'MANDATE_PAUSED',
  'MANDATE_REVOKED',
  'BANK_DECLINED',
];

export function seedSyntheticTransactions(count: number = 1000): TransactionRecord[] {
  const records: TransactionRecord[] = [];

  // 1. GUARANTEED DEMO CASE 1: High-trust customer + transient UPI failure → Smart Recovery
  records.push({
    transactionId: 'TXN-DEMO-001',
    customerId: 'CUST-TRUST-01',
    customerName: 'Aarav Sharma (High-Trust VIP)',
    customerEmail: 'aarav.sharma@example.in',
    customerPhone: '+91 98111 22334',
    merchantId: 'MERCH-BLR-01',
    amount: 4999,
    currency: 'INR',
    paymentMethod: 'UPI',
    failureCode: 'UPI_TIMEOUT',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'FAILED',
    attemptCount: 1,
    previousSuccesses: 18,
    previousFailures: 1,
    customerLifetimeValue: 84500,
    subscription: 'active',
    subscriptionAgeDays: 340,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 14,
    daysSinceLastSuccess: 30,
    customerOptOut: false,
    fraudScore: 0.04,
    demoTag: 'DEMO_1_HIGH_TRUST_TRANSIENT',
  });

  // 2. GUARANTEED DEMO CASE 2: 3+ attempts → STOP (Intervention velocity limit)
  records.push({
    transactionId: 'TXN-DEMO-002',
    customerId: 'CUST-EXHAUST-02',
    customerName: 'Aditya Mehta (Fatigued Payer)',
    customerEmail: 'aditya.mehta@example.in',
    customerPhone: '+91 98222 33445',
    merchantId: 'MERCH-MUM-02',
    amount: 1299,
    currency: 'INR',
    paymentMethod: 'UPI',
    failureCode: 'UPI_PSP_FAILURE',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'HALTED',
    attemptCount: 3,
    previousSuccesses: 2,
    previousFailures: 4,
    customerLifetimeValue: 3900,
    subscription: 'past_due',
    subscriptionAgeDays: 45,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 18,
    daysSinceLastSuccess: 75,
    customerOptOut: false,
    fraudScore: 0.18,
    demoTag: 'DEMO_2_THREE_ATTEMPTS_STOP',
  });

  // 3. GUARANTEED DEMO CASE 3: High fraud score → BLOCK automatic recovery
  records.push({
    transactionId: 'TXN-DEMO-003',
    customerId: 'CUST-RISK-03',
    customerName: 'Anonymized Proxy (Suspicious Velocity)',
    customerEmail: 'vpn_usr992@tempmail.io',
    customerPhone: '+91 97333 44556',
    merchantId: 'MERCH-DEL-03',
    amount: 8500,
    currency: 'INR',
    paymentMethod: 'Card',
    failureCode: 'CARD_DECLINED',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'HALTED',
    attemptCount: 1,
    previousSuccesses: 0,
    previousFailures: 6,
    customerLifetimeValue: 0,
    subscription: 'trialing',
    subscriptionAgeDays: 2,
    channelPreference: 'EMAIL',
    typicalPaymentHour: 3,
    daysSinceLastSuccess: 999,
    customerOptOut: false,
    fraudScore: 0.88,
    demoTag: 'DEMO_3_HIGH_FRAUD_BLOCK',
  });

  // 4. GUARANTEED DEMO CASE 4: Opt-out customer → Communication Blocked
  records.push({
    transactionId: 'TXN-DEMO-004',
    customerId: 'CUST-DND-04',
    customerName: 'Dr. Vikram Iyer (TRAI DND Opted-Out)',
    customerEmail: 'vikram.iyer@hospital.org',
    customerPhone: '+91 98444 55667',
    merchantId: 'MERCH-CHE-04',
    amount: 3499,
    currency: 'INR',
    paymentMethod: 'UPI',
    failureCode: 'UPI_INSUFFICIENT_BALANCE',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'FAILED',
    attemptCount: 1,
    previousSuccesses: 12,
    previousFailures: 0,
    customerLifetimeValue: 42000,
    subscription: 'active',
    subscriptionAgeDays: 210,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 20,
    daysSinceLastSuccess: 31,
    customerOptOut: true, // DND / Opt-out
    fraudScore: 0.05,
    demoTag: 'DEMO_4_OPT_OUT_BLOCKED',
  });

  // 5. GUARANTEED DEMO CASE 5: High-value transaction (>= ₹25,000) → HUMAN_REVIEW
  records.push({
    transactionId: 'TXN-DEMO-005',
    customerId: 'CUST-CORP-05',
    customerName: 'Kavya Deshmukh (Enterprise SaaS)',
    customerEmail: 'kavya@enterprise-tech.co',
    customerPhone: '+91 99555 66778',
    merchantId: 'MERCH-BLR-01',
    amount: 48500, // High Value
    currency: 'INR',
    paymentMethod: 'AutoPay',
    failureCode: 'MANDATE_PAUSED',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'FAILED',
    attemptCount: 1,
    previousSuccesses: 8,
    previousFailures: 0,
    customerLifetimeValue: 388000,
    subscription: 'active',
    subscriptionAgeDays: 520,
    channelPreference: 'EMAIL',
    typicalPaymentHour: 11,
    daysSinceLastSuccess: 30,
    customerOptOut: false,
    fraudScore: 0.02,
    demoTag: 'DEMO_5_HIGH_VALUE_REVIEW',
  });

  // 6. GUARANTEED DEMO CASE 6: Customer cancelled → NO_ACTION
  records.push({
    transactionId: 'TXN-DEMO-006',
    customerId: 'CUST-CHURN-06',
    customerName: 'Rohan Banerjee (Cancelled Intent)',
    customerEmail: 'rohan.b@example.in',
    customerPhone: '+91 98666 77889',
    merchantId: 'MERCH-HYD-05',
    amount: 999,
    currency: 'INR',
    paymentMethod: 'UPI',
    failureCode: 'CUSTOMER_CANCELLED',
    timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    status: 'CLOSED_NO_ACTION',
    attemptCount: 1,
    previousSuccesses: 1,
    previousFailures: 2,
    customerLifetimeValue: 999,
    subscription: 'past_due',
    subscriptionAgeDays: 28,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 19,
    daysSinceLastSuccess: 60,
    customerOptOut: false,
    fraudScore: 0.12,
    demoTag: 'DEMO_6_CUSTOMER_CANCELLED_NO_ACTION',
  });

  // 7. GUARANTEED DEMO CASE 7: Expired card → No blind retry, Switch Method
  records.push({
    transactionId: 'TXN-DEMO-007',
    customerId: 'CUST-CARD-07',
    customerName: 'Deepak Choudhury (Expired Visa)',
    customerEmail: 'deepak.c@example.in',
    customerPhone: '+91 98777 88990',
    merchantId: 'MERCH-PUN-06',
    amount: 2499,
    currency: 'INR',
    paymentMethod: 'Card',
    failureCode: 'CARD_EXPIRED',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'FAILED',
    attemptCount: 1,
    previousSuccesses: 15,
    previousFailures: 1,
    customerLifetimeValue: 37500,
    subscription: 'active',
    subscriptionAgeDays: 410,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 15,
    daysSinceLastSuccess: 31,
    customerOptOut: false,
    fraudScore: 0.08,
    demoTag: 'DEMO_7_EXPIRED_CARD_SWITCH',
  });

  // 8. GUARANTEED DEMO CASE 8: UPI Insufficient Balance → BUSINESS DECLINE (Customer responsible) → WhatsApp outreach
  records.push({
    transactionId: 'TXN-DEMO-008',
    customerId: 'CUST-BAL-08',
    customerName: 'Pooja Agarwal (UPI Balance Low)',
    customerEmail: 'pooja.agarwal@example.in',
    customerPhone: '+91 98888 11223',
    merchantId: 'MERCH-DEL-01',
    amount: 1999,
    currency: 'INR',
    paymentMethod: 'UPI',
    failureCode: 'UPI_INSUFFICIENT_BALANCE',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'FAILED',
    attemptCount: 1,
    previousSuccesses: 9,
    previousFailures: 1,
    customerLifetimeValue: 17991,
    subscription: 'active',
    subscriptionAgeDays: 180,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 16,
    daysSinceLastSuccess: 30,
    customerOptOut: false,
    fraudScore: 0.05,
    recentInterventions24h: 0,
    consecutiveFailedInterventions: 0,
    demoTag: 'DEMO_8_BUSINESS_UPI_BALANCE',
  });

  // 9. GUARANTEED DEMO CASE 9: Customer Intervention Fatigue → Limit Reached (24h Cap) → NO_ACTION Exception
  records.push({
    transactionId: 'TXN-DEMO-009',
    customerId: 'CUST-FATIGUE-09',
    customerName: 'Siddharth Rao (Over-Notified Customer)',
    customerEmail: 'siddharth.rao@example.in',
    customerPhone: '+91 98999 22334',
    merchantId: 'MERCH-BLR-02',
    amount: 3200,
    currency: 'INR',
    paymentMethod: 'UPI',
    failureCode: 'UPI_INSUFFICIENT_BALANCE',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'FAILED',
    attemptCount: 1,
    previousSuccesses: 14,
    previousFailures: 2,
    customerLifetimeValue: 44800,
    subscription: 'active',
    subscriptionAgeDays: 240,
    channelPreference: 'WHATSAPP',
    typicalPaymentHour: 17,
    daysSinceLastSuccess: 15,
    customerOptOut: false,
    fraudScore: 0.04,
    recentInterventions24h: 2, // At policy cap (2 of 2)
    recentInterventions72h: 3,
    lastInterventionAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago, in 12h cooldown
    consecutiveFailedInterventions: 2,
    demoTag: 'DEMO_9_RECOVERY_FATIGUE_BLOCKED',
  });

  // Now generate remaining realistic correlated synthetic records up to `count`
  const remainingCount = Math.max(0, count - records.length);

  for (let i = 0; i < remainingCount; i++) {
    const idNum = i + 8;
    const padId = String(idNum).padStart(4, '0');
    const transactionId = `TXN-${padId}`;
    const customerId = `CUST-${String((idNum % 420) + 1).padStart(4, '0')}`;

    const firstName = FIRST_NAMES[idNum % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(idNum / FIRST_NAMES.length) % LAST_NAMES.length];
    const customerName = `${firstName} ${lastName}`;
    const customerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idNum % 17}@example.in`;
    const customerPhone = `+91 ${98000 + (idNum % 1999)} ${10000 + (idNum % 89999)}`;

    // Realistic distributions
    const isUPI = Math.random() < 0.68; // UPI dominates in India
    let paymentMethod: PaymentMethod = 'UPI';
    if (!isUPI) {
      const r = Math.random();
      if (r < 0.60) paymentMethod = 'Card';
      else if (r < 0.85) paymentMethod = 'AutoPay';
      else paymentMethod = 'NetBanking';
    }

    // Failure distribution matching realistic Indian payment switch
    let failureCode: FailureCode;
    if (paymentMethod === 'UPI') {
      const u = Math.random();
      if (u < 0.35) failureCode = 'UPI_TIMEOUT';
      else if (u < 0.55) failureCode = 'UPI_INSUFFICIENT_BALANCE';
      else if (u < 0.75) failureCode = 'UPI_PSP_FAILURE';
      else if (u < 0.85) failureCode = 'UPI_BANK_UNAVAILABLE';
      else if (u < 0.95) failureCode = 'CUSTOMER_CANCELLED';
      else failureCode = 'UPI_INVALID_VPA';
    } else if (paymentMethod === 'Card') {
      const c = Math.random();
      if (c < 0.35) failureCode = 'CARD_AUTHENTICATION_FAILURE';
      else if (c < 0.55) failureCode = 'CARD_DECLINED';
      else if (c < 0.75) failureCode = 'CARD_INSUFFICIENT_FUNDS';
      else if (c < 0.90) failureCode = 'CARD_EXPIRED';
      else failureCode = 'BANK_DECLINED';
    } else if (paymentMethod === 'AutoPay') {
      const a = Math.random();
      if (a < 0.50) failureCode = 'MANDATE_PAUSED';
      else if (a < 0.80) failureCode = 'UPI_INSUFFICIENT_BALANCE';
      else failureCode = 'MANDATE_REVOKED';
    } else {
      failureCode = Math.random() < 0.6 ? 'NETWORK_ERROR' : 'BANK_DECLINED';
    }

    // Amount distributions (subscription plans & e-commerce payments in INR)
    const amountTiers = [299, 499, 999, 1499, 2499, 3999, 4999, 7999, 12999, 29999];
    const amount = amountTiers[Math.floor(Math.random() * amountTiers.length)];

    // Correlated customer history
    const customerAgeTier = Math.random();
    let previousSuccesses = 0;
    let previousFailures = 0;
    let clv = amount;
    let subscription: CustomerSubscriptionStatus = 'trialing';
    let subscriptionAgeDays = 5;

    if (customerAgeTier > 0.65) {
      // Loyal / High-trust
      previousSuccesses = Math.floor(6 + Math.random() * 24);
      previousFailures = Math.floor(Math.random() * 3);
      clv = previousSuccesses * amount;
      subscription = 'active';
      subscriptionAgeDays = Math.floor(120 + Math.random() * 500);
    } else if (customerAgeTier > 0.30) {
      // Moderate customer
      previousSuccesses = Math.floor(2 + Math.random() * 5);
      previousFailures = Math.floor(Math.random() * 3);
      clv = previousSuccesses * amount;
      subscription = Math.random() > 0.3 ? 'active' : 'past_due';
      subscriptionAgeDays = Math.floor(30 + Math.random() * 90);
    } else {
      // New / Riskier customer
      previousSuccesses = Math.random() < 0.4 ? 1 : 0;
      previousFailures = Math.floor(1 + Math.random() * 4);
      clv = previousSuccesses * amount;
      subscription = Math.random() < 0.5 ? 'trialing' : 'churned';
      subscriptionAgeDays = Math.floor(1 + Math.random() * 20);
    }

    // Fraud score correlation
    let fraudScore = Number((Math.random() * 0.25).toFixed(2));
    if (previousFailures > 3 && previousSuccesses === 0) {
      fraudScore = Number((0.60 + Math.random() * 0.35).toFixed(2));
    }

    const attemptCount = Math.min(4, Math.max(1, Math.floor(Math.random() * 3.2)));
    const customerOptOut = Math.random() < 0.08; // 8% opt-out rate in general pop
    const channelPreference = Math.random() < 0.72 ? 'WHATSAPP' : 'EMAIL';
    const typicalPaymentHour = Math.floor(9 + Math.random() * 13);
    const daysSinceLastSuccess = previousSuccesses > 0 ? Math.floor(1 + Math.random() * 45) : 180;

    // Realistic status
    let status: 'FAILED' | 'RECOVERING' | 'RECOVERED' | 'HALTED' | 'CLOSED_NO_ACTION' = 'FAILED';
    if (attemptCount >= 3 || fraudScore >= 0.70) {
      status = 'HALTED';
    } else if (failureCode === 'CUSTOMER_CANCELLED' || failureCode === 'MANDATE_REVOKED') {
      status = 'CLOSED_NO_ACTION';
    }

    // Random timestamp within last 7 days
    const timeAgoMs = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
    const timestamp = new Date(Date.now() - timeAgoMs).toISOString();

    records.push({
      transactionId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      merchantId: `MERCH-IN-${(idNum % 10) + 1}`,
      amount,
      currency: 'INR',
      paymentMethod,
      failureCode,
      timestamp,
      status,
      attemptCount,
      previousSuccesses,
      previousFailures,
      customerLifetimeValue: clv,
      subscription,
      subscriptionAgeDays,
      channelPreference,
      typicalPaymentHour,
      daysSinceLastSuccess,
      customerOptOut,
      fraudScore,
    });
  }

  return records;
}

export function initTransactionsData(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const guaranteedCases = seedSyntheticTransactions(9).slice(0, 9);

  if (fs.existsSync(TRANSACTIONS_FILE)) {
    try {
      const data = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
      inMemoryTransactions = JSON.parse(data);
      if (inMemoryTransactions.length < 500) {
        // reseed if inadequate
        inMemoryTransactions = seedSyntheticTransactions(1000);
        fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(inMemoryTransactions, null, 2), 'utf8');
      } else {
        // Ensure guaranteed demo cases (1-9) are always up to date while preserving simulated execution state
        for (const gCase of guaranteedCases) {
          const idx = inMemoryTransactions.findIndex((t) => t.transactionId === gCase.transactionId);
          if (idx >= 0) {
            const existing = inMemoryTransactions[idx];
            inMemoryTransactions[idx] = {
              ...gCase,
              ...existing,
              // Ensure critical static scenario attributes from gCase are maintained
              customerId: gCase.customerId,
              customerName: gCase.customerName,
              customerEmail: gCase.customerEmail,
              customerPhone: gCase.customerPhone,
              merchantId: gCase.merchantId,
              amount: gCase.amount,
              currency: gCase.currency,
              paymentMethod: gCase.paymentMethod,
              failureCode: gCase.failureCode,
              customerLifetimeValue: gCase.customerLifetimeValue,
              customerOptOut: gCase.customerOptOut,
              fraudScore: gCase.fraudScore,
              demoTag: gCase.demoTag,
              // Runtime execution fields from existing:
              status: existing.status || gCase.status,
              attemptCount: existing.attemptCount ?? gCase.attemptCount,
              lastDecision: existing.lastDecision ?? gCase.lastDecision,
              lastSimulatedOutcome: existing.lastSimulatedOutcome ?? gCase.lastSimulatedOutcome,
              recoveredAt: existing.recoveredAt ?? gCase.recoveredAt,
            };
          } else {
            inMemoryTransactions.unshift(gCase);
          }
        }
      }
    } catch (e) {
      console.warn('Failed reading transactions file, reseeding synthetic dataset:', e);
      inMemoryTransactions = seedSyntheticTransactions(1000);
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(inMemoryTransactions, null, 2), 'utf8');
    }
  } else {
    inMemoryTransactions = seedSyntheticTransactions(1000);
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(inMemoryTransactions, null, 2), 'utf8');
  }
}

export function getAllTransactions(): TransactionRecord[] {
  return inMemoryTransactions;
}

export function getTransactionById(id: string): TransactionRecord | undefined {
  return inMemoryTransactions.find((t) => t.transactionId === id);
}

export function updateTransaction(id: string, updates: Partial<TransactionRecord>): TransactionRecord | undefined {
  const index = inMemoryTransactions.findIndex((t) => t.transactionId === id);
  if (index === -1) return undefined;

  inMemoryTransactions[index] = {
    ...inMemoryTransactions[index],
    ...updates,
  };

  // persist asynchronously
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(inMemoryTransactions, null, 2), 'utf8');
  } catch (err) {
    console.error('Error persisting transaction update:', err);
  }

  return inMemoryTransactions[index];
}

export function resetAndSeedTransactions(count: number = 1000): TransactionRecord[] {
  inMemoryTransactions = seedSyntheticTransactions(count);
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(inMemoryTransactions, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving seeded transactions:', e);
  }
  return inMemoryTransactions;
}
