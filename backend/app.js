import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import env from './Config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 2. Cookie & Body Parsing
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. Logging & Global Rate Limiting
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use('/api', globalLimiter);

// 4. API V1 Routes
app.use('/api/v1', apiRoutes);

// 5. Catch-all Unmatched Routes (404)
app.use(notFoundHandler);

// 6. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;