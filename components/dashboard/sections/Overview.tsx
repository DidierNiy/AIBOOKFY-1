
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MOCK_BOOKINGS } from '../../../services/bookingService';
import { Booking } from '../../../types';

const data = [
  { name: 'Mon', Bookings: 4, Revenue: 240 },
  { name: 'Tue', Bookings: 3, Revenue: 139 },
  { name: 'Wed', Bookings: 2, Revenue: 980 },
  { name: 'Thu', Bookings: 2, Revenue: 390 },
  { name: 'Fri', Bookings: 1, Revenue: 480 },
  { name: 'Sat', Bookings: 3, Revenue: 380 },
  { name: 'Sun', Bookings: 4, Revenue: 430 },
];

const StatCard: React.FC<{ title: string; value: string; change?: string; changeType?: 'increase' | 'decrease' }> = ({ title, value, change, changeType }) => {
    const isIncrease = changeType === 'increase';
    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change && changeType && (
                <p className={`text-sm mt-2 flex items-center ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
                    {isIncrease ? '▲' : '▼'} {change} vs last week
                </p>
            )}
        </div>
    );
};

const Overview: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([...MOCK_BOOKINGS]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (JSON.stringify(bookings) !== JSON.stringify(MOCK_BOOKINGS)) {
                setBookings([...MOCK_BOOKINGS]);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [bookings]);

    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
    const totalRevenue = confirmedBookings.reduce((acc, b) => acc + b.totalPaid, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bookings" value={confirmedBookings.length.toString()} />
                <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} />
                <StatCard title="Occupancy Rate" value="72%" change="5%" changeType="decrease" />
                <StatCard title="New Messages" value="12" change="20%" changeType="increase" />
            </div>
            
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                 <h3 className="text-lg font-semibold mb-4">Weekly Performance</h3>
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)"/>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '0.5rem' }} />
                            <Legend />
                            <Bar dataKey="Bookings" fill="#4F46E5" />
                            <Bar dataKey="Revenue" fill="#7C3AED" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                 <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
                 <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                        <div className="text-primary pt-1">💡</div>
                        <p>Your average room price is 10% higher than similar listings in your area. Consider a slight adjustment to increase booking probability.</p>
                    </li>
                    <li className="flex items-start space-x-3">
                       <div className="text-primary pt-1">💡</div>
                       <p>Most of your bookings are for weekends. Try offering a mid-week discount to improve occupancy on weekdays.</p>
                    </li>
                 </ul>
            </div>
        </div>
    );
};

export default Overview;
