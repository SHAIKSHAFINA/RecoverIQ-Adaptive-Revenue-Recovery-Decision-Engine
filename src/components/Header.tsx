import React, { useState } from 'react';
import {
  Sparkles,
  Database,
  Search,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { seedSyntheticDataset } from '../services/api';

interface HeaderProps {
  onSearchSubmit: (query: string) => void;
  onRefreshData: () => void;
  budgetSpent?: number;
  budgetTotal?: number;
  geminiActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchSubmit,
  onRefreshData,
  budgetSpent = 4280,
  budgetTotal = 25000,
  geminiActive = true,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearchSubmit(searchVal.trim());
    }
  };

  const handleReseed = async () => {
    try {
      setSeeding(true);
      const res = await seedSyntheticDataset(1000);
      setSeedNotice(`Reset: ${res.count} transactions refreshed.`);
      setTimeout(() => setSeedNotice(null), 3500);
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const budgetPct = Math.min(100, Math.round((budgetSpent / (budgetTotal || 1)) * 100));

  return (
    <header
      id="top-header"
      className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10"
    >
      {/* Left: Quick Search Bar */}
      <form onSubmit={handleSearch} className="relative w-80">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="header-search-input"
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search by ID (e.g. TXN-DEMO-001) or customer..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-colors font-mono"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Intervention Budget Meter */}
        <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-50/80 border border-slate-200/80 rounded-md">
          <Wallet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="text-xs flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Monthly Budget:</span>
            <span className="font-mono text-xs font-semibold text-slate-800">
              ₹{budgetSpent.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">/ ₹{budgetTotal.toLocaleString('en-IN')}</span>
            </span>
            <div className="w-16 bg-slate-200 h-1 rounded-full overflow-hidden ml-1">
              <div
                className={`h-full rounded-full ${
                  budgetPct > 85 ? 'bg-rose-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-slate-400">{budgetPct}%</span>
          </div>
        </div>

        {/* Gemini AI Status Badge */}
        <div
          id="gemini-status-indicator"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs"
          title="Google Gemini (gemini-3.8-flash) explanations online"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-[11px]">Gemini 3.8 Flash</span>
        </div>

        {/* Reseed Transactions */}
        <button
          id="btn-reseed-dataset"
          onClick={handleReseed}
          disabled={seeding}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          title="Reset dataset with 1,000 synthetic failed payments"
        >
          <Database className={`w-3.5 h-3.5 text-slate-400 ${seeding ? 'animate-spin' : ''}`} />
          <span className="text-[11px]">{seeding ? 'Refreshing...' : 'Reset 1k Dataset'}</span>
        </button>

        {seedNotice && (
          <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[11px]">{seedNotice}</span>
          </div>
        )}
      </div>
    </header>
  );
};
