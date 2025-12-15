import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate OAuth access token is present
 * This is a simple validation - token verification happens at the Google API level
 */
export const validateAccessToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access token is required',
      message: 'Include Authorization header as: Bearer <your_access_token>'
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token || token.trim() === '') {
    res.status(401).json({
      success: false,
      error: 'Invalid access token format'
    });
    return;
  }

  next();
};

/**
 * Future: Middleware for API key authentication
 * Useful if you want to add an additional layer of security
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key is required',
      message: 'Include X-API-Key header'
    });
    return;
  }

  if (apiKey !== process.env.API_KEY) {
    res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
    return;
  }

  next();
};
