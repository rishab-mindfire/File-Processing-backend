import app from './index';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Local server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
  }
};

startServer();
