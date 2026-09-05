import { diagnoseFailure } from './server/taxonomy.js';
import { evaluateGuardrails } from './server/guardrails.js';
import { getPolicies } from './server/policies.js';
import { simulateRecovery } from './server/simulator.js';
import { initTransactionsData, getAllTransactions, getTransactionById } from './server/dataService.js';

async function runTests() {
  console.log('=== RUNNING RECOVERAI TEST SUITE ===');

  initTransactionsData();
  const policies = getPolicies();

  // Test 1: Taxonomy categorization
  const upiTimeoutDiag = diagnoseFailure('UPI_TIMEOUT');
  if (upiTimeoutDiag.category !== 'transient' || !upiTimeoutDiag.isRetryable) {
    throw new Error('FAIL: UPI_TIMEOUT should be transient & retryable');
  }
  console.log('✓ Test 1 Passed: UPI_TIMEOUT is transient and retryable');

  const cancelDiag = diagnoseFailure('CUSTOMER_CANCELLED');
  if (cancelDiag.category !== 'permanent' || cancelDiag.isRetryable) {
    throw new Error('FAIL: CUSTOMER_CANCELLED should be permanent & not retryable');
  }
  console.log('✓ Test 2 Passed: CUSTOMER_CANCELLED is permanent and non-retryable');

  // Test 2: Guardrails - Fraud
  const txList = getAllTransactions();
  const fraudTx = txList.find((t) => t.fraudScore >= 0.70);
  if (!fraudTx) throw new Error('FAIL: No fraud transaction found');

  const fraudDiag = diagnoseFailure(fraudTx.failureCode);
  const { overallStatus, blockedActions } = evaluateGuardrails(fraudTx, fraudDiag, policies);

  if (overallStatus !== 'BLOCK') {
    throw new Error('FAIL: High fraud transaction should have status BLOCK');
  }
  const blockedActionsSet = new Set(blockedActions.map(b => b.action));
  if (!blockedActionsSet.has('RETRY_NOW')) {
    throw new Error('FAIL: RETRY_NOW must be blocked for high fraud accounts');
  }
  console.log('✓ Test 3 Passed: Fraud guardrail correctly enforces BLOCK and halts RETRY_NOW');

  // Test 3: Simulation on Demo Case 1
  const demoTx = getTransactionById('TXN-DEMO-001');
  if (!demoTx) throw new Error('FAIL: TXN-DEMO-001 not found');
  const simResult = await simulateRecovery(demoTx);
  if (!simResult) throw new Error('FAIL: Simulation failed for TXN-DEMO-001');
  if (simResult.candidateStrategies.length !== 7) {
    throw new Error('FAIL: Expected 7 candidate strategies');
  }
  console.log(`✓ Test 4 Passed: Counterfactual simulation computed 7 strategies. Recommended: ${simResult.recommendedAction}`);

  console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
