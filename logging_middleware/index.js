const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'system.log');

const writeLog = (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
};

const logger = {
    info: (msg) => writeLog('INFO', msg),
    error: (msg) => writeLog('ERROR', msg),
    warn: (msg) => writeLog('WARN', msg)
};

const loggingMiddleware = (req, res, next) => {
    logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`);
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`Response: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    });
    next();
};

module.exports = {
    logger,
    loggingMiddleware
};
