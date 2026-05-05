const { logger } = require('../../../logging_middleware/index');

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        error: {
            status,
            message,
            timestamp: new Date().toISOString()
        }
    });
};
module.exports = {
    errorHandler
};
