import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Jan', Revenue: 4000 }, { month: 'Feb', Revenue: 3000 }, { month: 'Mar', Revenue: 5000 },
  { month: 'Apr', Revenue: 4500 }, { month: 'May', Revenue: 6000 }, { month: 'Jun', Revenue: 5500 },
];

const occupancyData = [
    { source: 'Direct', value: 400 },
    { source: 'AI Chat', value: 300 },
    { source: 'Referral', value: 300 },
];

const COLORS = ['#4F46E5', '#7C3AED', '#10B981'];

const AiReports: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">AI Reports & Analytics</h2>
                <button className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
                    Download PDF Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '0.5rem' }} />
                                <Legend />
                                <Line type="monotone" dataKey="Revenue" stroke="#4F46E5" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Booking Source</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                {/* Fix: Ensured `percent` is a number before performing arithmetic operation to satisfy TypeScript's strict type checking. */}
                                <Pie data={occupancyData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="source" label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}>
                                    {occupancyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '0.5rem' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-md mt-6 text-sm text-blue-800 dark:text-blue-200">
                <strong>AI Summary:</strong> Your revenue trend is positive, with a peak in May. The AI Chat is a significant source of bookings, contributing 30% of the total. Consider promoting the AI Chat feature to drive even more direct bookings.
            </div>
        </div>
    );
};

export default AiReports;