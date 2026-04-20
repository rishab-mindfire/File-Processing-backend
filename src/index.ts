import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('WORKING');
});

export default app;
