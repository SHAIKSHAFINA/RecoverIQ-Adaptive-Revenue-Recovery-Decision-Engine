import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Cpu,
  History,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSelectDemoTx: (txId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onSelectDemoTx,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Failed Payments', icon: Receipt },
    { id: 'simulator', label: 'Recovery Simulator', icon: Cpu },
    { id: 'ledger', label: 'Decision Ledger', icon: History },
    { id: 'evaluation', label: 'Evaluation & Lift', icon: TrendingUp },
    { id: 'policies', label: 'Recovery Policies', icon: Sliders },
    { id: 'verification', label: 'System Verification', icon: CheckCircle2, badge: '9/9' },
  ];

  const demoPresets = [
    { id: 'TXN-DEMO-001', label: '1. Technical Decline (UPI Timeout)', type: 'RETRY' },
    { id: 'TXN-DEMO-002', label: '2. Attempt Ceiling (3+ Failed)', type: 'STOP' },
    { id: 'TXN-DEMO-003', label: '3. Fraud Risk Trigger (Score 0.88)', type: 'BLOCK' },
    { id: 'TXN-DEMO-004', label: '4. Opt-Out / DND Customer', type: 'DND' },
    { id: 'TXN-DEMO-005', label: '5. High-Value Payment (₹48,500)', type: 'REVIEW' },
    { id: 'TXN-DEMO-006', label: '6. User Voluntary Cancel', type: 'NO_ACTION' },
    { id: 'TXN-DEMO-007', label: '7. Card Expired / Lifecycle', type: 'ALT_METHOD' },
    { id: 'TXN-DEMO-008', label: '8. Low Balance / Insufficient', type: 'WHATSAPP' },
    { id: 'TXN-DEMO-009', label: '9. 24h Customer Fatigue Cap', type: 'FATIGUE' },
  ];

  return (
    <aside
      id="sidebar-container"
      className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 select-none"
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">RecoverAI</span>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded font-medium">
                  ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Revenue Recovery Ops</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-3 py-3 space-y-0.5">
          <p className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Demo Presets */}
        <div className="px-3 pt-3 border-t border-slate-800/80 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Test Scenarios
            </span>
            <ShieldCheck className="w-3 h-3 text-slate-400" />
          </div>
          <div className="space-y-0.5 overflow-y-auto pr-1 flex-1">
            {demoPresets.map((preset) => (
              <button
                key={preset.id}
                id={`btn-demo-preset-${preset.id}`}
                onClick={() => onSelectDemoTx(preset.id)}
                className="w-full text-left px-2 py-1.5 rounded-md text-[11px] flex items-center justify-between group hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={`Inspect scenario ${preset.id}`}
              >
                <span className="truncate pr-1 group-hover:text-slate-200">{preset.label}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200 shrink-0">
                  {preset.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Simulation Mode
          </span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60">
            INR Sandbox
          </span>
        </div>
      </div>
    </aside>
  );
};
