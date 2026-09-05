import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ExternalLink,
  Ban,
  ShieldCheck,
  Target,
  Sparkles,
  Zap,
  Sliders,
  UserX,
  BellOff,
  Flame,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchDashboard, fetchOpportunities, fetchExceptions } from '../services/api';
import { DashboardData, RecoveryOpportunity, HonestException } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  transient: '#10b981', // emerald
  customer_action_required: '#3b82f6', // blue
  payment_method_problem: '#f59e0b', // amber
  permanent: '#ef4444', // red
  potentially_risky: '#8b5cf6', // purple
  other: '#64748b',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

interface Props {
  onSelectTx: (txId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardPage: React.FC<Props> = ({ onSelectTx, onNavigateToTab }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [opportunities, setOpportunities] = useState<RecoveryOpportunity[]>([]);
  const [exceptions, setExceptions] = useState<HonestException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exceptionFilter, setExceptionFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, oppRes, excRes] = await Promise.all([
        fetchDashboard(),
        fetchOpportunities(),
        fetchExceptions(),
      ]);
      setData(dashRes);
      setOpportunities(oppRes.opportunities || []);
      setExceptions(excRes.exceptions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Calculating revenue recovery metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center justify-between">
          <span>{error || 'No dashboard data available.'}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredExceptions = exceptions.filter((exc) => {
    if (exceptionFilter === 'ALL') return true;
    if (exceptionFilter === 'FATIGUE') return exc.category === 'RECOVERY_FATIGUE';
    if (exceptionFilter === 'BLOCKED') return exc.category === 'BLOCKED';
    if (exceptionFilter === 'DND') return exc.category === 'CUSTOMER_OPTED_OUT';
    if (exceptionFilter === 'STOPPED') return exc.category === 'STOPPED';
    if (exceptionFilter === 'NO_ACTION') return exc.category === 'NO_ACTION';
    return true;
  });

  return (
    <div id="dashboard-page" className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Recovery Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of failed checkouts, automated interventions, and recovered revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-dashboard"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-medium text-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Refresh
          </button>
          <button
            onClick={() => onNavigateToTab('simulator')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
          >
            <span>Simulator</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Row 1: Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Revenue at Risk */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Failed Revenue</span>
            <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{data.revenueAtRisk.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">100 failed transactions</p>
        </div>

        {/* Recoverable Revenue */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Projected Opportunity</span>
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{data.recoverableRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">High & medium probability</p>
        </div>

        {/* Revenue Recovered */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Recovered Revenue</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-emerald-700">
              ₹{data.revenueRecovered.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium font-mono">
            {data.recoveryRate}% overall recovery rate
          </p>
        </div>

        {/* Guardrail Blocked Actions */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Guardrail Blocks</span>
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {data.blockedActions}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Fraud & velocity halts</p>
        </div>

        {/* Strategic No-Action */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Policy Restraints</span>
            <Ban className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {data.noActionDecisions}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Zero-friction non-retries</p>
        </div>
      </div>

      {/* Operational Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-white border border-slate-200 rounded-lg text-xs">
        <div>
          <span className="text-slate-400 font-medium">Eligible for Retry</span>
          <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{data.eligiblePayments.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Interventions Dispatched</span>
          <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{data.interventions.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Recovered Count</span>
          <p className="font-mono font-semibold text-emerald-700 text-sm mt-0.5">{data.successfulRecoveries.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Total Volume Analyzed</span>
          <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">₹{Math.round(data.revenueProcessed).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* TOP RECOVERY OPPORTUNITIES */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Priority Recovery Opportunities
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked 0–100 by net expected value, CLV, recovery probability, and failure responsibility.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 self-start sm:self-auto"
          >
            All Transactions
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <th className="py-2.5 px-4">Score</th>
                <th className="py-2.5 px-4">Transaction ID & Customer</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Failure & Responsibility</th>
                <th className="py-2.5 px-4">Strategy</th>
                <th className="py-2.5 px-4">Expected Net</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.slice(0, 7).map((opp, idx) => {
                const isHigh = opp.score >= 70;
                const isMed = opp.score >= 40 && opp.score < 70;
                const badgeColor = isHigh
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isMed
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200';

                return (
                  <tr
                    key={opp.transactionId}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-400">#{idx + 1}</span>
                        <span
                          className={`font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded border ${badgeColor}`}
                        >
                          {opp.score}/100
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-medium text-slate-900 block">{opp.transactionId}</span>
                      <span className="text-[11px] text-slate-500">{opp.customer.name}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                      ₹{opp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded">
                          {opp.failureCode}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {opp.responsibility} ({opp.responsibleParty})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[11px] text-slate-800 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                        {opp.recommendedAction}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-emerald-700">
                      ₹{Math.round(opp.expectedRecovery).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onSelectTx(opp.transactionId)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                      >
                        Simulate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POLICY RESTRAINTS & EXCEPTIONS */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Policy Restraints & Strategic Exceptions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deliberate non-actions to prevent notification fatigue, comply with TRAI DND, and block fraud.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'FATIGUE', label: 'Fatigue Limit' },
              { id: 'BLOCKED', label: 'Anti-Fraud' },
              { id: 'DND', label: 'TRAI DND' },
              { id: 'STOPPED', label: 'Attempt Cap' },
              { id: 'NO_ACTION', label: 'No Action' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setExceptionFilter(chip.id)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  exceptionFilter === chip.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {filteredExceptions.slice(0, 6).map((exc) => {
            const isFatigue = exc.category === 'RECOVERY_FATIGUE';
            const isFraud = exc.category === 'BLOCKED';
            const isDnd = exc.category === 'CUSTOMER_OPTED_OUT';
            const isCap = exc.category === 'STOPPED';

            return (
              <div
                key={exc.transactionId}
                onClick={() => onSelectTx(exc.transactionId)}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {exc.transactionId}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-medium ${
                      isFatigue
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : isFraud
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : isDnd
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : isCap
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {exc.category.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-700">{exc.customer.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">₹{exc.amount.toLocaleString('en-IN')} • {exc.failureCode}</div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200/80 leading-relaxed">
                  {exc.reason}
                </p>

                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{exc.avoidedCostOrIntervention}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Recovery Funnel & Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recovery Funnel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recovery Pipeline Progression</h2>
              <p className="text-xs text-slate-400">Stages from incoming failure webhook to final settlement</p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Standard Policy
            </span>
          </div>

          <div className="space-y-3.5">
            {data.funnel.map((step, idx) => {
              const maxVal = data.funnel[0]?.value || 1;
              const widthPct = Math.max(8, Math.round((step.value / maxVal) * 100));
              const barColors = [
                'bg-slate-300',
                'bg-slate-400',
                'bg-slate-500',
                'bg-emerald-600',
              ];

              return (
                <div key={step.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {idx + 1}. {step.stage}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-[11px]">{step.count.toLocaleString()} txns</span>
                      <span className="font-mono font-medium text-slate-900">
                        ₹{step.value.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColors[idx]}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900">Settlement by Instrument</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">Recovery success by method type</p>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethodStats}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={35}
                    paddingAngle={2}
                  >
                    {data.paymentMethodStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => {
                      const p = item.payload;
                      const recoveredDesc = p.recovered > 0
                        ? `${p.recovered} of ${p.interventions || p.recovered} recovered (${p.rate}%)`
                        : `0 recovered (0%)`;
                      return [
                        `${p.total} failures • ${recoveredDesc}`,
                        name,
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {data.paymentMethodStats.map((item, idx) => (
              <div key={item.method} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate text-[11px]">{item.method}</span>
                </div>
                <div className="font-mono text-xs shrink-0">
                  {item.recovered > 0 ? (
                    <span className="text-emerald-700 font-medium">{item.rate}%</span>
                  ) : (
                    <span className="text-slate-400">0%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Failure Taxonomy Distribution Chart */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Failure Reason Distribution</h2>
            <p className="text-xs text-slate-400">Transaction counts grouped by primary decline root cause</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Technical
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Customer Action
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span> Method Issue
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span> Terminal
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.failureDistribution.slice(0, 8)}
              margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
            >
              <XAxis
                dataKey="code"
                angle={-15}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(value: any, name: any, item: any) => [
                  `${value} transactions (${item.payload.category})`,
                  'Volume',
                ]}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {data.failureDistribution.slice(0, 8).map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Recent Decisions Stream */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Ledger Activity</h2>
            <p className="text-xs text-slate-400">Append-only log of recent recovery decisions and policy stops</p>
          </div>
          <button
            onClick={() => onNavigateToTab('ledger')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            Full Ledger
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recentDecisions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No simulated recovery executions yet. Select a failed payment to test!
            </div>
          ) : (
            data.recentDecisions.map((entry) => (
              <div
                key={entry.auditId}
                onClick={() => onSelectTx(entry.transactionId)}
                className="px-5 py-3 hover:bg-slate-50/70 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                      entry.selectedAction === 'NO_ACTION'
                        ? 'bg-slate-50 text-slate-700 border-slate-200'
                        : entry.executionStatus === 'BLOCKED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {entry.selectedAction === 'NO_ACTION' ? 'STOP' : 'ACT'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-slate-900">
                        {entry.transactionId}
                      </span>
                      <span className="text-xs text-slate-500">• {entry.customer.name}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                        {entry.failureCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Strategy: <strong className="text-slate-700 font-medium">{entry.selectedAction}</strong> — {entry.simulatedOutcome}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-medium text-slate-900">
                    ₹{entry.amount.toLocaleString('en-IN')}
                  </span>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

