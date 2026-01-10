import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUsage extends Document {
    userId: string;
    date: string; // YYYY-MM-DD
    count: number;
}

const UsageSchema = new Schema<IUsage>({
    userId: { type: String, required: true },
    date: { type: String, required: true },
    count: { type: Number, default: 0 },
});

UsageSchema.index({ userId: 1, date: 1 }, { unique: true });

const Usage = models?.Usage || model<IUsage>('Usage', UsageSchema);

export default Usage;
