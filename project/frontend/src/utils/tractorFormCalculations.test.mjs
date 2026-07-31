import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTractorLoanSummary } from './tractorFormCalculations.mjs';

test('calculates loan and margin from quotation and project cost', () => {
  const result = calculateTractorLoanSummary({
    quotationAmt: 500000,
    downPayment: 100000,
    tractorCost: 250000,
    trailerCost: 80000,
    implementCost: 20000,
  });

  assert.equal(result.totalProjectCost, 350000);
  assert.equal(result.bankLoanAmount, 400000);
  assert.equal(result.marginMoney, 0);
});

test('uses zero loan when quotation is missing', () => {
  const result = calculateTractorLoanSummary({
    tractorCost: 100000,
    trailerCost: 20000,
    implementCost: 5000,
  });

  assert.equal(result.totalProjectCost, 125000);
  assert.equal(result.bankLoanAmount, 0);
  assert.equal(result.marginMoney, 125000);
});
