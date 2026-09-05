import fs from 'fs';
import path from 'path';
import { AuditLogEntry } from './types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.jsonl');

let cachedAuditLogs: AuditLogEntry[] = [];

export function initAuditLedger(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(AUDIT_FILE)) {
    try {
      const content = fs.readFileSync(AUDIT_FILE, 'utf8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      cachedAuditLogs = lines.map((line) => JSON.parse(line));
    } catch (e) {
      console.warn('Could not read existing audit log, starting fresh:', e);
      cachedAuditLogs = [];
    }
  } else {
    fs.writeFileSync(AUDIT_FILE, '', 'utf8');
    cachedAuditLogs = [];
  }
}

export function appendAuditLog(entry: AuditLogEntry): void {
  cachedAuditLogs.unshift(entry);
  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to append to audit log file:', err);
  }
}

export function getAuditLogs(filters?: {
  action?: string;
  status?: string;
  limit?: number;
}): AuditLogEntry[] {
  let logs = [...cachedAuditLogs];
  if (filters?.action) {
    logs = logs.filter((l) => l.selectedAction === filters.action);
  }
  if (filters?.status) {
    logs = logs.filter((l) => l.executionStatus === filters.status);
  }
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }
  return logs;
}

export function getAuditLogById(auditId: string): AuditLogEntry | undefined {
  return cachedAuditLogs.find((l) => l.auditId === auditId);
}

export function clearAuditLedger(): void {
  cachedAuditLogs = [];
  try {
    fs.writeFileSync(AUDIT_FILE, '', 'utf8');
  } catch (err) {
    console.error('Failed to clear audit log file:', err);
  }
}
