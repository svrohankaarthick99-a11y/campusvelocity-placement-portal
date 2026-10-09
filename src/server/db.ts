import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

function isValidMongoUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed || trimmed === '""' || trimmed === "''") return false;

  // Check for common placeholders
  if (
    trimmed.includes('NEW_PASSWORD') ||
    trimmed.includes('<password>') ||
    trimmed.includes('YOUR_PASSWORD') ||
    trimmed.includes('YOUR_') ||
    trimmed.includes('@...') ||
    trimmed.endsWith('@...') ||
    trimmed.includes('cluster0.example.mongodb.net')
  ) {
    return false;
  }

  // Check host component
  try {
    const afterAt = trimmed.split('@')[1];
    if (afterAt) {
      const host = afterAt.split('/')[0].split('?')[0];
      if (!host || host === '...' || host.startsWith('..') || !host.includes('.')) {
        return false;
      }
    } else {
      if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return true;
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && isValidMongoUri(uri)) {
    try {
      console.log('Connecting to provided MONGODB_URI cluster...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log('Connected to MongoDB cluster.');
      return;
    } catch (err: any) {
      console.warn('Unable to connect to external MONGODB_URI. Falling back to embedded MongoMemoryServer:', err?.message || err);
    }
  } else if (uri && uri.trim() !== '') {
    console.log('MONGODB_URI contains unconfigured placeholder values; defaulting to embedded MongoMemoryServer.');
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
