import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;

declare global {
    var mongooseCache : {
        conn: typeof mongoose | null,
        promise: Promise<typeof mongoose> | null
    }
}

let cached = global.mongooseCache;

if(!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if(!MONGODB_URL) throw new Error('MONGODB_URL is not defined within .env file');

    if(cached.conn) {
        return cached.conn;
    }
    if(!cached.promise) {
        // @ts-ignore
        cached.promise = mongoose.connect(MONGODB_URL, { bufferCommands: false });
    }
    try{
        cached.conn = await cached.promise;
    }catch(error){
        cached.promise = null;
        throw error;
    }
    console.log(`Connected to database ${process.env.NODE_ENV}-${MONGODB_URL}`);

    return cached.conn;
}