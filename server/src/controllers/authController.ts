import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateEmail, validatePassword } from '@/middleware/validation';
import config from '@/config';

// Mock user database - replace with actual database
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    displayName: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'user@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    displayName: 'Regular User',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiresIn }
  );

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, displayName } = req.body;

  // Validation
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Valid email is required',
      },
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_REQUIRED',
        message: 'Password is required',
      },
    });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'Password does not meet requirements',
        details: passwordValidation.errors,
      },
    });
  }

  if (!displayName || displayName.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DISPLAY_NAME_REQUIRED',
        message: 'Display name is required',
      },
    });
  }

  // Check if user already exists
  const existingUser = mockUsers.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
      },
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = {
    id: (mockUsers.length + 1).toString(),
    email,
    password: hashedPassword,
    displayName: displayName.trim(),
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUsers.push(newUser);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.email, newUser.role);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validation
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Valid email is required',
      },
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_REQUIRED',
        message: 'Password is required',
      },
    });
  }

  // Find user
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'ACCOUNT_DISABLED',
        message: 'Account has been disabled',
      },
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // In a real application, you would invalidate the refresh token
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token is required',
      },
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as any;
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId,
      decoded.email,
      decoded.role
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
      },
    });
  }
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = mockUsers.find(u => u.id === req.user!.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { displayName } = req.body;
  const userId = req.user!.userId;

  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  if (displayName && displayName.trim().length > 0) {
    mockUsers[userIndex].displayName = displayName.trim();
    mockUsers[userIndex].updatedAt = new Date();
  }

  res.json({
    success: true,
    data: {
      user: {
        id: mockUsers[userIndex].id,
        email: mockUsers[userIndex].email,
        displayName: mockUsers[userIndex].displayName,
        role: mockUsers[userIndex].role,
        updatedAt: mockUsers[userIndex].updatedAt,
      },
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Valid email is required',
      },
    });
  }

  // In a real application, you would send a password reset email
  res.json({
    success: true,
    data: {
      message: 'Password reset email sent if account exists',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'Token and password are required',
      },
    });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'Password does not meet requirements',
        details: passwordValidation.errors,
      },
    });
  }

  // In a real application, you would verify the reset token and update the password
  res.json({
    success: true,
    data: {
      message: 'Password reset successfully',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// OAuth placeholder functions
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Google OAuth not implemented yet',
    },
  });
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Google OAuth callback not implemented yet',
    },
  });
});

export const microsoftAuth = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Microsoft OAuth not implemented yet',
    },
  });
});

export const microsoftCallback = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Microsoft OAuth callback not implemented yet',
    },
  });
});
