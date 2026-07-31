export function calculateTractorLoanFields({
  tractorCost = 0,
  trailerCost = 0,
  implementCost = 0,
  quotationAmount = 0,
  downPayment = 0,
} = {}) {
  const parsedTractorCost = Number(tractorCost) || 0;
  const parsedTrailerCost = Number(trailerCost) || 0;
  const parsedImplementCost = Number(implementCost) || 0;
  const parsedQuotationAmount = Number(quotationAmount) || 0;
  const parsedDownPayment = Number(downPayment) || 0;

  const totalProjectCost = parsedTractorCost + parsedTrailerCost + parsedImplementCost;
  const baseAmount = totalProjectCost || parsedQuotationAmount;
  const bankLoanAmount = Math.max(0, baseAmount - parsedDownPayment);
  const marginMoney = Math.max(0, baseAmount - bankLoanAmount);

  return {
    totalProjectCost: totalProjectCost || parsedQuotationAmount || 0,
    marginMoney,
    bankLoanAmount,
    requestedLoanAmount: bankLoanAmount,
  };
}
