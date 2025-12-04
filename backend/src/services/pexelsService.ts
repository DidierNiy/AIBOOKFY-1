import axios from 'axios';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

/**
 * Search for hotel images using Pexels API
 * @param hotelName - Name of the hotel
 * @param location - Location of the hotel (optional, for better results)
 * @returns Array of image URLs
 */
export async function searchHotelImages(
  hotelName: string,
  location?: string
): Promise<string[]> {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
    console.warn('Pexels API key not configured, skipping image search');
    return [];
  }

  try {
    // Create search query - use hotel name or fallback to generic hotel image
    // Remove common hotel brand suffixes for better search results
    const cleanedName = hotelName
      .replace(/\b(hotel|resort|inn|suites|lodge|villa|boutique)\b/gi, '')
      .trim();

    // Search for: "luxury hotel" or "hotel room" for generic results
    // Or use the hotel name if it's distinctive (like a landmark)
    const isGenericName = cleanedName.length < 3 || /^\d+$/.test(cleanedName);
    const searchQuery = isGenericName
      ? 'luxury hotel room'
      : `${cleanedName} hotel ${location || ''}`.trim();

    console.log(`🖼️  Searching Pexels for: "${searchQuery}"`);

    const response = await axios.get<PexelsSearchResponse>(
      'https://api.pexels.com/v1/search',
      {
        params: {
          query: searchQuery,
          per_page: 3, // Get 3 images per hotel
          orientation: 'landscape',
        },
        headers: {
          Authorization: PEXELS_API_KEY,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.data.photos && response.data.photos.length > 0) {
      // Return medium-sized images (good balance of quality and size)
      const imageUrls = response.data.photos.map(photo => photo.src.large);
      console.log(`✅ Found ${imageUrls.length} images for ${hotelName}`);
      return imageUrls;
    }

    console.log(`⚠️  No images found for ${hotelName}, trying generic search`);

    // Fallback: search for generic hotel images
    const fallbackResponse = await axios.get<PexelsSearchResponse>(
      'https://api.pexels.com/v1/search',
      {
        params: {
          query: 'hotel room interior',
          per_page: 3,
          orientation: 'landscape',
        },
        headers: {
          Authorization: PEXELS_API_KEY,
        },
        timeout: 5000,
      }
    );

    if (fallbackResponse.data.photos && fallbackResponse.data.photos.length > 0) {
      const imageUrls = fallbackResponse.data.photos.map(photo => photo.src.large);
      console.log(`✅ Using ${imageUrls.length} generic hotel images`);
      return imageUrls;
    }

    return [];
  } catch (error: any) {
    if (error.response) {
      console.error('Pexels API error:', error.response?.status, error.response?.data);
    } else {
      console.error('Error fetching images from Pexels:', error);
    }
    return [];
  }
}

/**
 * Get a curated collection of hotel images
 * Useful for getting high-quality generic hotel images
 */
export async function getCuratedHotelImages(count: number = 3): Promise<string[]> {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
    return [];
  }

  try {
    const response = await axios.get<PexelsSearchResponse>(
      'https://api.pexels.com/v1/curated',
      {
        params: {
          per_page: count,
        },
        headers: {
          Authorization: PEXELS_API_KEY,
        },
        timeout: 5000,
      }
    );

    if (response.data.photos && response.data.photos.length > 0) {
      return response.data.photos.map(photo => photo.src.large);
    }

    return [];
  } catch (error: any) {
    console.error('Error fetching curated images from Pexels:', error);
    return [];
  }
}
