import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Cpu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { fetchTransactions } from '../services/api';
import { RiskIndicator } from '../components/RiskIndicator';
import { TransactionRecord } from '../types';

interface Props {
  onSelectTx: (txId: string) => void;
  initialSearch?: string;
}

export const TransactionsPage: React.FC<Props> = ({ onSelectTx, initialSearch = '' }) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [failureType, setFailureType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [demoCaseOnly, setDemoCaseOnly] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 25;

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTransactions({
        search: search || undefined,
        paymentMethod: paymentMethod !== 'ALL' ? paymentMethod : undefined,
        failureType: failureType !== 'ALL' ? failureType : undefined,
        status: status !== 'ALL' ? status : undefined,
        demoCaseOnly: demoCaseOnly || undefined,
        limit,
        offset: page * limit,
      });
      setTransactions(res.transactions);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, paymentMethod, failureType, status, demoCaseOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  return (
    <div id="transactions-page" className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Failed Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational ledger of {total.toLocaleString()} failed checkouts across UPI, Cards, and AutoPay.
          </p>
        </div>

        <button
          onClick={() => {
            setDemoCaseOnly(!demoCaseOnly);
            setPage(0);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            demoCaseOnly
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {demoCaseOnly ? 'Showing Test Scenarios' : 'Filter Test Scenarios'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="txn-search-filter"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, customer name, VPA, email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white font-mono"
            />
          </form>

          {/* Payment Method */}
          <div>
            <select
              id="filter-payment-method"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Instruments</option>
              <option value="UPI">UPI (Unified Payments)</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="AutoPay">UPI AutoPay / e-Mandate</option>
              <option value="NetBanking">NetBanking</option>
            </select>
          </div>

          {/* Failure Category */}
          <div>
            <select
              id="filter-failure-category"
              value={failureType}
              onChange={(e) => {
                setFailureType(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Failure Types</option>
              <option value="transient">Technical / Timeout</option>
              <option value="customer_action_required">Customer Action Required</option>
              <option value="payment_method_problem">Payment Method Issue</option>
              <option value="permanent">Terminal / Revoked</option>
              <option value="potentially_risky">High Risk / Blocked</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="FAILED">FAILED (Open)</option>
              <option value="RECOVERED">RECOVERED</option>
              <option value="HALTED">HALTED (Policy)</option>
              <option value="CLOSED_NO_ACTION">CLOSED_NO_ACTION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <th className="py-2.5 px-4">Transaction ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-4">Failure Code</th>
                <th className="py-2.5 px-4">Attempts</th>
                <th className="py-2.5 px-4">Fraud Risk</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No failed payments matched the filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isDemo = Boolean(tx.demoTag);
                  return (
                    <tr
                      key={tx.transactionId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDemo ? 'bg-slate-50/40' : ''
                      }`}
                    >
                      {/* ID + Demo Tag */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-slate-900">
                            {tx.transactionId}
                          </span>
                          {isDemo && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">
                              TEST
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(tx.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-800">{tx.customerName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>CLV: ₹{tx.customerLifetimeValue.toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span>{tx.previousSuccesses} succ / {tx.previousFailures} fail</span>
                          {tx.customerOptOut && (
                            <span className="text-rose-700 font-medium bg-rose-50 border border-rose-200 px-1 rounded">DND</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-medium text-slate-900">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Instrument */}
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] bg-slate-100 text-slate-700">
                          {tx.paymentMethod}
                        </span>
                      </td>

                      {/* Failure Code */}
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[11px] text-slate-800">
                          {tx.failureCode}
                        </span>
                      </td>

                      {/* Attempt Count */}
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-mono text-xs ${
                            tx.attemptCount >= 3 ? 'text-rose-700 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {tx.attemptCount} / 3
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="py-2.5 px-4">
                        <RiskIndicator score={tx.fraudScore} />
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                            tx.status === 'RECOVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : tx.status === 'HALTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : tx.status === 'CLOSED_NO_ACTION'
                              ? 'bg-slate-50 text-slate-700 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          id={`btn-simulate-${tx.transactionId}`}
                          onClick={() => onSelectTx(tx.transactionId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                        >
                          Simulate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {total > 0 ? page * limit + 1 : 0} to{' '}
            {Math.min((page + 1) * limit, total)} of {total.toLocaleString()} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px]">
              Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
