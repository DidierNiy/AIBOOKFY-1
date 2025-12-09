const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  newMessages: number;
}

export interface DashboardTrends {
  bookingsChange: number;
  revenueChange: number;
  occupancyChange: number;
}

export interface WeeklyPerformance {
  day: string;
  bookings: number;
  revenue: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  trends: DashboardTrends;
  weeklyPerformance: WeeklyPerformance[];
}

export interface CommissionBySource {
  _id: string;
  totalCommission: number;
  totalBookings: number;
  avgCommissionPerBooking: number;
  totalBookingValue: number;
}

export interface CommissionSummary {
  totalCommissionEarned: number;
  totalBookings: number;
  totalBookingValue: number;
  externalBookings: number;
  internalBookings: number;
}

export interface CommissionAnalytics {
  bySource: CommissionBySource[];
  summary: CommissionSummary;
}

export interface TopSource {
  _id: string;
  totalRevenue: number;
  bookingCount: number;
  avgCommission: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export const dashboardService = {
  // Get dashboard overview
  async getOverview(hotelId?: string): Promise<DashboardOverview> {
    const url = hotelId
      ? `${API_BASE_URL}/api/dashboard/overview?hotelId=${hotelId}`
      : `${API_BASE_URL}/api/dashboard/overview`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard overview');
    }
    return response.json();
  },

  // Get commission analytics
  async getCommissionAnalytics(timeRange: 'week' | 'month' | 'year' = 'month'): Promise<CommissionAnalytics> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/commissions?timeRange=${timeRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch commission analytics');
    }
    return response.json();
  },

  // Get top performing sources
  async getTopSources(limit: number = 5): Promise<TopSource[]> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/top-sources?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch top sources');
    }
    return response.json();
  },

  // Get listings
  async getListings(hotelId?: string) {
    const url = hotelId
      ? `${API_BASE_URL}/api/dashboard/listings?hotelId=${hotelId}`
      : `${API_BASE_URL}/api/dashboard/listings`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    return response.json();
  },

  // Get bookings
  async getBookings(hotelId?: string, status?: string) {
    let url = `${API_BASE_URL}/api/dashboard/bookings`;
    const params = new URLSearchParams();
    if (hotelId) params.append('hotelId', hotelId);
    if (status) params.append('status', status);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    return response.json();
  },

  // Get revenue analytics
  async getRevenueData(timeRange: 'week' | 'month' | 'year' = 'month', hotelId?: string): Promise<RevenueData[]> {
    let url = `${API_BASE_URL}/api/dashboard/revenue?timeRange=${timeRange}`;
    if (hotelId) {
      url += `&hotelId=${hotelId}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch revenue data');
    }
    return response.json();
  },
};
