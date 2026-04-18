import express from 'express';
import dotenv from 'dotenv';
import { userRouter } from './router/user';
import authRoleBased from './middlewares/authRoleBased';
import connectDB from './config/connectDB.config';
import cors from 'cors';
import { projectRoute } from './router/projectRouter';

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.dev';
dotenv.config({ path: envFile });
dotenv.config();
const app = express();

// cors policy attach
const frontend_url: string =
  process.env.FRONTEND_URL || 'http://localhost:5173';
const corsOptions = {
  origin: [frontend_url],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/user', userRouter);
//app.use('/projects', authRoleBased('admin'), projectRoute);
app.use('/projects', projectRoute);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`App is running on ${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to DB', err);
  }
};

startServer();

const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV;
app.listen(port, () => {
  console.log(`${env} : App is running on ${port}`);
});
export default app;
