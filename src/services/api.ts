import {
  AuditLogEntry,
  DashboardData,
  EngineHealthResponse,
  EvaluationData,
  ExecutionResult,
  MerchantPolicies,
  SimulationResult,
  TransactionRecord,
  VerificationResponse,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard metrics');
  return res.json();
}

export async function fetchTransactions(params?: {
  search?: string;
  paymentMethod?: string;
  failureType?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  demoCaseOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; transactions: TransactionRecord[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params?.failureType) query.set('failureType', params.failureType);
  if (params?.status) query.set('status', params.status);
  if (params?.minAmount) query.set('minAmount', String(params.minAmount));
  if (params?.maxAmount) query.set('maxAmount', String(params.maxAmount));
  if (params?.demoCaseOnly) query.set('demoCaseOnly', 'true');
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load transactions');
  return res.json();
}

export async function fetchTransaction(
  transactionId: string
): Promise<{ transaction: TransactionRecord; diagnosis: any }> {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}`);
  if (!res.ok) throw new Error(`Transaction ${transactionId} not found`);
  return res.json();
}

export async function simulateRecovery(transactionId: string): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate/${transactionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to simulate recovery');
  }
  return res.json();
}

export async function executeRecovery(
  transactionId: string,
  actionOverride?: string
): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE}/execute/${transactionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionOverride }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to execute simulated recovery');
  }
  return res.json();
}

export async function fetchAuditLogs(params?: {
  action?: string;
  status?: string;
  limit?: number;
}): Promise<{ logs: AuditLogEntry[] }> {
  const query = new URLSearchParams();
  if (params?.action) query.set('action', params.action);
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/audit?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load audit logs');
  return res.json();
}

export async function fetchAuditLogDetail(auditId: string): Promise<AuditLogEntry> {
  const res = await fetch(`${API_BASE}/audit/${auditId}`);
  if (!res.ok) throw new Error('Failed to load audit detail');
  return res.json();
}

export async function fetchEvaluation(): Promise<EvaluationData> {
  const res = await fetch(`${API_BASE}/evaluation`);
  if (!res.ok) throw new Error('Failed to load evaluation');
  return res.json();
}

export async function fetchPolicies(): Promise<MerchantPolicies> {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to fetch merchant policies');
  return res.json();
}

export async function updatePolicies(policies: Partial<MerchantPolicies>): Promise<MerchantPolicies> {
  const res = await fetch(`${API_BASE}/policies`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policies),
  });
  if (!res.ok) throw new Error('Failed to update policies');
  return res.json();
}

export async function seedSyntheticDataset(count: number = 1000): Promise<{ success: boolean; message: string; count: number }> {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error('Failed to reseed synthetic transactions');
  return res.json();
}

export async function fetchOpportunities(): Promise<{ opportunities: any[] }> {
  const res = await fetch(`${API_BASE}/opportunities`);
  if (!res.ok) throw new Error('Failed to fetch recovery opportunities');
  return res.json();
}

export async function fetchExceptions(): Promise<{ exceptions: any[] }> {
  const res = await fetch(`${API_BASE}/exceptions`);
  if (!res.ok) throw new Error('Failed to fetch honest exceptions');
  return res.json();
}

export async function runVerification(): Promise<VerificationResponse> {
  const res = await fetch(`${API_BASE}/verification`);
  if (!res.ok) throw new Error('Failed to run verification');
  return res.json();
}

export async function fetchEngineHealth(): Promise<EngineHealthResponse> {
  const res = await fetch(`${API_BASE}/engine-health`);
  if (!res.ok) throw new Error('Failed to fetch engine health');
  return res.json();
}

