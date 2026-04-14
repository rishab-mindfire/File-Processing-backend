import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const options = {
  autoIndex: true,
  socketTimeoutMS: 45000,
};

//db connection using connection string
const connectDB = async () => {
  const connectionString = process.env.DB_CONNECTION_STRING;
  console.log(`Connecting to ... ${connectionString}`);
  if (connectionString) {
    await mongoose
      .connect(connectionString, options)
      .then((res) => {
        if (res) {
          console.log(
            `Database connection successfully ! : ${connectionString}`,
          );
        }
      })
      .catch((err) => {
        console.log(`Error in DB connection : ${connectionString}`, err);
      });

    return mongoose;
  } else {
    console.log(`Connection string is undefind ! ${connectionString}`);
  }
};
export default connectDB;
