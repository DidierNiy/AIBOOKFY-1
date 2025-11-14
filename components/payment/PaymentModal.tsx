import React, { useState, useEffect } from 'react';
import { paymentSettingsService } from '../../services/paymentSettingsService';
import { PaymentSettings } from '../../types';

interface GuestDetails {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    arrivalTime: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentFinalized: (guestDetails: GuestDetails) => void;
}

type PaymentMethod = 'card' | 'bank' | 'paypal';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, onPaymentFinalized }) => {
  const [activeTab, setActiveTab] = useState<PaymentMethod>('card');
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for guest details
  const [guestName, setGuestName] = useState('Alex'); // Pre-fill from auth
  const [guestEmail, setGuestEmail] = useState('alex@example.com');
  const [guestPhone, setGuestPhone] = useState('');
  const [arrivalTime, setArrivalTime] = useState('15:00');

  useEffect(() => {
    if (isOpen) {
      const fetchedSettings = paymentSettingsService.getPaymentSettings();
      setSettings(fetchedSettings);
    }
  }, [isOpen]);

  const handlePayment = () => {
    if(!guestName || !guestEmail || !guestPhone) {
        alert("Please fill in all guest details.");
        return;
    }
      
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      onPaymentFinalized({guestName, guestEmail, guestPhone, arrivalTime});
      setIsProcessing(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Complete Your Booking</h2>
          <p className="text-gray-500 dark:text-gray-400">Total Amount: <span className="text-primary font-semibold">${amount.toFixed(2)}</span></p>
        </div>
        
        {/* Guest Details Form */}
        <div className="p-6 space-y-4 border-b dark:border-gray-700">
            <h3 className="font-semibold">Guest Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-medium">Full Name</label>
                    <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                </div>
                 <div>
                    <label className="text-xs font-medium">Email</label>
                    <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                </div>
                 <div>
                    <label className="text-xs font-medium">Phone Number</label>
                    <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                </div>
                 <div>
                    <label className="text-xs font-medium">Est. Arrival Time</label>
                    <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
                </div>
            </div>
        </div>

        <div className="flex border-b dark:border-gray-700">
          <TabButton id="card" activeTab={activeTab} onClick={setActiveTab}>Card</TabButton>
          <TabButton id="bank" activeTab={activeTab} onClick={setActiveTab}>Bank</TabButton>
          <TabButton id="paypal" activeTab={activeTab} onClick={setActiveTab}>PayPal</TabButton>
        </div>

        <div className="p-6">
          {activeTab === 'card' && <CardPaymentForm />}
          {activeTab === 'bank' && <BankPaymentDetails settings={settings} />}
          {activeTab === 'paypal' && <PayPalPaymentDetails settings={settings} />}
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-dark-surface/50 rounded-b-lg">
           <button 
             onClick={handlePayment} 
             disabled={isProcessing}
             className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-wait"
           >
             {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
           </button>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{id: PaymentMethod, activeTab: PaymentMethod, onClick: (id: PaymentMethod) => void, children: React.ReactNode}> = ({id, activeTab, onClick, children}) => (
    <button 
        onClick={() => onClick(id)}
        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
        {children}
    </button>
);

const CardPaymentForm = () => (
    <div className="space-y-4">
        <div>
            <label className="text-xs font-medium">Card Number</label>
            <input type="text" placeholder="•••• •••• •••• ••••" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
        </div>
        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-medium">Expiry Date</label>
                <input type="text" placeholder="MM / YY" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
            </div>
             <div>
                <label className="text-xs font-medium">CVC</label>
                <input type="text" placeholder="•••" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
            </div>
        </div>
    </div>
);

const BankPaymentDetails: React.FC<{settings: PaymentSettings | null}> = ({settings}) => (
    <div>
        <h4 className="font-semibold mb-2">Bank Transfer Details</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please transfer the total amount to the account below and use your booking ID as the reference.</p>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Bank:</strong> {settings?.bankAccount.bankName || 'N/A'}</p>
            <p><strong>Account Holder:</strong> {settings?.bankAccount.accountHolder || 'N/A'}</p>
            <p><strong>Account Number:</strong> {settings?.bankAccount.accountNumber || 'N/A'}</p>
        </div>
    </div>
);

const PayPalPaymentDetails: React.FC<{settings: PaymentSettings | null}> = ({settings}) => (
     <div>
        <h4 className="font-semibold mb-2">PayPal Transfer</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Send the total amount to the following PayPal email address.</p>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm">
            <p><strong>PayPal Email:</strong> {settings?.paypalEmail || 'N/A'}</p>
        </div>
    </div>
);


export default PaymentModal;