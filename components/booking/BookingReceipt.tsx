import React from 'react';
import { BookingReceiptData } from '../../types';

interface BookingReceiptProps {
  receipt: BookingReceiptData;
}

const BookingReceipt: React.FC<BookingReceiptProps> = ({ receipt }) => {
  return (
    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-md border dark:border-gray-700 max-w-md w-full">
      <div className="bg-primary text-white p-4 rounded-t-lg">
        <h3 className="font-bold text-lg">{receipt.hotelName}</h3>
        <p className="text-sm">{receipt.hotelLocation}</p>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Booking Confirmation</h4>
          <p className="text-lg">Thank you for your payment, {receipt.guestName}!</p>
        </div>
        <div className="border-t dark:border-gray-700 pt-4 space-y-2 text-sm">
           <ReceiptRow label="Full Name" value={receipt.guestName} />
           <ReceiptRow label="Email" value={receipt.guestEmail} />
           <ReceiptRow label="Phone" value={receipt.guestPhone} />
           <ReceiptRow label="Arrival Time" value={receipt.arrivalTime} />
        </div>
         <div className="border-t dark:border-gray-700 pt-4 text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount Paid</p>
            <p className="text-2xl font-bold">${receipt.amountPaid.toFixed(2)}</p>
         </div>
         <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4">
            <p>If you have any questions or need to cancel, please contact us at:</p>
            <p className="font-medium text-primary">{receipt.hotelContact}</p>
         </div>
      </div>
    </div>
  );
};

const ReceiptRow: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
);

export default BookingReceipt;