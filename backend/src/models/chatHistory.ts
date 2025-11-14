import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  content: string;
  sender: string;  // userId or 'AI'
  timestamp: Date;
  isAI: boolean;
}

export interface IChatHistory extends Document {
  hotelId: string;
  userId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatHistorySchema = new Schema({
  hotelId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  messages: [{
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isAI: {
      type: Boolean,
      default: false,
    }
  }],
}, {
  timestamps: true,
});

// Create a compound index for efficient queries
chatHistorySchema.index({ hotelId: 1, userId: 1 });

export default mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);