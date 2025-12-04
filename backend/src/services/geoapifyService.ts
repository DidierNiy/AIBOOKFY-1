
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
        image?: string;
        image_url?: string;
        photo?: string;
        photo_url?: string;
        images?: string[];
        photos?: string[];
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
                'image'?: string;
                'image_url'?: string;
                'photo'?: string;
                'photo_url'?: string;
                'images'?: string[];
                'photos'?: string[];
                [key: string]: any;
            }
        }
        [key: string]: any; // Allow for other properties
    }
}

interface HotelInfo {
    name: string;
    location: string;
    rating?: number;
    amenities: string[];
    phone?: string;
    website?: string;
    images?: string[];
}

interface GeoapifyPlace {
    properties: {
        place_id: string;
        name: string;
        address_line2: string;
        image?: string;
        image_url?: string;
        photo?: string;
        photo_url?: string;
        images?: string[];
        photos?: string[];
        [key: string]: any; // Allow for other properties
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

        // Log the first feature to inspect available fields
        if (placesResponse.data.features.length > 0) {
            console.log('🔍 Geoapify API Response Sample (first hotel):', JSON.stringify(placesResponse.data.features[0], null, 2));
        }

        return placesResponse.data.features.map((feature: GeoapifyPlace) => {
            const props = feature.properties;
            
            // Extract images from various possible fields
            let images: string[] = [];
            if (props.images && Array.isArray(props.images)) {
                images = props.images;
            } else if (props.photos && Array.isArray(props.photos)) {
                images = props.photos;
            } else if (props.image_url) {
                images = [props.image_url];
            } else if (props.photo_url) {
                images = [props.photo_url];
            } else if (props.image) {
                images = [props.image];
            } else if (props.photo) {
                images = [props.photo];
            }

            console.log(`📸 Images found for ${props.name}:`, images.length > 0 ? images : 'None');

            return {
                id: props.place_id,
                name: props.name,
                location: props.address_line2,
                images: images.length > 0 ? images : []
            };
        });

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
        
        // Log the full response to inspect available fields
        console.log('🔍 Geoapify Place Details Response:', JSON.stringify(placeDetails, null, 2));
        
        const rawData = placeDetails.datasource?.raw || {};

        // Extract images from various possible fields
        let images: string[] = [];
        if (placeDetails.images && Array.isArray(placeDetails.images)) {
            images = placeDetails.images;
        } else if (placeDetails.photos && Array.isArray(placeDetails.photos)) {
            images = placeDetails.photos;
        } else if (placeDetails.image_url) {
            images = [placeDetails.image_url];
        } else if (placeDetails.photo_url) {
            images = [placeDetails.photo_url];
        } else if (placeDetails.image) {
            images = [placeDetails.image];
        } else if (placeDetails.photo) {
            images = [placeDetails.photo];
        } else if (rawData.images && Array.isArray(rawData.images)) {
            images = rawData.images;
        } else if (rawData.photos && Array.isArray(rawData.photos)) {
            images = rawData.photos;
        } else if (rawData.image_url) {
            images = [rawData.image_url];
        } else if (rawData.photo_url) {
            images = [rawData.photo_url];
        } else if (rawData.image) {
            images = [rawData.image];
        } else if (rawData.photo) {
            images = [rawData.photo];
        }

        console.log(`📸 Images found for ${placeDetails.name}:`, images.length > 0 ? images : 'None');

        const hotelInfo: HotelInfo = {
            name: placeDetails.name,
            location: placeDetails.address_line2,
            rating: rawData.stars ? parseInt(rawData.stars, 10) : undefined,
            amenities: [],
            phone: rawData.phone,
            website: rawData.website,
            images: images.length > 0 ? images : []
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
