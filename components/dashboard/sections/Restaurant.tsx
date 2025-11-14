
import React, { useState, useEffect, useMemo } from 'react';
import { RestaurantOrder } from '../../../types';

// Mock Data and Helpers
const initialOrders: RestaurantOrder[] = [
    { id: 'R001', tableNumber: 5, items: [{ name: 'Pizza Margherita', quantity: 1 }, { name: 'Coke', quantity: 2 }], status: 'Preparing', totalPrice: 25.50 },
    { id: 'R002', tableNumber: 2, items: [{ name: 'Pasta Carbonara', quantity: 2 }], status: 'Served', totalPrice: 32.00 },
];
const menuItems = [
    { name: 'Pizza Margherita', price: 20.50 }, { name: 'Pasta Carbonara', price: 16.00 },
    { name: 'Steak Frites', price: 28.00 }, { name: 'Caesar Salad', price: 12.50 },
    { name: 'Coke', price: 2.50 }, { name: 'Water', price: 1.50 }
];

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
);

const Restaurant: React.FC = () => {
    const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
    
    // Real-time data simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(prevOrders => {
                const newOrders = [...prevOrders];
                const chance = Math.random();

                if (chance < 0.5 && newOrders.length < 15) { // Add a new order
                    const newItem = menuItems[Math.floor(Math.random() * menuItems.length)];
                    const newOrder: RestaurantOrder = {
                        id: `R00${newOrders.length + 3}`,
                        tableNumber: Math.floor(Math.random() * 10) + 1,
                        items: [{ name: newItem.name, quantity: 1 }],
                        status: 'Preparing',
                        totalPrice: newItem.price
                    };
                    return [newOrder, ...newOrders];
                } else { // Update an existing order
                    const updatableOrders = newOrders.filter(o => o.status !== 'Paid');
                    if (updatableOrders.length > 0) {
                        const orderToUpdate = updatableOrders[Math.floor(Math.random() * updatableOrders.length)];
                        if (orderToUpdate.status === 'Preparing') orderToUpdate.status = 'Served';
                        else if (orderToUpdate.status === 'Served') orderToUpdate.status = 'Paid';
                    }
                    return newOrders;
                }
            });
        }, 4000); // Every 4 seconds

        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const paidOrders = orders.filter(o => o.status === 'Paid');
        const activeOrders = orders.filter(o => o.status === 'Preparing' || o.status === 'Served');
        const revenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const occupiedTables = new Set(activeOrders.map(o => o.tableNumber)).size;
        return { revenue, activeOrders: activeOrders.length, occupiedTables };
    }, [orders]);
    
    const getStatusClass = (status: RestaurantOrder['status']) => {
        switch (status) {
            case 'Preparing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Served': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        }
    };

    return (
        <div className="restaurant-section">
             <style>{`
                @media print {
                    /* Hide elements within this section that shouldn't be printed */
                    .no-print {
                        display: none !important;
                    }
                     /* Reset component layout for printing */
                    .printable-content {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .print-header {
                        display: block !important;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .print-table {
                       font-size: 10pt !important;
                    }
                     /* Ensure dark mode colors are reverted for print */
                    body {
                        background-color: #fff !important;
                        color: #000 !important;
                    }
                    .dark\\:bg-dark-card { background-color: #fff !important; }
                    .dark\\:text-dark-text, .dark\\:text-gray-400 { color: #000 !important; }
                    .dark\\:border-gray-700 { border-color: #ddd !important; }
                }
            `}</style>
            <div className="flex justify-between items-center mb-6 no-print">
                <h2 className="text-2xl font-bold">Restaurant Live View</h2>
                <button 
                    onClick={() => window.print()}
                    className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
                    Print Report
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
                <StatCard title="Today's Revenue" value={`$${stats.revenue.toFixed(2)}`} />
                <StatCard title="Active Orders" value={stats.activeOrders.toString()} />
                <StatCard title="Occupied Tables" value={stats.occupiedTables.toString()} />
            </div>

            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow printable-content">
                 <div className="hidden print-header">
                    <h1 className="text-2xl font-bold">Restaurant Order Report</h1>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                 </div>
                <h3 className="text-lg font-semibold mb-4 no-print">Live Orders</h3>
                <div className="overflow-x-auto print-table">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Order ID</th>
                                <th scope="col" className="px-6 py-3">Table</th>
                                <th scope="col" className="px-6 py-3">Items</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium">{order.id}</td>
                                    <td className="px-6 py-4">{order.tableNumber}</td>
                                    <td className="px-6 py-4">
                                        {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 font-medium rounded-full text-xs ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-right">${order.totalPrice.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Restaurant;
