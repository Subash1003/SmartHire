import { Router } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  sendSuccess(res, {
    message: 'SmartHire API is healthy',
    data: {
      uptime: process.uptime(),
      db: dbStates[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
