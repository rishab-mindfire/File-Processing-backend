import mongoose from 'mongoose';

const connectDB = async () => {
  const connectionString = process.env.DB_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error('DB_CONNECTION_STRING is missing');
  }

  // Prevent multiple connections in serverless
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(connectionString, {
      autoIndex: true,
      socketTimeoutMS: 45000,
    });

    console.log('Database connected successfully');
  } catch (err) {
    console.error('DB connection error:', err);
    throw err;
  }
};

export default connectDB;
