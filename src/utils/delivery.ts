/**
 * Estimates delivery time in days based on the state in Brazil.
 * This is a simplified estimation for the e-commerce store.
 */
export const estimateDeliveryDays = (state: string): number => {
  const normalizedState = state.toUpperCase().trim();
  
  // States near the store (assuming store is in SP or RJ)
  const fastStates = ['SP', 'RJ', 'MG', 'ES'];
  // States in the South and Midwest
  const mediumStates = ['PR', 'SC', 'RS', 'DF', 'GO', 'MS', 'MT'];
  // States in the Northeast
  const slowStates = ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'];
  // States in the North
  const verySlowStates = ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'];

  if (fastStates.includes(normalizedState)) return 3;
  if (mediumStates.includes(normalizedState)) return 7;
  if (slowStates.includes(normalizedState)) return 12;
  if (verySlowStates.includes(normalizedState)) return 18;

  return 10; // Default
};

export const getEstimatedDeliveryDate = (state: string): Date => {
  const days = estimateDeliveryDays(state);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
