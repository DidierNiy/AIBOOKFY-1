
import React, { useState, useEffect } from 'react';
import { paymentSettingsService } from '../../../services/paymentSettingsService';
import { PaymentSettings } from '../../../types';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<PaymentSettings>(paymentSettingsService.getPaymentSettings());

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            bankAccount: { ...prev.bankAccount, [name]: value }
        }));
    };
    
    const handleSaveChanges = () => {
        paymentSettingsService.updatePaymentSettings(settings);
        alert('Settings saved successfully!');
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Hotel Profile</h2>
                <div className="mt-4 bg-light-card dark:bg-dark-card p-6 rounded-lg shadow space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Hotel Name</label>
                        <input type="text" defaultValue="Bujumbura Beachfront Resort" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">AI Agent Tone</label>
                        <select className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0">
                            <option>Professional & Helpful</option>
                            <option>Friendly & Casual</option>
                            <option>Concise & Direct</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold">Payment Gateways</h2>
                <div className="mt-4 bg-light-card dark:bg-dark-card p-6 rounded-lg shadow space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure how you receive payments from bookings.</p>
                    
                    {/* Stripe */}
                    <div className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg">
                        <span className="font-medium">Stripe (Credit/Debit Cards)</span>
                        <button className={`px-3 py-1 text-sm rounded-md ${settings.stripeConnected ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                            {settings.stripeConnected ? 'Connected' : 'Connect'}
                        </button>
                    </div>

                    {/* Bank Account */}
                    <div>
                        <label className="block text-sm font-medium">Bank Account Details (for Transfers)</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                            <input name="bankName" value={settings.bankAccount.bankName} onChange={handleBankInputChange} type="text" placeholder="Bank Name" className="block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                            <input name="accountHolder" value={settings.bankAccount.accountHolder} onChange={handleBankInputChange} type="text" placeholder="Account Holder" className="block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                            <input name="accountNumber" value={settings.bankAccount.accountNumber} onChange={handleBankInputChange} type="text" placeholder="Account Number" className="block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                        </div>
                    </div>
                    
                    {/* PayPal */}
                     <div>
                        <label className="block text-sm font-medium">PayPal Email</label>
                        <input name="paypalEmail" value={settings.paypalEmail} onChange={handleInputChange} type="email" placeholder="you@example.com" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                    </div>
                </div>
            </div>
            
             <div className="flex justify-end">
                 <button onClick={handleSaveChanges} className="bg-secondary text-white px-6 py-2 rounded-md font-bold hover:bg-opacity-90 transition-colors">
                    Save Changes
                </button>
             </div>
        </div>
    );
};

export default Settings;
