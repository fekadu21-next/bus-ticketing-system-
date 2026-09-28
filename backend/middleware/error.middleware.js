import ApiError from '../utils/apiError.js';
import env from '../Config/env.js';

/**
 * 404 Catch-all handler
 */
export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized API Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle specific Prisma errors safely without leaking internal SQL
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists.';
    errors = err.meta?.target ? [`Conflict on field: ${err.meta.target}`] : [];
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested resource was not found.';
  }

  // Generic 500 in production
  if (statusCode === 500 && env.nodeEnv === 'production') {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export default {
  notFoundHandler,
  errorHandler,
};