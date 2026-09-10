import mongoose from 'mongoose';
import { config } from './index.js';

/**
 * Opens the single MongoDB connection used by the whole process.
 * Mongoose pools internally, so every request reuses it.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(config.mongoUri);
  console.log(`🗄️  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export default connectDB;
