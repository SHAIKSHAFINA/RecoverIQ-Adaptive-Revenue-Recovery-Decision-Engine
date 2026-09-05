import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AuditLedgerPage } from './pages/AuditLedgerPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { VerificationPage } from './pages/VerificationPage';
import { fetchHealth, fetchPolicies } from './services/api';
import { MerchantPolicies } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeTxId, setActiveTxId] = useState('TXN-DEMO-001');
  const [searchQuery, setSearchQuery] = useState('');
  const [policies, setPolicies] = useState<MerchantPolicies | null>(null);
  const [geminiActive, setGeminiActive] = useState(true);

  const loadInitialData = async () => {
    try {
      const [health, pol] = await Promise.all([fetchHealth(), fetchPolicies()]);
      setGeminiActive(health.geminiConfigured);
      setPolicies(pol);
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectDemoTx = (txId: string) => {
    setActiveTxId(txId);
    setCurrentTab('simulator');
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    if (query.toUpperCase().startsWith('TXN-')) {
      setActiveTxId(query.trim().toUpperCase());
      setCurrentTab('simulator');
    } else {
      setCurrentTab('transactions');
    }
  };

  return (
    <div id="recoverai-root" className="flex h-screen w-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSelectDemoTx={handleSelectDemoTx}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onSearchSubmit={handleSearchSubmit}
          onRefreshData={loadInitialData}
          budgetSpent={policies?.budgetSpent}
          budgetTotal={policies?.interventionBudget}
          geminiActive={geminiActive}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onSelectTx={(txId) => {
                setActiveTxId(txId);
                setCurrentTab('simulator');
              }}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onSelectTx={(txId) => {
                setActiveTxId(txId);
                setCurrentTab('simulator');
              }}
              initialSearch={searchQuery}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorPage
              transactionId={activeTxId}
              onNavigateToLedger={() => setCurrentTab('ledger')}
              onTxUpdated={loadInitialData}
            />
          )}

          {currentTab === 'ledger' && (
            <AuditLedgerPage
              onSelectTx={(txId) => {
                setActiveTxId(txId);
                setCurrentTab('simulator');
              }}
            />
          )}

          {currentTab === 'evaluation' && <EvaluationPage />}

          {currentTab === 'policies' && <PoliciesPage />}

          {currentTab === 'verification' && (
            <VerificationPage
              onSelectTx={(txId) => {
                setActiveTxId(txId);
                setCurrentTab('simulator');
              }}
              onNavigateToTab={setCurrentTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
