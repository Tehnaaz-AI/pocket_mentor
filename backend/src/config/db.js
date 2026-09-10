import mongoose from 'mongoose';
import { config } from './index.js';

/**
 * Opens the single MongoDB connection used by the whole process.
 * Mongoose pools internally, so every request reuses it.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }
  
  const isLocalhost = config.mongoUri.includes('localhost') || config.mongoUri.includes('127.0.0.1');
  if (process.env.NODE_ENV === 'production' && isLocalhost) {
    console.warn('⚠️ Warning: MONGODB_URI is pointing to localhost in production mode.');
  }

  const conn = await mongoose.connect(config.mongoUri);
  console.log(`🗄️  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export default connectDB;

