import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Award,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { fetchEvaluation } from '../services/api';
import { EvaluationData } from '../types';

export const EvaluationPage: React.FC = () => {
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchEvaluation();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm text-slate-600 font-medium">
          Running counterfactual evaluation model across {data?.totalAnalyzed || 1000} transactions...
        </p>
      </div>
    );
  }

  const { baseline, recoverAi, lift, totalAnalyzed } = data;

  return (
    <div id="evaluation-page" className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Comparative Evaluation & Lift
            </h1>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
              1,000 Record Benchmark
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Performance comparison: standard fixed retry policy vs adaptive recovery decision engine across {totalAnalyzed.toLocaleString()} records.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-medium text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Recalculate
        </button>
      </div>

      {/* Row 1: The Lift Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Lift */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Net Revenue Lift</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              +{lift.revenueLiftPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Net recovered revenue after intervention and channel costs
          </p>
        </div>

        {/* Recovery Rate Lift */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Recovery Rate Lift</span>
            <Award className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              +{lift.recoveryRateLiftPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {baseline.recoveryRate}% baseline → {recoverAi.recoveryRate}% adaptive
          </p>
        </div>

        {/* Intervention Efficiency */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Intervention Efficiency</span>
            <Zap className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {lift.interventionEfficiencyMultiplier}x
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Revenue recovered per outbound customer communication
          </p>
        </div>

        {/* Wasted Interventions Saved */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unnecessary Retries Blocked</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {lift.wastedInterventionsSaved.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Redundant retries prevented on invalid VPAs, fraud, and cancellations
          </p>
        </div>
      </div>

      {/* Row 2: Side-by-Side Architectural Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Baseline Naive Policy */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">
                  Benchmark Baseline
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Fixed Retry Policy (3x)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                Baseline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Fixed 3x immediate blind retries with generic notification blasts on all failure codes.
            </p>
          </div>

          <div className="p-4 space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Total Interventions:</span>
              <span className="font-mono font-medium text-slate-800">
                {baseline.interventions.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Successful Recoveries:</span>
              <span className="font-mono font-medium text-slate-800">
                {baseline.successfulRecoveries.toLocaleString()} ({baseline.recoveryRate}%)
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Gross Recovered Revenue:</span>
              <span className="font-mono font-medium text-slate-800">
                ₹{baseline.revenueRecovered.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Channel & Gateway Costs:</span>
              <span className="font-mono font-medium text-rose-700">
                -₹{baseline.totalCost.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-700 font-semibold">Net Recovered Gain:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{baseline.netRevenueGain.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Unnecessary Intervention Rate:</span>
              <span className="font-mono font-medium text-slate-700">
                {baseline.unnecessaryInterventionRate}%
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Customer Friction Score:</span>
              <span className="font-mono font-medium text-slate-700">
                {baseline.customerFrictionScore} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Right: RecoverAI Adaptive Decision Engine */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-medium uppercase">
                  Adaptive Engine
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  RecoverIQ Decision Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic expected value model with failure taxonomy diagnosis and policy guardrails.
            </p>
          </div>

          <div className="p-4 space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Targeted Interventions:</span>
              <span className="font-mono font-medium text-slate-800">
                {recoverAi.interventions.toLocaleString()}{' '}
                <span className="text-slate-400 font-normal">
                  ({baseline.interventions - recoverAi.interventions} fewer wasted)
                </span>
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Successful Recoveries:</span>
              <span className="font-mono font-medium text-slate-800">
                {recoverAi.successfulRecoveries.toLocaleString()} ({recoverAi.recoveryRate}%)
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Gross Recovered Revenue:</span>
              <span className="font-mono font-medium text-slate-900">
                ₹{recoverAi.revenueRecovered.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Channel & Gateway Costs:</span>
              <span className="font-mono font-medium text-slate-700">
                -₹{recoverAi.totalCost.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 pt-2 bg-slate-50 -mx-4 px-4">
              <span className="text-slate-900 font-semibold">Net Recovered Gain:</span>
              <span className="font-mono font-bold text-emerald-700">
                ₹{recoverAi.netRevenueGain.toLocaleString('en-IN')} (+{lift.revenueLiftPercent}%)
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Unnecessary Intervention Rate:</span>
              <span className="font-mono font-medium text-emerald-700">
                {recoverAi.unnecessaryInterventionRate}%
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-2">
              <span className="text-slate-500">Customer Friction Score:</span>
              <span className="font-mono font-medium text-emerald-700">
                {recoverAi.customerFrictionScore} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Why RecoverAI Outperforms */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900">
          Key Drivers of Efficiency Gain
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Failure Code Taxonomy</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Differentiates transient gateway timeouts from terminal failure codes (invalid VPAs), preventing unviable automated attempts.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Strategic Inaction</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Withholds outreach when estimated intervention cost exceeds expected recovery or when customer fatigue limits are reached.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Policy Guardrail Enforcement</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Enforces hard financial limits, fraud stops, and regulatory cooldowns deterministically on the server prior to dispatch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
