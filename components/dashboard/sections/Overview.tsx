
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MOCK_BOOKINGS } from '../../../services/bookingService';
import { Booking } from '../../../types';
import { dashboardService, DashboardOverview } from '../../../services/dashboardService';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  isLoading?: boolean;
  icon?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, isLoading, icon }) => {
    const hasChange = change !== undefined && change !== 0;
    const isIncrease = (change ?? 0) > 0;
    const isDecrease = (change ?? 0) < 0;

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                {icon && <span className="text-2xl">{icon}</span>}
            </div>
            {isLoading ? (
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
            ) : (
                <>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    {hasChange && (
                        <div className="mt-2 flex items-center">
                            <span className={`text-sm font-medium flex items-center ${
                                isIncrease ? 'text-green-500' : isDecrease ? 'text-red-500' : 'text-gray-500'
                            }`}>
                                {isIncrease && '↗ '}
                                {isDecrease && '↘ '}
                                {Math.abs(change).toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const Overview: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookings] = useState<Booking[]>([...MOCK_BOOKINGS]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const data = await dashboardService.getOverview();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
            // Fallback to mock data for stats
            const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
            const totalRevenue = confirmedBookings.reduce((acc, b) => acc + b.totalPaid, 0);
            setDashboardData({
                stats: {
                    totalBookings: confirmedBookings.length,
                    totalRevenue,
                    occupancyRate: 72,
                    newMessages: 12,
                },
                trends: {
                    bookingsChange: 5.2,
                    revenueChange: 12.5,
                    occupancyChange: -5,
                },
                weeklyPerformance: [
                    { day: 'Mon', bookings: 4, revenue: 240 },
                    { day: 'Tue', bookings: 3, revenue: 139 },
                    { day: 'Wed', bookings: 2, revenue: 980 },
                    { day: 'Thu', bookings: 2, revenue: 390 },
                    { day: 'Fri', bookings: 1, revenue: 480 },
                    { day: 'Sat', bookings: 3, revenue: 380 },
                    { day: 'Sun', bookings: 4, revenue: 430 },
                ],
            });
        } finally {
            setIsLoading(false);
        }
    };

    const stats = dashboardData?.stats || { totalBookings: 0, totalRevenue: 0, occupancyRate: 0, newMessages: 0 };
    const trends = dashboardData?.trends || { bookingsChange: 0, revenueChange: 0, occupancyChange: 0 };
    const weeklyData = dashboardData?.weeklyPerformance || [];

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ {error}. Showing mock data as fallback.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings.toString()}
                    change={trends.bookingsChange}
                    isLoading={isLoading}
                    icon="📅"
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    change={trends.revenueChange}
                    isLoading={isLoading}
                    icon="💰"
                />
                <StatCard
                    title="Occupancy Rate"
                    value={`${stats.occupancyRate}%`}
                    change={trends.occupancyChange}
                    isLoading={isLoading}
                    icon="🏨"
                />
                <StatCard
                    title="New Messages"
                    value={stats.newMessages.toString()}
                    isLoading={isLoading}
                    icon="💬"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Weekly Bookings</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                    <XAxis dataKey="day" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            color: '#fff'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="bookings" fill="#4F46E5" name="Bookings" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Weekly Revenue</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                    <XAxis dataKey="day" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            color: '#fff'
                                        }}
                                        formatter={(value: number) => `$${value}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#7C3AED"
                                        strokeWidth={2}
                                        dot={{ fill: '#7C3AED', r: 4 }}
                                        name="Revenue ($)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg shadow border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🤖</span>
                    <h3 className="text-lg font-semibold">AI Insights & Recommendations</h3>
                </div>
                <ul className="space-y-3">
                    <li className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-primary pt-1 text-xl">💡</div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Pricing Optimization</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Your average room price is 10% higher than similar listings in your area. Consider a slight adjustment to increase booking probability.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-primary pt-1 text-xl">📊</div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Occupancy Strategy</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Most of your bookings are for weekends. Try offering a mid-week discount to improve occupancy on weekdays.
                            </p>
                        </div>
                    </li>
                    {trends.revenueChange > 10 && (
                        <li className="flex items-start space-x-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="pt-1 text-xl">🎉</div>
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">Great Performance!</p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    Your revenue is up {trends.revenueChange.toFixed(1)}% compared to last period. Keep up the excellent work!
                                </p>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Overview;
