import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(uri);
      console.log('Connected to MongoDB cluster.');
      return;
    } catch (err) {
      console.error('Failed to connect to MONGODB_URI. Falling back to embedded MongoMemoryServer.', err);
    }
  }

  try {
    console.log('Initializing embedded MongoDB Memory Server...');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'campus_placement_db',
      },
    });
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to embedded MongoDB at ${memoryUri}`);
  } catch (err) {
    console.error('CRITICAL: Failed to initialize embedded MongoDB', err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
