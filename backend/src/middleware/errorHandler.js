export const notFoundHandler = (_req, _res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  const status = error.status || 500;

  console.error({
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    message: error.message,
    details: error.details || null
  });

  return res.status(status).json({
    requestId: req.requestId,
    message: status >= 500 ? 'Internal server error' : error.message,
    details: status < 500 ? error.details || null : null
  });
};
