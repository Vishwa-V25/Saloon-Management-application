import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connects to MongoDB Atlas (or local MongoDB) via MONGO_URI.
 * Uses connection pooling and fails fast if MONGO_URI is missing in production.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGO_URI environment variable is required.');
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return { isInMemory: false };
  } catch (err) {
    if (process.env.ALLOW_IN_MEMORY_DB === 'true' && process.env.NODE_ENV !== 'production') {
      console.warn(`Primary MongoDB unreachable (${err.message}). Starting local in-memory MongoDB...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri());
      console.log('In-memory MongoDB connected (Local Dev Mode)');
      return { isInMemory: true };
    }
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
