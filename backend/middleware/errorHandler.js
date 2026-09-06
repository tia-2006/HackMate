// Middleware to handle requests to undefined routes
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handling middleware
// Must have 4 parameters so Express recognises it as an error handler
const errorHandler = (err, req, res, next) => {
  // If status is still 200 at the point of error, change it to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only expose the stack trace in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
