import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import chatService from './chatService';

export class SocketService {
  private io: Server;

  constructor(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join a hotel-specific room
      socket.on('join_hotel_room', (hotelId: string) => {
        socket.join(`hotel_${hotelId}`);
        console.log(`Client ${socket.id} joined hotel room ${hotelId}`);
      });

      // Handle chat messages
      socket.on('send_message', async (data: {
        message: string;
        hotelId: string;
        userId: string;
        hotelContext?: any;
        isHotelStaff: boolean;
      }) => {
        try {
          // If the message is from a user (not hotel staff), generate AI response
          let aiResponse = null;
          if (!data.isHotelStaff) {
            // Fetch hotel context if not provided
            let hotelContext = data.hotelContext;
            if (!hotelContext && data.hotelId) {
              try {
                const Listing = (await import('../models/Listing')).default;
                const hotel = await Listing.findById(data.hotelId);
                if (hotel) {
                  hotelContext = {
                    id: hotel._id.toString(),
                    name: hotel.name,
                    location: hotel.location,
                    priceRange: `$${hotel.price}/night`,
                    amenities: hotel.amenities,
                    availableRooms: 'Contact us for availability',
                  };
                }
              } catch (err) {
                console.error('Error fetching hotel:', err);
              }
            }
            
            aiResponse = await chatService.generateResponse(data.message, hotelContext, data.userId);
          }

          // Emit the user's message to the hotel room
          this.io.to(`hotel_${data.hotelId}`).emit('receive_message', {
            hotelId: data.hotelId,
            message: data.message,
            userId: data.userId,
            timestamp: new Date(),
            isHotelStaff: data.isHotelStaff
          });

          // If AI response was generated, emit it as well
          if (aiResponse) {
            // aiResponse can be either an object { text, hotels? } or a string
            const payload: any = {
              message: typeof aiResponse === 'string' ? aiResponse : aiResponse.text,
              userId: 'AI_ASSISTANT',
              timestamp: new Date(),
              isAI: true
            };

            if (typeof aiResponse === 'object' && aiResponse.hotels) {
              payload.hotels = aiResponse.hotels;
            }

            this.io.to(`hotel_${data.hotelId}`).emit('receive_message', {
              hotelId: data.hotelId,
              ...payload
            });
          }
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Method to emit events to specific hotel rooms
  public emitToHotelRoom(hotelId: string, event: string, data: any) {
    this.io.to(`hotel_${hotelId}`).emit(event, data);
  }
}

export default SocketService;