// src/config/database.js
import mongoose from 'mongoose';

const URI = process.env.MONGODB_URI;

if (!URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

export async function connectDB() {
  try {
    await mongoose.connect(URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}