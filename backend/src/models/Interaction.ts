import mongoose, { Schema, Document } from 'mongoose';

export interface IInteraction extends Document {
  userId: string;
  hotelId?: string;
  action: string; // e.g., 'view', 'click_book', 'message'
  metadata?: Record<string, any>;
  createdAt: Date;
}

const interactionSchema = new Schema<IInteraction>(
  {
    userId: { type: String, required: true },
    hotelId: { type: String },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

interactionSchema.index({ userId: 1, hotelId: 1 });

export default mongoose.model<IInteraction>('Interaction', interactionSchema);
