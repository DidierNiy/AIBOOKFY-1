import express, { Request, Response } from "express";
import Listing from "../models/Listing";  // Import the Listing model

const router = express.Router();

// -----------------------------
// Create a new listing (POST)
// -----------------------------
router.post("/add", async (req: Request, res: Response) => {
  try {
    const { name, location, price, description, images, amenities, rating, ownerId, socialMediaLink, whatsappNumber } = req.body;
    
    // Validate required fields
    if (!name || !location || !price || !ownerId) {
      return res.status(400).json({ message: "Missing required fields: name, location, price, ownerId" });
    }
    
    const listing = await Listing.create({
      name,
      location,
      price,
      description: description || `Beautiful accommodation in ${location}`,
      images: Array.isArray(images) ? images : (images ? [images] : []),
      amenities: Array.isArray(amenities) ? amenities : (amenities ? [amenities] : []),
      rating: typeof rating === 'number' ? rating : 4.0,
      ownerId,
      socialMediaLink: socialMediaLink || '',
      whatsappNumber: whatsappNumber || '',
      isActive: true,
    });
    
    console.log('✅ New listing created:', listing._id);
    res.status(201).json(listing);
  } catch (error: any) {
    console.error('❌ Error creating listing:', error);
    res.status(400).json({ message: error.message });
  }
});

// -----------------------------
// Get all listings (GET)
// -----------------------------
router.get("/", async (req: Request, res: Response) => {
  try {
    const listings = await Listing.find({ isActive: true });
    res.status(200).json(listings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------
// Get single listing by ID (GET)
// -----------------------------
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    res.status(200).json(listing);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------
// Update a listing (PUT)
// -----------------------------
router.put("/edit/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, price, description, images, amenities, rating, socialMediaLink, whatsappNumber, isActive } = req.body;
    const update: any = {
      ...(name ? { name } : {}),
      ...(location ? { location } : {}),
      ...(typeof price === 'number' ? { price } : {}),
      ...(description ? { description } : {}),
      ...(images ? { images: Array.isArray(images) ? images : [images] } : {}),
      ...(amenities ? { amenities: Array.isArray(amenities) ? amenities : [amenities] } : {}),
      ...(typeof rating === 'number' ? { rating } : {}),
      ...(socialMediaLink !== undefined ? { socialMediaLink } : {}),
      ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };
    const listing = await Listing.findByIdAndUpdate(id, update, { new: true });
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    console.log('✅ Listing updated:', listing._id);
    res.status(200).json(listing);
  } catch (error: any) {
    console.error('❌ Error updating listing:', error);
    res.status(400).json({ message: error.message });
  }
});

// -----------------------------
// Delete a listing (DELETE)
// -----------------------------
router.delete("/delete/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
