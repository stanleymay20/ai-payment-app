import { logger } from '../services/loggerService.js';

export const notFoundHandler = (req, _res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  logger.warn('route_not_found', { requestId: req.requestId, method: req.method, path: req.originalUrl });
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  const status = error.status || 500;

  logger.error('request_failed', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    status,
    message: error.message,
    details: error.details || null
  });

  return res.status(status).json({
    requestId: req.requestId,
    message: status >= 500 ? 'Internal server error' : error.message,
    details: status < 500 ? error.details || null : null
  });
};
