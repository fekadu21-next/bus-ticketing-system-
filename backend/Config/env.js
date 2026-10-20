import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:5000/api/v1',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'busticket_access_secret_production_key_32bytes_minimum',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'busticket_refresh_secret_production_key_32bytes_minimum',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@busticket.com',
  },
  payment: {
    chapa: {
      secretKey: process.env.CHAPA_SECRET_KEY || '',
      baseUrl: process.env.NODE_ENV === 'production' ? 'https://api.chapa.co' : 'https://api.chapa.co',
    },
    telebirr: {
      merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID || '',
      fabricAppId: process.env.TELEBIRR_FABRIC_APP_ID || '',
      shortCode: process.env.TELEBIRR_SHORT_CODE || '',
      appSecret: process.env.TELEBIRR_APP_SECRET || '',
      privateKey: process.env.TELEBIRR_PRIVATE_KEY || '',
      baseUrl: process.env.NODE_ENV === 'production' ? 'https://app.telebirr.et' : 'https://app.telebirr.et',
    },
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  },
};

export default env;