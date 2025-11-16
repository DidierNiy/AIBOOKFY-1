import { findHotels, getHotelDetails } from './geoapifyService';

const testGeoapifyService = async () => {
  console.log('--- Testing Geoapify Service ---');

  // Test findHotels
  try {
    console.log('Searching for hotels in Nairobi...');
    const hotels = await findHotels('Bujumbura');
    console.log('Found hotels:', JSON.stringify(hotels, null, 2));

    if (hotels && hotels.length > 0) {
      const firstHotelId = hotels[0].id;
      console.log(`\nFetching details for hotel with ID: ${firstHotelId}`);

      // Test getHotelDetails
      try {
        const hotelDetails = await getHotelDetails(firstHotelId);
        console.log('Hotel details:', JSON.stringify(hotelDetails, null, 2));
      } catch (error) {
        console.error('Error fetching hotel details:', error);
      }
    } else {
      console.log('No hotels found in the specified location.');
    }

  } catch (error) {
    console.error('Error finding hotels:', error);
  }

  console.log('--- Geoapify Service Test Finished ---');
};

testGeoapifyService();
