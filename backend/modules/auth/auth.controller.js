import authService from './services/auth.service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
} from './auth.utils.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const user = await authService.register({
      firstName,
      lastName,
      email,
      phone,
      password,
      clientIp,
      userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. A verification link has been sent to your email.',
      data: { user },
    });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({
      email,
      password,
      clientIp,
      userAgent,
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  });

  refresh = asyncHandler(async (req, res) => {
    const rawRefreshToken = getRefreshTokenFromRequest(req);
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.refreshTokens({
      rawRefreshToken,
      clientIp,
      userAgent,
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  });

  logout = asyncHandler(async (req, res) => {
    const rawRefreshToken = getRefreshTokenFromRequest(req);
    const userId = req.user?.id;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    await authService.logout({
      rawRefreshToken,
      userId,
      clientIp,
      userAgent,
    });

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.verifyEmail({
      rawToken: token,
      clientIp,
      userAgent,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.resendVerification({
      email,
      clientIp,
      userAgent,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.forgotPassword({
      email,
      clientIp,
      userAgent,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.resetPassword({
      rawToken: token,
      newPassword,
      clientIp,
      userAgent,
    });

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.changePassword({
      userId,
      currentPassword,
      newPassword,
      clientIp,
      userAgent,
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        accessToken: result.accessToken,
      },
    });
  });
}

export const authController = new AuthController();
export default authController;