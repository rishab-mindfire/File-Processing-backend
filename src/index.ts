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

const app = express();

// CORS
const frontend_url: string =
  process.env.FRONTEND_URL || 'http://localhost:3001';

const corsOptions = {
  origin: [frontend_url, 'http://localhost:3002'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/user', userRouter);
app.use('/projects', authRoleBased('admin'), projectRoute);

// Connect DB
connectDB().catch((err) => {
  console.error('DB connection failed:', err);
});

// Main Route
app.get('/', (req, res) => {
  res.send('API is running');
});

export default app;
