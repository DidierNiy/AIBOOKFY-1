import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CommissionAnalytics {
  bySource: Array<{
    _id: string;
    totalCommission: number;
    totalBookings: number;
    avgCommissionPerBooking: number;
    totalBookingValue: number;
  }>;
  summary: {
    totalCommissionEarned: number;
    totalBookings: number;
    totalBookingValue: number;
    externalBookings: number;
    internalBookings: number;
  };
}

const COLORS = ["#4F46E5", "#7C3AED", "#10B981", "#F59E0B", "#EF4444"];

const CommissionDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<CommissionAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissionAnalytics();
  }, [timeRange]);

  const fetchCommissionAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_BACKEND_URL || "http://localhost:5003"
        }/api/commissions/analytics?timeRange=${timeRange}`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching commission analytics:", error);
      // Mock data for development
      setAnalytics({
        bySource: [
          {
            _id: "booking.com",
            totalCommission: 2450,
            totalBookings: 18,
            avgCommissionPerBooking: 136,
            totalBookingValue: 20420,
          },
          {
            _id: "expedia",
            totalCommission: 1820,
            totalBookings: 12,
            avgCommissionPerBooking: 152,
            totalBookingValue: 15170,
          },
          {
            _id: "internal",
            totalCommission: 980,
            totalBookings: 8,
            avgCommissionPerBooking: 123,
            totalBookingValue: 4900,
          },
          {
            _id: "agoda",
            totalCommission: 720,
            totalBookings: 6,
            avgCommissionPerBooking: 120,
            totalBookingValue: 6000,
          },
        ],
        summary: {
          totalCommissionEarned: 5970,
          totalBookings: 44,
          totalBookingValue: 46490,
          externalBookings: 36,
          internalBookings: 8,
        },
      });
    }
    setLoading(false);
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    change?: string;
    icon: string;
  }> = ({ title, value, change, icon }) => (
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
              <span className="mr-1">↗</span>
              {change} from last period
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading commission data...
          </p>
        </div>
      </div>
    );
  }

  const { bySource, summary } = analytics;

  // Prepare pie chart data
  const pieData = bySource.map((item, index) => ({
    name: item._id === "internal" ? "Internal Hotels" : item._id,
    value: item.totalCommission,
    bookings: item.totalBookings,
  }));

  const avgCommissionRate =
    summary.totalBookingValue > 0
      ? (
          (summary.totalCommissionEarned / summary.totalBookingValue) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Commission Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your earnings from global hotel bookings
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-surface"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Commission Earned"
          value={`$${summary.totalCommissionEarned.toLocaleString()}`}
          change="+23%"
          icon="💰"
        />
        <StatCard
          title="Total Bookings"
          value={summary.totalBookings.toString()}
          change="+12%"
          icon="📊"
        />
        <StatCard
          title="Avg Commission Rate"
          value={`${avgCommissionRate}%`}
          change="+1.2%"
          icon="📈"
        />
        <StatCard
          title="External Bookings"
          value={`${summary.externalBookings}/${summary.totalBookings}`}
          icon="🌍"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission by Source */}
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Commission by Source</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`$${value}`, "Commission"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Volume by Source */}
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Booking Volume by Source
          </h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={bySource}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalBookings" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detailed Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Commission Earned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg Per Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Commission Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {bySource.map((source) => {
                const rate =
                  source.totalBookingValue > 0
                    ? (
                        (source.totalCommission / source.totalBookingValue) *
                        100
                      ).toFixed(1)
                    : "0";

                return (
                  <tr
                    key={source._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {source._id === "booking.com"
                            ? "🟦"
                            : source._id === "expedia"
                            ? "🟨"
                            : source._id === "internal"
                            ? "🏠"
                            : source._id === "agoda"
                            ? "🔴"
                            : "🟢"}
                        </span>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {source._id === "internal"
                            ? "Internal Hotels"
                            : source._id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {source.totalBookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${source.totalBookingValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      ${source.totalCommission.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${source.avgCommissionPerBooking.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Business Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>Revenue Mix:</strong>{" "}
            {((summary.externalBookings / summary.totalBookings) * 100).toFixed(
              0
            )}
            % of your bookings come from external sources, generating $
            {(
              summary.totalCommissionEarned *
              (summary.externalBookings / summary.totalBookings)
            ).toFixed(0)}{" "}
            in commission.
          </div>
          <div>
            <strong>Best Performer:</strong> {bySource[0]?._id || "N/A"} is your
            top commission source with $
            {bySource[0]?.totalCommission.toLocaleString() || "0"} earned this{" "}
            {timeRange}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
