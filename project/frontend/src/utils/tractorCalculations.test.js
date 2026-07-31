import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTractorLoanFields } from './tractorCalculations.js';

test('derives loan and margin from project cost and down payment', () => {
  const result = calculateTractorLoanFields({
    tractorCost: 250000,
    trailerCost: 50000,
    implementCost: 20000,
    downPayment: 100000,
  });

  assert.equal(result.totalProjectCost, 320000);
  assert.equal(result.marginMoney, 100000);
  assert.equal(result.bankLoanAmount, 220000);
  assert.equal(result.requestedLoanAmount, 220000);
});

test('falls back to quotation amount when cost fields are empty', () => {
  const result = calculateTractorLoanFields({
    quotationAmount: 180000,
    downPayment: 30000,
  });

  assert.equal(result.totalProjectCost, 180000);
  assert.equal(result.marginMoney, 30000);
  assert.equal(result.bankLoanAmount, 150000);
});
