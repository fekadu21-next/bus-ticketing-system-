import rateLimit from 'express-rate-limit';

const isDevOrTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 10000 : 200, // 200 requests per window in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 10000 : 15, // 15 attempts per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

export const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 10000 : 5, // 5 requests per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification email requests. Please try again after 15 minutes.',
  },
});

export default {
  globalLimiter,
  authLimiter,
  resendLimiter,
};
