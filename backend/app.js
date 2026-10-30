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
app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = new Set(
  [
    env.clientUrl,
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://localhost:19006',
  ]
    .filter(Boolean)
    .map((url) => url.replace(/\/$/, ''))
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.nodeEnv === 'development' || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
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