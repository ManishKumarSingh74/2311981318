const { Log } = require('../../../logging_middleware/index');

const errorHandler = (err, req, res, next) => {
    Log("backend", "error", "handler", `Global Express Error Handler caught an exception: ${err.message || 'Unknown Error'}\nStack: ${err.stack}`);
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
