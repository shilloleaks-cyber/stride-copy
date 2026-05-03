/**
 * getCategoryPaymentRule — single source of truth for payment requirements.
 *
 * Returns:
 * {
 *   paymentRequired: boolean,
 *   paymentMode: "free" | "fixed_price" | "user_entered_amount",
 *   amountDue: number | null,       // null when user must enter
 *   userMustEnterAmount: boolean,
 * }
 */
export function getCategoryPaymentRule(category) {
  if (!category || category.payment_enabled !== true) {
    return { paymentRequired: false, paymentMode: 'free', amountDue: 0, userMustEnterAmount: false };
  }

  // Explicit mode set on the category
  if (category.payment_mode === 'user_entered_amount') {
    return { paymentRequired: true, paymentMode: 'user_entered_amount', amountDue: null, userMustEnterAmount: true };
  }

  if (category.payment_mode === 'fixed_price') {
    return { paymentRequired: true, paymentMode: 'fixed_price', amountDue: category.price || 0, userMustEnterAmount: false };
  }

  // Backward-compat: no payment_mode field set
  // payment_enabled=true & price > 0 → fixed_price
  // payment_enabled=true & price == 0 → user_entered_amount
  const price = Number(category.price || 0);
  if (price > 0) {
    return { paymentRequired: true, paymentMode: 'fixed_price', amountDue: price, userMustEnterAmount: false };
  }
  return { paymentRequired: true, paymentMode: 'user_entered_amount', amountDue: null, userMustEnterAmount: true };
}