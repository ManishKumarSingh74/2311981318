let fetchClient;
if (typeof fetch === 'undefined') {
    fetchClient = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} else {
    fetchClient = fetch;
}

async function Log(stack, level, packageName, message) {
    try {
        const url = process.env.TEST_SERVER_URL || 'http://20.207.122.201/evaluation-service/logs';
        
        const payload = {
            stack: (stack || "backend").toLowerCase(),
            level: (level || "info").toLowerCase(),
            package: (packageName || "unknown").toLowerCase(),
            message: message || ""
        };

        fetchClient(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AUTH_TOKEN || 'test-token'}`
            },
            body: JSON.stringify(payload)
        }).catch(() => {});
        
    } catch (err) {}
}

const loggingMiddleware = (req, res, next) => {
    Log(
        "backend",
        "info",
        "middleware",
        `Incoming HTTP Request: Method=${req.method}, URL=${req.originalUrl}, IP=${req.ip}`
    );

    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        Log(
            "backend",
            res.statusCode >= 400 ? "warn" : "info",
            "middleware",
            `Completed HTTP Request: Method=${req.method}, URL=${req.originalUrl}, Status=${res.statusCode}, Duration=${duration}ms`
        );
    });

    next();
};

module.exports = {
    Log,
    loggingMiddleware
};
