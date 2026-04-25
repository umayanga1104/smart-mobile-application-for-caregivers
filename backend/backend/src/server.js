import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/database.js';
import cors from 'cors';
import { verifyFirebaseToken } from './middleware/auth.js';
import { userRouter } from './routes/userRoute.js';
import { reminderRouter } from './routes/reminderRoute.js';
import { aiRouter } from './routes/aiRoute.js';
import { stressRouter } from './routes/stressRoute.js';
import { healthStatsRouter } from './routes/healthStatsRoute.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check endpoint (used by Docker HEALTHCHECK)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// User routes
app.use('/api/v2/user', verifyFirebaseToken, userRouter);

// Reminder routes
app.use('/api/v2/reminders', verifyFirebaseToken, reminderRouter);

// AI routes
app.use('/api/v2/ai', verifyFirebaseToken, aiRouter);

// Stress prediction routes 
app.use('/api/v2/stress', verifyFirebaseToken, stressRouter);   

// Health stats routes
app.use('/api/v2/health', verifyFirebaseToken, healthStatsRouter);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();