import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	console.warn('[db] MONGODB_URI is not set — API routes will fail until .env is configured.');
}

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
	if (!MONGODB_URI) {
		throw new Error('MONGODB_URI is not configured');
	}

	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		mongoose.set('bufferCommands', false);
		cached.promise = mongoose.connect(MONGODB_URI);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
