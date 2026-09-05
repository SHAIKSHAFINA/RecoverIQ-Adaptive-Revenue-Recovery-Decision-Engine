import fs from 'fs';
import path from 'path';
import { MerchantPolicies } from './types.js';

const POLICIES_FILE = path.join(process.cwd(), 'data', 'policies.json');

const DEFAULT_POLICIES: MerchantPolicies = {
  maxRetries: 3,
  maxNotifications: 2,
  highValueThreshold: 25000,
  fraudThreshold: 0.70,
  minRecoveryProbability: 0.15,
  interventionBudget: 25000,
  budgetSpent: 4280,
  recoveryWindowHours: 72,
  maxNotifications24h: 2,
  cooldownHours: 12,
  maxConsecutiveFailedInterventions: 2,
};

let currentPolicies: MerchantPolicies = { ...DEFAULT_POLICIES };

function loadPoliciesFromDisk(): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(POLICIES_FILE)) {
      const raw = fs.readFileSync(POLICIES_FILE, 'utf-8');
      currentPolicies = { ...DEFAULT_POLICIES, ...JSON.parse(raw) };
    } else {
      fs.writeFileSync(POLICIES_FILE, JSON.stringify(DEFAULT_POLICIES, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not read or write policies.json, using defaults in memory:', err);
  }
}

// Initial load
loadPoliciesFromDisk();

function savePoliciesToDisk(): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(POLICIES_FILE, JSON.stringify(currentPolicies, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist policies to disk:', err);
  }
}

export function getPolicies(): MerchantPolicies {
  return { ...currentPolicies };
}

export function updatePolicies(updates: Partial<MerchantPolicies>): MerchantPolicies {
  currentPolicies = {
    ...currentPolicies,
    ...updates,
  };
  savePoliciesToDisk();
  return { ...currentPolicies };
}

export function recordInterventionCost(cost: number): void {
  currentPolicies.budgetSpent = Number((currentPolicies.budgetSpent + cost).toFixed(2));
  savePoliciesToDisk();
}

