
import mongoose, { Schema, Document, Types } from "mongoose";

// 1. Define the interface
export interface IListing extends Document {
  _id: Types.ObjectId; 
  name: string;
  description: string;
  location: string;
  price: number;
  amenities: string[];
  images: string[];
  rating: number;
  ownerId: string; // Track which hotel owner created this listing
  socialMediaLink?: string;
  whatsappNumber?: string;
  isActive: boolean;
}

// 2. Define the schema
const listingSchema = new Schema<IListing>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 4.0 },
    ownerId: { type: String, required: true }, // Link to user who owns this hotel
    socialMediaLink: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 3. Export
export const Listing = mongoose.model<IListing>("Listing", listingSchema);
export default Listing;
