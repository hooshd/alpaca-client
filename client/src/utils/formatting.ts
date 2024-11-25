export const formatCurrency = (value: string | undefined): string => {
  if (!value) return '$0.00';
  const numValue = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};