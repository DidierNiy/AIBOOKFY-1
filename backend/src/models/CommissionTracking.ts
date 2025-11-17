import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionTracking extends Document {
  bookingId: string;
  hotelId: string;
  hotelName: string;
  source: 'booking.com' | 'expedia' | 'agoda' | 'hotels.com' | 'internal';
  isExternal: boolean;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
  };
  bookingValue: number;
  currency: string;
  commissionRate: number;
  commissionEarned: number;
  bookingDate: Date;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  externalBookingReference?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionTrackingSchema = new Schema<ICommissionTracking>(
  {
    bookingId: { type: String, required: true, unique: true },
    hotelId: { type: String, required: true },
    hotelName: { type: String, required: true },
    source: { 
      type: String, 
      required: true,
      enum: ['booking.com', 'expedia', 'agoda', 'hotels.com', 'internal']
    },
    isExternal: { type: Boolean, required: true },
    guestDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    bookingValue: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    commissionRate: { type: Number, required: true }, // e.g., 0.12 for 12%
    commissionEarned: { type: Number, required: true },
    bookingDate: { type: Date, default: Date.now },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    externalBookingReference: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    notes: { type: String }
  },
  { timestamps: true }
);

// Indexes for performance
commissionTrackingSchema.index({ hotelId: 1, createdAt: -1 });
commissionTrackingSchema.index({ source: 1, status: 1 });
commissionTrackingSchema.index({ paymentStatus: 1, createdAt: -1 });

export default mongoose.model<ICommissionTracking>('CommissionTracking', commissionTrackingSchema);

// Commission Service
class CommissionService {
  // Track a new booking commission
  async trackBooking(bookingData: {
    bookingId: string;
    hotelId: string;
    hotelName: string;
    source: string;
    isExternal: boolean;
    guestDetails: any;
    bookingValue: number;
    commissionRate: number;
    checkInDate: string;
    checkOutDate: string;
    externalBookingReference?: string;
  }) {
    try {
      const commissionEarned = bookingData.bookingValue * bookingData.commissionRate;
      
      const commissionRecord = new (mongoose.model('CommissionTracking'))({
        ...bookingData,
        commissionEarned,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
        status: 'pending'
      });

      await commissionRecord.save();
      
      console.log(`💰 Commission tracked: $${commissionEarned.toFixed(2)} from ${bookingData.source}`);
      return commissionRecord;
    } catch (error) {
      console.error('Error tracking commission:', error);
      throw error;
    }
  }

  // Get commission analytics
  async getCommissionAnalytics(timeRange: 'week' | 'month' | 'year' = 'month') {
    try {
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const analytics = await mongoose.model('CommissionTracking').aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$source',
            totalCommission: { $sum: '$commissionEarned' },
            totalBookings: { $sum: 1 },
            avgCommissionPerBooking: { $avg: '$commissionEarned' },
            totalBookingValue: { $sum: '$bookingValue' }
          }
        },
        {
          $sort: { totalCommission: -1 }
        }
      ]);

      const summary = await mongoose.model('CommissionTracking').aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalCommissionEarned: { $sum: '$commissionEarned' },
            totalBookings: { $sum: 1 },
            totalBookingValue: { $sum: '$bookingValue' },
            externalBookings: {
              $sum: { $cond: [{ $eq: ['$isExternal', true] }, 1, 0] }
            },
            internalBookings: {
              $sum: { $cond: [{ $eq: ['$isExternal', false] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        bySource: analytics,
        summary: summary[0] || {
          totalCommissionEarned: 0,
          totalBookings: 0,
          totalBookingValue: 0,
          externalBookings: 0,
          internalBookings: 0
        }
      };
    } catch (error) {
      console.error('Error getting commission analytics:', error);
      throw error;
    }
  }

  // Update booking status (when guest checks in/out)
  async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') {
    try {
      const updated = await mongoose.model('CommissionTracking').findOneAndUpdate(
        { bookingId },
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (status === 'completed') {
        console.log(`✅ Booking ${bookingId} completed - commission earned!`);
      }

      return updated;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Get top performing sources
  async getTopPerformingSources(limit: number = 5) {
    try {
      return await mongoose.model('CommissionTracking').aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$source',
            totalRevenue: { $sum: '$commissionEarned' },
            bookingCount: { $sum: 1 },
            avgCommission: { $avg: '$commissionEarned' }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $limit: limit
        }
      ]);
    } catch (error) {
      console.error('Error getting top sources:', error);
      throw error;
    }
  }
}

export const commissionService = new CommissionService();