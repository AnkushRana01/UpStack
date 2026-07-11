import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { execSync } from 'child_process';

let memoryServer;

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  mongoose.set('strictQuery', true);

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected');
      return;
    } catch (error) {
      console.warn('MongoDB connection failed:', error.message);

      // If SRV lookup fails (common on some Windows DNS setups), try an nslookup
      // based fallback: resolve SRV records with the system `nslookup` and
      // construct a direct `mongodb://` URI pointing to the resolved hosts.
      if (mongoUri.startsWith('mongodb+srv://') && /querySrv/i.test(error.message)) {
        try {
          const m = mongoUri.match(/^mongodb\+srv:\/\/(.*?):(.*?)@(.*?)(\/|\?|$)/);
          if (m) {
            const user = encodeURIComponent(m[1]);
            const pass = encodeURIComponent(m[2]);
            const host = m[3];
            const srvName = `_mongodb._tcp.${host}`;
            const out = execSync(`nslookup -type=SRV ${srvName}`, { encoding: 'utf8', timeout: 10000 });
            const lines = out.split(/\r?\n/);
            const hosts = lines
              .filter(l => l.toLowerCase().includes('svr hostname'))
              .map(l => l.split('=').pop().trim())
              .filter(Boolean);

            if (hosts.length > 0) {
              const hostPorts = hosts.map(h => `${h}:27017`).join(',');
              const fallback = `mongodb://${user}:${pass}@${hostPorts}/?tls=true&authSource=admin&retryWrites=true&w=majority`;
              await mongoose.connect(fallback);
              console.log('MongoDB connected via SRV fallback');
              return;
            }
          }
        } catch (e) {
          console.warn('SRV fallback attempt failed:', e.message);
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGO_URI is required in production');
  }

  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log('Connected to in-memory MongoDB for development');
}

export async function stopMemoryDB() {
  if (memoryServer) {
    await mongoose.disconnect();
    await memoryServer.stop();
  }
}
