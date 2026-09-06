import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testDatabaseConnection } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://127.0.0.1:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    await testDatabaseConnection();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'not connected',
      message: 'Start MySQL and import database/schema.sql and database/seed.sql.',
      details: error.code
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/staff', staffRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`QueLess API running on http://${HOST}:${PORT}`);
});
