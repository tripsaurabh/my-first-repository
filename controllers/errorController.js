const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue[Object.keys(err.keyValue)[0]];

  console.log(value);

  const message = `Duplicate Field Value: ${value}. Please use another value!!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  console.log(errors);

  const message = `Invalid Input DATA. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJwtError = (err) =>
  new AppError('Invalid Token!!. Please log in again', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR!!!', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack); name: err.name

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  //   err.message = err.message || 'OOPS< ERROR FOUND';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = JSON.parse(JSON.stringify(err));

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
      console.log(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJwtError(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError(error);
    }

    sendErrorProd(error, res);
  }
};
