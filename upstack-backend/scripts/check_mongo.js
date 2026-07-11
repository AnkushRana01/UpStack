import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;

(async () => {
  try {
    if (!uri) {
      console.log('MONGO_URI not set in upstack-backend/.env');
      process.exit(0);
    }

    await mongoose.connect(uri, { dbName: uri.includes('/') ? undefined : 'upstack' });
    const db = mongoose.connection.db;

    const filesCount = await db.collection('files').countDocuments().catch(() => 0);
    const usersCount = await db.collection('users').countDocuments().catch(() => 0);

    console.log('Connected to MongoDB URI:', uri);
    console.log('files.count =', filesCount);
    console.log('users.count =', usersCount);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  }
})();
