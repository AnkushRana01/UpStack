import 'dotenv/config';
import 'dotenv/config';
import { exec } from 'child_process';
import mongoose from 'mongoose';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  if (!uri.startsWith('mongodb+srv://')) {
    console.log('MONGO_URI is not an SRV URI. Attempting direct connect.');
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      const db = mongoose.connection.db;
      const files = await db.collection('files').countDocuments().catch(() => 0);
      const users = await db.collection('users').countDocuments().catch(() => 0);
      console.log('Connected. files =', files, 'users =', users);
      await mongoose.disconnect();
      process.exit(0);
    } catch (e) {
      console.error('Direct connect failed:', e.message);
      process.exit(1);
    }
  }

  // Parse user/pass and host
  const m = uri.match(/^mongodb\+srv:\/\/(.*?):(.*?)@(.*?)(\/|\?|$)/);
  if (!m) {
    console.error('Failed to parse SRV URI');
    process.exit(1);
  }
  const user = encodeURIComponent(m[1]);
  const pass = encodeURIComponent(m[2]);
  const host = m[3];
  const srvName = `_mongodb._tcp.${host}`;

  exec(`nslookup -type=SRV ${srvName}`, { timeout: 10000 }, async (err, stdout, stderr) => {
    if (err) {
      console.error('nslookup failed:', err.message);
      process.exit(1);
    }

    const lines = stdout.split(/\r?\n/);
    const hosts = lines
      .filter(l => l.toLowerCase().includes('svr hostname'))
      .map(l => {
        // nslookup SRV line looks like: "          svr hostname   = ac-..."
        const parts = l.split('=');
        return parts.pop().trim();
      })
      .filter(Boolean);
    if (hosts.length === 0) {
      console.error('No SRV hosts found');
      process.exit(1);
    }

    const hostPorts = hosts.map(h => `${h}:27017`).join(',');
    const fallback = `mongodb://${user}:${pass}@${hostPorts}/?tls=true&authSource=admin&retryWrites=true&w=majority`;

    console.log('Attempting fallback URI:', fallback.replace(/:(.*)@/, ':******@'));

    try {
      await mongoose.connect(fallback, { serverSelectionTimeoutMS: 10000 });
      const db = mongoose.connection.db;
      const files = await db.collection('files').countDocuments().catch(() => 0);
      const users = await db.collection('users').countDocuments().catch(() => 0);
      console.log('Connected via fallback. files =', files, 'users =', users);
      await mongoose.disconnect();
      process.exit(0);
    } catch (e) {
      console.error('Fallback connect failed:', e.message);
      process.exit(1);
    }
  });
}

main().catch(err => {
  console.error('Unhandled error:', err.message || err);
  process.exit(1);
});
