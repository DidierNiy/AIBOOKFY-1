import express from 'express';
import { commissionService } from '../models/CommissionTracking';
import Listing from '../models/Listing';

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    const { hotelId } = req.query;

    // TODO: Replace with actual Booking model when created
    // For now, return sample data structure that matches your frontend
    const bookings: any[] = []; // This will come from Booking model

    const listings = await Listing.find(hotelId ? { ownerId: hotelId } : {});

    // Calculate stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalPaid || 0), 0);

    // Calculate occupancy (this is a placeholder calculation)
    const totalRooms = listings.length;
    const occupiedRooms = confirmedBookings.length;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Get weekly performance data
    const weeklyData = generateWeeklyData(bookings);

    res.json({
      stats: {
        totalBookings,
        totalRevenue,
        occupancyRate: Math.round(occupancyRate),
        newMessages: 0, // TODO: Implement actual message counting
      },
      weeklyPerformance: weeklyData,
      trends: {
        bookingsChange: 0, // TODO: Calculate vs previous period
        revenueChange: 0,
        occupancyChange: 0,
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ message: 'Failed to fetch overview data', error: error.message });
  }
});

// Get commission analytics
router.get('/commissions', async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;

    const analytics = await commissionService.getCommissionAnalytics(
      timeRange as 'week' | 'month' | 'year'
    );

    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching commission analytics:', error);
    res.status(500).json({ message: 'Failed to fetch commission data', error: error.message });
  }
});

// Get top performing sources
router.get('/top-sources', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topSources = await commissionService.getTopPerformingSources(Number(limit));

    res.json(topSources);
  } catch (error: any) {
    console.error('Error fetching top sources:', error);
    res.status(500).json({ message: 'Failed to fetch top sources', error: error.message });
  }
});

// Get all listings with enhanced data
router.get('/listings', async (req, res) => {
  try {
    const { hotelId } = req.query;

    const listings = await Listing.find(hotelId ? { ownerId: hotelId } : {})
      .sort({ createdAt: -1 });

    // Transform to match frontend format
    const transformedListings = listings.map(listing => ({
      id: listing._id.toString(),
      name: listing.name,
      price: listing.price,
      photos: listing.images || [],
      amenities: listing.amenities || [],
      isActive: listing.isActive,
      location: listing.location,
      socialMediaLink: listing.socialMediaLink,
      whatsappNumber: listing.whatsappNumber,
      rating: listing.rating || 0,
    }));

    res.json(transformedListings);
  } catch (error: any) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }
});

// Get bookings with filtering
router.get('/bookings', async (req, res) => {
  try {
    const { hotelId, status } = req.query;

    // TODO: Replace with actual Booking model query when created
    // For now, return empty array with proper structure
    const bookings: any[] = [];

    // Filter logic would go here:
    // const query: any = {};
    // if (hotelId) query.hotelId = hotelId;
    // if (status) query.status = status;
    // const bookings = await Booking.find(query).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Get revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const { timeRange = 'month', hotelId } = req.query;

    // TODO: Implement with actual Booking model
    // Calculate revenue by month, week, or year
    const revenueData = generateMockRevenueData();

    res.json(revenueData);
  } catch (error: any) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data', error: error.message });
  }
});

// Helper function to generate weekly performance data
function generateWeeklyData(bookings: any[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData = days.map(day => ({
    day,
    bookings: 0,
    revenue: 0,
  }));

  // TODO: Implement actual weekly aggregation from bookings
  // For now return the structure that frontend expects

  return weekData;
}

// Helper function for mock revenue data (remove when real data is available)
function generateMockRevenueData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    revenue: 0,
  }));
}

export default router;
