// Provides centralized not-found and error response handling for the API.
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
}

// Convert thrown errors into a consistent API response format.
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
