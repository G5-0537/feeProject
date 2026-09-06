export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Something went wrong.',
    details: process.env.NODE_ENV === 'production' ? undefined : error.code || error.sqlMessage
  });
}
