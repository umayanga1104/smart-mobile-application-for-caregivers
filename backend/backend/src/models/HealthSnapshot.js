// models/HealthSnapshot.js
import mongoose from 'mongoose';

const healthSnapshotSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    index: true,
  },
  stressScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  stressLabel: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  contextRule: {
    type: String,
    default: null,
  },
  heartRate: {
    mean: { type: Number, required: true },
    min: { type: Number },
    max: { type: Number },
    count: { type: Number },
  },
  steps: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for efficient user + time range queries
healthSnapshotSchema.index({ firebaseUID: 1, createdAt: -1 });

export const HealthSnapshot = mongoose.model('HealthSnapshot', healthSnapshotSchema);
