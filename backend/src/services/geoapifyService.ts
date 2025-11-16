
import axios from 'axios';

const getApiKey = () => {
    const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
    if (!GEOAPIFY_API_KEY || GEOAPIFY_API_KEY === 'YOUR_API_KEY') {
        throw new Error("Geoapify API key is not configured. Please add it to your .env file as GEOAPIFY_API_KEY");
    }
    return GEOAPIFY_API_KEY;
}

interface GeoapifyPlaceDetails {
    properties: {
        name: string;
        address_line2: string;
        categories: string[];
        details: any[]; 
        datasource: {
            raw: {
                'internet_access'?: string;
                'stars'?: string;
                'rooms'?: number;
                'wheelchair'?: string;
                'smoking'?: string;
                'operator'?: string;
                'phone'?: string;
                'website'?: string;
            }
        }
    }
}

interface HotelInfo {
    name: string;
    location: string;
    rating?: number;
    amenities: string[];
    phone?: string;
    website?: string;
}

interface GeoapifyPlace {
    properties: {
        place_id: string;
        name: string;
        address_line2: string;
    }
}

interface GeoapifyGeocodeResponse {
    features: {
        geometry: {
            coordinates: [number, number];
        };
    }[];
}

interface GeoapifyPlacesResponse {
    features: GeoapifyPlace[];
}


export const findHotels = async (location: string): Promise<any[]> => {
    const apiKey = getApiKey();
    try {
        const geocodeResponse = await axios.get<GeoapifyGeocodeResponse>(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${apiKey}`);

        if (!geocodeResponse.data.features.length) {
            return [];
        }

        const [lon, lat] = geocodeResponse.data.features[0].geometry.coordinates;

        const placesResponse = await axios.get<GeoapifyPlacesResponse>(`https://api.geoapify.com/v2/places?categories=accommodation.hotel&filter=circle:${lon},${lat},5000&bias=proximity:${lon},${lat}&apiKey=${apiKey}`);

        return placesResponse.data.features.map((feature: GeoapifyPlace) => ({
            id: feature.properties.place_id,
            name: feature.properties.name,
            location: feature.properties.address_line2
        }));

    } catch (error) {
        console.error('Error finding hotels from Geoapify:', error);
        throw error; // Re-throw the error to be caught by the test
    }
};


export const getHotelDetails = async (placeId: string): Promise<HotelInfo | null> => {
    const apiKey = getApiKey();
    try {
        const response = await axios.get<{ properties: GeoapifyPlaceDetails['properties'] }>(`https://api.geoapify.com/v2/place-details?id=${placeId}&apiKey=${apiKey}`);

        const placeDetails = response.data.properties;

        if (!placeDetails) {
            return null;
        }
        
        const rawData = placeDetails.datasource.raw;

        const hotelInfo: HotelInfo = {
            name: placeDetails.name,
            location: placeDetails.address_line2,
            rating: rawData.stars ? parseInt(rawData.stars, 10) : undefined,
            amenities: [],
            phone: rawData.phone,
            website: rawData.website
        };

        if(rawData.internet_access && rawData.internet_access !== 'no') {
            hotelInfo.amenities.push('internet_access');
        }
        if(rawData.wheelchair && rawData.wheelchair !== 'no') {
            hotelInfo.amenities.push('wheelchair_accessible');
        }
         if(rawData.smoking && rawData.smoking !== 'no') {
            hotelInfo.amenities.push('smoking_area');
        }

        return hotelInfo;

    } catch (error) {
        console.error('Error fetching hotel details from Geoapify:', error);
        throw error; // Re-throw the error to be caught by the test
    }
};
