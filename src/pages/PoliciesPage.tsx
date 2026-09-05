import React, { useEffect, useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  UserX,
} from 'lucide-react';
import { fetchPolicies, updatePolicies } from '../services/api';
import { MerchantPolicies } from '../types';

export const PoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<MerchantPolicies | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetchPolicies();
      setPolicies(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleSave = async () => {
    if (!policies) return;
    try {
      setSaving(true);
      const res = await updatePolicies(policies);
      setPolicies(res);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save policies');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const defaults: MerchantPolicies = {
      maxRetries: 3,
      maxNotifications: 2,
      maxNotifications24h: 2,
      cooldownHours: 1,
      maxConsecutiveFailedInterventions: 2,
      highValueThreshold: 25000,
      fraudThreshold: 0.70,
      minRecoveryProbability: 0.20,
      interventionBudget: 25000,
      budgetSpent: policies?.budgetSpent || 4280,
      recoveryWindowHours: 72,
    };
    setPolicies(defaults);
    await updatePolicies(defaults);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  if (loading || !policies) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading merchant policy configuration...
      </div>
    );
  }

  return (
    <div id="policies-page" className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Recovery Policies & Guardrails
            </h1>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
              Deterministic Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rules and constraints governing autonomous interventions, retry limits, and fraud safety checks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Defaults
          </button>

          <button
            id="btn-save-policies"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Policies'}</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Policies updated successfully and synced with the decision engine.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {/* Max Retries */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-max-retries" className="font-semibold text-xs text-slate-900">
                Maximum Retry Attempts
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Retry Limit
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Halts automated payment retries once this limit is reached to prevent gateway rate-limiting.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-max-retries"
              type="number"
              min="1"
              max="5"
              value={policies.maxRetries}
              onChange={(e) =>
                setPolicies({ ...policies, maxRetries: parseInt(e.target.value) || 1 })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">retries</span>
          </div>
        </div>

        {/* Max Customer Notifications */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-max-notifs" className="font-semibold text-xs text-slate-900">
                Maximum Incident Notifications
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Per Incident
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upper limit on notifications (WhatsApp/Email) sent per single failed payment incident.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-max-notifs"
              type="number"
              min="1"
              max="4"
              value={policies.maxNotifications}
              onChange={(e) =>
                setPolicies({ ...policies, maxNotifications: parseInt(e.target.value) || 1 })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">messages</span>
          </div>
        </div>

        {/* 24-Hour Fatigue Cap (Feature 2) */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-max-notifs-24h" className="font-semibold text-xs text-slate-900">
                Customer Fatigue Limit (24h Window)
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Fatigue Guard
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Global maximum interventions allowed per customer across all failures within a rolling 24-hour window.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-max-notifs-24h"
              type="number"
              min="1"
              max="5"
              value={policies.maxNotifications24h}
              onChange={(e) =>
                setPolicies({ ...policies, maxNotifications24h: parseInt(e.target.value) || 1 })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">per 24h</span>
          </div>
        </div>

        {/* Channel Cooldown Window */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-cooldown-hours" className="font-semibold text-xs text-slate-900">
                Intervention Cooldown Period
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Cooldown
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Minimum elapsed time following an outreach event before another message can be sent to the same customer.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-cooldown-hours"
              type="number"
              min="1"
              max="24"
              value={policies.cooldownHours}
              onChange={(e) =>
                setPolicies({ ...policies, cooldownHours: parseInt(e.target.value) || 1 })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">hours</span>
          </div>
        </div>

        {/* High-Value Threshold */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-high-val" className="font-semibold text-xs text-slate-900">
                High-Value Review Threshold
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Review Escrow
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transactions exceeding this amount require operations approval rather than automated dispatch.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 text-xs">₹</span>
            <input
              id="input-high-val"
              type="number"
              step="1000"
              value={policies.highValueThreshold}
              onChange={(e) =>
                setPolicies({
                  ...policies,
                  highValueThreshold: parseInt(e.target.value) || 1000,
                })
              }
              className="w-28 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Fraud Risk Threshold */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-fraud-limit" className="font-semibold text-xs text-slate-900">
                Fraud Score Threshold
              </label>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-medium">
                Block Filter
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transactions with a fraud score at or above this value are blocked from automated retries and recovery.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-fraud-limit"
              type="number"
              step="0.05"
              min="0.10"
              max="0.95"
              value={policies.fraudThreshold}
              onChange={(e) =>
                setPolicies({
                  ...policies,
                  fraudThreshold: parseFloat(e.target.value) || 0.7,
                })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">0.0 – 1.0</span>
          </div>
        </div>

        {/* Minimum Recovery Probability */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-min-prob" className="font-semibold text-xs text-slate-900">
                Minimum Recovery Probability
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                ROI Floor
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strategies with projected success probability below this floor are excluded from consideration.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-min-prob"
              type="number"
              step="0.05"
              min="0.05"
              max="0.50"
              value={policies.minRecoveryProbability}
              onChange={(e) =>
                setPolicies({
                  ...policies,
                  minRecoveryProbability: parseFloat(e.target.value) || 0.1,
                })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">
              ({Math.round(policies.minRecoveryProbability * 100)}%)
            </span>
          </div>
        </div>

        {/* Monthly Intervention Budget */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-budget-cap" className="font-semibold text-xs text-slate-900">
                Monthly Intervention Budget
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Budget Cap
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Maximum spend allocation for SMS gateways, WhatsApp BSPs, and external API requests per month.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 text-xs">₹</span>
            <input
              id="input-budget-cap"
              type="number"
              step="1000"
              value={policies.interventionBudget}
              onChange={(e) =>
                setPolicies({
                  ...policies,
                  interventionBudget: parseInt(e.target.value) || 5000,
                })
              }
              className="w-28 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Recovery Window */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <label htmlFor="input-window-hours" className="font-semibold text-xs text-slate-900">
                Maximum Recovery Window
              </label>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Time-to-Live
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transactions older than this window are closed out without further intervention in accordance with clearing TTLs.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="input-window-hours"
              type="number"
              step="6"
              min="12"
              max="168"
              value={policies.recoveryWindowHours}
              onChange={(e) =>
                setPolicies({
                  ...policies,
                  recoveryWindowHours: parseInt(e.target.value) || 24,
                })
              }
              className="w-20 px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400 font-mono">hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};
