import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

const connectWithRetry = async () => {
  const maxRetries = 5;
  let currentTry = 1;

  while (currentTry <= maxRetries) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
      return true;
    } catch (err) {
      console.log(`Database connection attempt ${currentTry} failed:`, err.message);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      currentTry++;
    }
  }
  return false;
};

const startServer = async () => {
  try {
    const isConnected = await connectWithRetry();
    if (!isConnected) {
      throw new Error('Failed to connect to database after multiple retries');
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

startServer();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle cleanup
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});