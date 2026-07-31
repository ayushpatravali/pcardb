export function calculateTractorLoanSummary(values = {}) {
  const quotationAmt = Number(values.quotationAmt || 0);
  const downPayment = Number(values.downPayment || 0);
  const tractorCost = Number(values.tractorCost || 0);
  const trailerCost = Number(values.trailerCost || 0);
  const implementCost = Number(values.implementCost || 0);

  const totalProjectCost = tractorCost + trailerCost + implementCost;
  const bankLoanAmount = quotationAmt > 0 ? Math.max(0, quotationAmt - downPayment) : 0;
  const marginMoney = totalProjectCost > 0 ? Math.max(0, totalProjectCost - bankLoanAmount) : 0;

  return {
    totalProjectCost,
    bankLoanAmount,
    marginMoney,
  };
}
