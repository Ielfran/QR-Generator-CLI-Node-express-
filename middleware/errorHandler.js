const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.stausCode || 500;
    const message = err.isJoi ? err.details[0].message : err.message;

    logger.error(`Error in ${req.method} ${req.url}: ${message} (Status: ${statusCode})`);

    res.status(statusCode).json({
        success: false,
        error: message,
        errorCode: err.errorCode || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
    });
};

module.exports= errorHandler;
