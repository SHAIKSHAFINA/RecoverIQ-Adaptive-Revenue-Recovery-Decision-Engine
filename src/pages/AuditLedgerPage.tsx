import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { fetchAuditLogs, fetchAuditLogDetail } from '../services/api';
import { GuardrailBadge } from '../components/GuardrailBadge';
import { AuditLogEntry } from '../types';

interface Props {
  onSelectTx: (txId: string) => void;
}

export const AuditLedgerPage: React.FC<Props> = ({ onSelectTx }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetchAuditLogs({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        limit: 100,
      });
      setLogs(res.logs);
      if (res.logs.length > 0 && !selectedAudit) {
        setSelectedAudit(res.logs[0]);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, statusFilter]);

  return (
    <div id="decision-ledger-page" className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Decision Audit Ledger
            </h1>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical audit record of simulated recovery decisions, guardrail validations, and outcomes.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-medium text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Actions</option>
            <option value="RETRY_NOW">RETRY_NOW</option>
            <option value="RETRY_LATER">RETRY_LATER</option>
            <option value="WHATSAPP">WHATSAPP</option>
            <option value="EMAIL">EMAIL</option>
            <option value="ALTERNATIVE_PAYMENT_METHOD">ALT_METHOD</option>
            <option value="HUMAN_REVIEW">HUMAN_REVIEW</option>
            <option value="NO_ACTION">NO_ACTION</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Outcome:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SIMULATED_SUCCESS">SIMULATED_SUCCESS</option>
            <option value="SIMULATED_FAILURE">SIMULATED_FAILURE</option>
            <option value="SIMULATED_BLOCKED">SIMULATED_BLOCKED</option>
            <option value="SIMULATED_NO_ACTION">SIMULATED_NO_ACTION</option>
            <option value="SIMULATED_HUMAN_REVIEW">SIMULATED_HUMAN_REVIEW</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono ml-auto">
          {logs.length} entries
        </span>
      </div>

      {/* Main Split View: Left List Timeline + Right Detailed Audit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Timeline List */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
            <span>Decision Log</span>
            <span className="text-slate-400 font-mono text-[11px]">Latest First</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-slate-600" />
                Loading ledger entries...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No events recorded. Execute a simulated recovery to record entries.
              </div>
            ) : (
              logs.map((entry) => {
                const isSelected = selectedAudit?.auditId === entry.auditId;
                const isBlocked = entry.executionStatus === 'SIMULATED_BLOCKED';
                const isSuccess = entry.executionStatus === 'SIMULATED_SUCCESS';
                const isNoAction = entry.selectedAction === 'NO_ACTION';

                return (
                  <div
                    key={entry.auditId}
                    onClick={() => setSelectedAudit(entry)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-50 border-l-2 border-slate-900'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-slate-900">
                        {entry.transactionId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isBlocked
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isNoAction
                              ? 'bg-slate-50 text-slate-700 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {entry.selectedAction}
                        </span>
                        <span className="text-xs text-slate-600 truncate max-w-[140px]">
                          {entry.customer.name}
                        </span>
                      </div>

                      <span className="font-mono font-medium text-xs text-slate-900">
                        ₹{entry.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {entry.simulatedOutcome}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Inspection Panel */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-5 space-y-5">
          {selectedAudit ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Audit Entry: {selectedAudit.auditId}
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(selectedAudit.timestamp).toISOString()}
                  </span>
                </div>

                <button
                  onClick={() => onSelectTx(selectedAudit.transactionId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-200 transition-colors"
                >
                  Open in Simulator
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-[11px]">Payment Amount</span>
                  <p className="font-mono font-bold text-xs text-slate-900 mt-0.5">
                    ₹{selectedAudit.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-[11px]">Failure Code</span>
                  <p className="font-mono font-medium text-xs text-slate-800 mt-0.5">
                    {selectedAudit.failureCode}
                    {selectedAudit.failureResponsibility && (
                      <span className="text-[10px] text-slate-500 block">
                        {selectedAudit.failureResponsibility} ({selectedAudit.responsibleParty || 'N/A'})
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-[11px]">Opportunity Score</span>
                  <p className="font-mono font-medium text-xs text-slate-900 mt-0.5">
                    {selectedAudit.recoveryOpportunityScore !== undefined
                      ? `${selectedAudit.recoveryOpportunityScore}/100`
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-[11px]">Recovered Amount</span>
                  <p className="font-mono font-bold text-xs text-emerald-700 mt-0.5">
                    ₹{selectedAudit.recoveredAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Fatigue Status if present */}
              {selectedAudit.fatigueStatus && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex items-center justify-between">
                  <span className="text-slate-700">
                    Customer Interventions (24h): <strong className="text-slate-900">{selectedAudit.fatigueStatus.interventions24h} / 2</strong>
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border bg-white border-slate-200 text-slate-700">
                    {selectedAudit.fatigueStatus.isFatigued ? 'Cooldown Enforced' : 'Within Limit'}
                  </span>
                </div>
              )}

              {/* Execution Outcome */}
              <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">Simulated Outcome</span>
                  <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded text-slate-800 font-medium">
                    {selectedAudit.executionStatus}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed">
                  {selectedAudit.simulatedOutcome}
                </p>
                {selectedAudit.exceptionReason && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                    <strong>Exception:</strong> {selectedAudit.exceptionReason}
                  </p>
                )}
              </div>

              {/* Guardrails Checked at Execution */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700">
                  Guardrail Verification ({selectedAudit.guardrails.length} Checks)
                </h3>
                <div className="space-y-1">
                  {selectedAudit.guardrails.map((g) => (
                    <div
                      key={g.ruleId}
                      className="p-2 rounded border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{g.ruleId}</span>
                          <span className="font-medium text-slate-900">{g.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{g.reason}</p>
                      </div>
                      <GuardrailBadge status={g.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Candidate Strategies Evaluated */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700">
                  Candidate Strategies Compared
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedAudit.candidateStrategies.map((s) => (
                    <div
                      key={s.action}
                      className={`p-2.5 rounded border ${
                        s.action === selectedAudit.selectedAction
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-slate-800">{s.action}</span>
                        <span className="font-mono text-slate-700 text-xs">
                          {Math.round(s.probability * 100)}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                        <span>Expected: ₹{s.expectedRecovery.toLocaleString('en-IN')}</span>
                        <span>{s.eligible ? 'Eligible' : 'Excluded'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an audit event from the list to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
