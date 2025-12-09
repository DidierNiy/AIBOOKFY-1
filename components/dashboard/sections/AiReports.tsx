import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService, CommissionAnalytics, RevenueData } from '../../../services/dashboardService';

const COLORS = ['#4F46E5', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];

const AiReports: React.FC = () => {
    const [commissionData, setCommissionData] = useState<CommissionAnalytics | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true);
            const [commission, revenue] = await Promise.all([
                dashboardService.getCommissionAnalytics(timeRange),
                dashboardService.getRevenueData(timeRange),
            ]);
            setCommissionData(commission);
            setRevenueData(revenue);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Fallback mock data
            setRevenueData([
                { month: 'Jan', revenue: 4000 },
                { month: 'Feb', revenue: 3000 },
                { month: 'Mar', revenue: 5000 },
                { month: 'Apr', revenue: 4500 },
                { month: 'May', revenue: 6000 },
                { month: 'Jun', revenue: 5500 },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare commission source data for pie chart
    const commissionSourceData = commissionData?.bySource.map(source => ({
        source: source._id,
        value: source.totalCommission,
        bookings: source.totalBookings,
    })) || [
        { source: 'Direct', value: 400, bookings: 20 },
        { source: 'AI Chat', value: 300, bookings: 15 },
        { source: 'Referral', value: 300, bookings: 15 },
    ];

    // Prepare commission bar chart data
    const commissionBarData = commissionData?.bySource.map(source => ({
        name: source._id.replace('.com', ''),
        commission: source.totalCommission,
        bookings: source.totalBookings,
    })) || [];

    const summary = commissionData?.summary;
    const hasData = commissionData && commissionData.bySource.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold">AI Reports & Analytics</h2>
                <div className="flex gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                    <button className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
                        Download PDF Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
                        <p className="text-sm opacity-90">Total Commission Earned</p>
                        <p className="text-3xl font-bold mt-1">${summary.totalCommissionEarned.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
                        <p className="text-sm opacity-90">Total Bookings</p>
                        <p className="text-3xl font-bold mt-1">{summary.totalBookings}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
                        <p className="text-sm opacity-90">Internal Bookings</p>
                        <p className="text-3xl font-bold mt-1">{summary.internalBookings}</p>
                        <p className="text-xs opacity-75 mt-1">
                            {summary.totalBookings > 0 ? ((summary.internalBookings / summary.totalBookings) * 100).toFixed(1) : 0}% of total
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow">
                        <p className="text-sm opacity-90">External Bookings</p>
                        <p className="text-3xl font-bold mt-1">{summary.externalBookings}</p>
                        <p className="text-xs opacity-75 mt-1">
                            {summary.totalBookings > 0 ? ((summary.externalBookings / summary.totalBookings) * 100).toFixed(1) : 0}% of total
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                    <XAxis dataKey="month" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            color: '#fff'
                                        }}
                                        formatter={(value: number) => `$${value.toLocaleString()}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#4F46E5"
                                        strokeWidth={3}
                                        activeDot={{ r: 6 }}
                                        name="Revenue"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Booking Source Distribution */}
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Commission by Source</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={commissionSourceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="source"
                                        label={({ source, percent }) =>
                                            `${source.replace('.com', '')} ${(Number(percent || 0) * 100).toFixed(0)}%`
                                        }
                                    >
                                        {commissionSourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            color: '#fff'
                                        }}
                                        formatter={(value: number) => `$${value.toLocaleString()}`}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Commission Performance by Platform */}
            {hasData && commissionBarData.length > 0 && (
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Platform Performance</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={commissionBarData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis yAxisId="left" orientation="left" stroke="#888" />
                                <YAxis yAxisId="right" orientation="right" stroke="#888" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        color: '#fff'
                                    }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="commission" fill="#4F46E5" name="Commission ($)" />
                                <Bar yAxisId="right" dataKey="bookings" fill="#7C3AED" name="Bookings" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <p className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">AI Summary</p>
                        {hasData ? (
                            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                <p>
                                    You've earned <strong>${summary?.totalCommissionEarned.toLocaleString()}</strong> in commissions from{' '}
                                    <strong>{summary?.totalBookings}</strong> bookings over the selected period.
                                </p>
                                <p>
                                    Internal bookings account for{' '}
                                    <strong>
                                        {summary && summary.totalBookings > 0
                                            ? ((summary.internalBookings / summary.totalBookings) * 100).toFixed(1)
                                            : 0}%
                                    </strong>{' '}
                                    of your total volume. Consider promoting your AI Chat feature to increase direct bookings and reduce OTA dependency.
                                </p>
                                {commissionData.bySource.length > 0 && (
                                    <p>
                                        Your top performing platform is <strong>{commissionData.bySource[0]._id}</strong> with{' '}
                                        <strong>${commissionData.bySource[0].totalCommission.toLocaleString()}</strong> in commissions.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                No commission data available for the selected time range. Once bookings start coming in, you'll see detailed analytics here.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiReports;