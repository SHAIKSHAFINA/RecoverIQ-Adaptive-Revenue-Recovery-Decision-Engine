import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Server,
  Activity,
  Database,
  Sliders,
  FileText,
  Brain,
  Zap,
  Info,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { runVerification, fetchEngineHealth } from '../services/api';
import { VerificationResponse, EngineHealthResponse } from '../types';

interface VerificationPageProps {
  onSelectTx: (txId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  onSelectTx,
  onNavigateToTab,
}) => {
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);
  const [healthData, setHealthData] = useState<EngineHealthResponse | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [errorVerification, setErrorVerification] = useState<string | null>(null);
  const [errorHealth, setErrorHealth] = useState<string | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  // Execute real verification on mount
  useEffect(() => {
    handleRunVerification();
    handleRunHealthCheck();
  }, []);

  const handleRunVerification = async () => {
    setLoadingVerification(true);
    setErrorVerification(null);
    try {
      const data = await runVerification();
      setVerificationData(data);
      setLastRunTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      setErrorVerification(err.message || 'Verification execution failed.');
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setLoadingHealth(true);
    setErrorHealth(null);
    try {
      const data = await fetchEngineHealth();
      setHealthData(data);
    } catch (err: any) {
      setErrorHealth(err.message || 'Live engine check failed.');
    } finally {
      setLoadingHealth(false);
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'backend api':
        return Server;
      case 'gemini availability':
        return Brain;
      case 'transaction dataset':
        return Database;
      case 'policy persistence':
        return Sliders;
      case 'audit log':
        return FileText;
      case 'decision engine':
        return Cpu;
      case 'guardrail engine':
        return ShieldCheck;
      case 'opportunity scoring':
        return Zap;
      case 'verification engine':
        return CheckCircle2;
      default:
        return Activity;
    }
  };

  return (
    <div id="system-verification-page" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              System Verification Suite
            </h1>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
              Live Test Harness
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic validation test suite verifying decision logic, guardrail integrity, responsibility mapping, and opportunity scoring.
          </p>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-run-verification"
            onClick={handleRunVerification}
            disabled={loadingVerification}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingVerification ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Verification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Summary Banner */}
      <div
        id="verification-summary-banner"
        className="p-5 rounded-lg border border-slate-200 bg-white"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                verificationData?.allPassed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : verificationData && !verificationData.allPassed
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {loadingVerification ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
              ) : verificationData?.allPassed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-slate-400">
                  Verification Status
                </span>
                {lastRunTime && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Last run: {lastRunTime}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {loadingVerification ? (
                  <span className="text-slate-500 text-sm font-normal">
                    Evaluating live decision engine against 9 test cases...
                  </span>
                ) : verificationData ? (
                  <span
                    id="overall-status-text"
                    className={verificationData.allPassed ? 'text-slate-900' : 'text-rose-700'}
                  >
                    {verificationData.passedCount} of {verificationData.totalCount} Test Cases Passed
                  </span>
                ) : errorVerification ? (
                  <span className="text-rose-600 text-sm">Error: {errorVerification}</span>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Ready to execute suite</span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block">Engine Mode</span>
              <span className="font-mono text-xs text-slate-700 font-medium">Deterministic</span>
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <span className="text-[10px] text-slate-400 font-mono block">Side Effects</span>
              <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                Idempotent / Read-Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How to Verify Step-by-Step Panel */}
      <div id="how-to-verify-panel" className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-xs text-slate-900">Verification Steps</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Deterministic Engine Evaluation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-mono font-bold text-slate-700 text-[11px]">01. Run Suite</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Execute all 9 test cases against the live API endpoint.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-mono font-bold text-slate-700 text-[11px]">02. UPI Decline</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Open TXN-DEMO-001 (UPI timeout) to verify RETRY_NOW selection.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-mono font-bold text-slate-700 text-[11px]">03. Fraud Stop</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Inspect TXN-DEMO-003 to verify fraud score 0.88 triggers NO_ACTION.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-mono font-bold text-slate-700 text-[11px]">04. Fatigue Cap</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Inspect TXN-DEMO-009 to observe 24h fatigue cooldown blocking spam.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-mono font-bold text-slate-700 text-[11px]">05. Audit Ledger</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Confirm executed test decisions are recorded in the ledger.
            </p>
          </div>
        </div>
      </div>

      {/* LIVE ENGINE HEALTH Section */}
      <div id="live-engine-health-section" className="bg-white rounded-lg border border-slate-200 p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-xs text-slate-900">Engine Subsystem Health</h3>
              {healthData && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    healthData.allPassed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {healthData.totalPassed} / {healthData.totalChecked} Operational ({healthData.totalTimeMs}ms)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live automated probe checking backend endpoints and service status.
            </p>
          </div>
          <button
            id="btn-refresh-health"
            onClick={handleRunHealthCheck}
            disabled={loadingHealth}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${loadingHealth ? 'animate-spin' : ''}`} />
            <span>Re-probe</span>
          </button>
        </div>

        {errorHealth && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
            Health Check Error: {errorHealth}
          </div>
        )}

        {/* Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {healthData?.checks.map((check, idx) => {
            const Icon = getComponentIcon(check.component);
            const isPass = check.status === 'PASS';
            return (
              <div
                key={idx}
                id={`health-check-${check.component.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-3 rounded border border-slate-200 bg-white flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block leading-tight">
                        {check.component}
                      </span>
                      <code className="text-[10px] text-slate-400 font-mono">
                        {check.endpoint}
                      </code>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      isPass
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between text-[11px]">
                  <span className="text-slate-500 truncate pr-2" title={check.details}>
                    {check.details}
                  </span>
                  <span className="font-mono text-slate-400 shrink-0 text-[10px]">{check.latencyMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 9 Deterministic Verification Cases Table */}
      <div id="demo-cases-table-section" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-slate-900">
                Verification Test Cases (9 / 9)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Deterministic verification cases tested against the multi-factor decision engine and guardrails.
            </p>
          </div>

          <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
            GET /api/verification
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <th className="py-2.5 px-3.5">ID / Customer</th>
                <th className="py-2.5 px-3">Scenario &amp; Code</th>
                <th className="py-2.5 px-3">Responsibility</th>
                <th className="py-2.5 px-3">Expected</th>
                <th className="py-2.5 px-3">Actual</th>
                <th className="py-2.5 px-2 text-center">Score</th>
                <th className="py-2.5 px-2 text-center">Fatigue</th>
                <th className="py-2.5 px-2 text-center">Guardrail</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loadingVerification && !verificationData && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-slate-600 mb-2" />
                    <span>Executing verification matrix across 9 demo transactions...</span>
                  </td>
                </tr>
              )}

              {verificationData?.results.map((c) => {
                return (
                  <tr
                    key={c.id}
                    id={`verification-row-${c.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-medium text-slate-900 block">{c.id}</span>
                      <span className="text-[11px] text-slate-500 block">{c.customerName}</span>
                    </td>

                    {/* Scenario */}
                    <td className="py-3 px-3 max-w-xs">
                      <span className="font-medium text-slate-800 block leading-tight">
                        {c.scenario}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                        {c.failureCode} • ₹{c.amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Responsibility & Responsible Party */}
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 inline-block font-medium">
                        {c.failureResponsibility}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {c.responsibleParty}
                      </span>
                    </td>

                    {/* Expected Decision */}
                    <td className="py-3 px-3">
                      <code className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {c.expectedDecision}
                      </code>
                    </td>

                    {/* Actual Decision */}
                    <td className="py-3 px-3">
                      <code
                        className={`text-[11px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                          c.actualDecision === c.expectedDecision
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {c.actualDecision}
                      </code>
                    </td>

                    {/* Opportunity Score */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-mono text-xs text-slate-700">
                        {c.opportunityScore}/100
                      </span>
                    </td>

                    {/* Fatigue */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          c.fatigueStatus === 'FATIGUED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {c.fatigueStatus}
                      </span>
                    </td>

                    {/* Guardrail Status */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          c.guardrailStatus === 'PASS'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.guardrailStatus === 'REVIEW'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {c.guardrailStatus}
                      </span>
                    </td>

                    {/* Result PASS / FAIL */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded border font-medium ${
                          c.passed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {c.passed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>PASS</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>FAIL</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Open in Simulator button */}
                    <td className="py-3 px-3.5 text-right">
                      <button
                        id={`btn-open-simulator-${c.id}`}
                        onClick={() => onSelectTx(c.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
                        title={`Open ${c.id} in Simulator`}
                      >
                        <span>Simulator</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Architecture & API Traceability Footnote */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-slate-600">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-slate-600" />
            <span>Server-Side Evaluation & Privacy</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
            Isolated Environment
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Verification tests evaluate server-side via Express routes using deterministic decision rules. All API credentials and merchant database states remain isolated.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px] text-slate-600">
          <div>
            Verification API: <span className="text-slate-900">GET /api/verification</span>
          </div>
          <div>
            Health Probe: <span className="text-slate-900">GET /api/engine-health</span>
          </div>
          <div>
            Simulation: <span className="text-slate-900">POST /api/simulate/:id</span>
          </div>
        </div>
      </div>
    </div>
  );
};
