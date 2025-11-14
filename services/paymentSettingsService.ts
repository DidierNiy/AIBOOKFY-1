import { PaymentSettings } from '../types';

// Simulate a database/shared state for payment settings
let MOCK_PAYMENT_SETTINGS: PaymentSettings = {
  stripeConnected: false,
  bankAccount: {
    accountHolder: 'Bujumbura Resorts Inc.',
    accountNumber: 'XXXX-XXXX-XXXX-1234',
    bankName: 'Bank of Burundi',
  },
  paypalEmail: 'payments@bujumburaresorts.com',
};

export const paymentSettingsService = {
  getPaymentSettings: (): PaymentSettings => {
    // In a real app, this would be an async API call
    return { ...MOCK_PAYMENT_SETTINGS };
  },

  updatePaymentSettings: (newSettings: Partial<PaymentSettings>): PaymentSettings => {
    // In a real app, this would be an async API call
    MOCK_PAYMENT_SETTINGS = { ...MOCK_PAYMENT_SETTINGS, ...newSettings };
    if (newSettings.bankAccount) {
         MOCK_PAYMENT_SETTINGS.bankAccount = { ...MOCK_PAYMENT_SETTINGS.bankAccount, ...newSettings.bankAccount };
    }
    console.log('Updated Payment Settings:', MOCK_PAYMENT_SETTINGS);
    return { ...MOCK_PAYMENT_SETTINGS };
  },
};
