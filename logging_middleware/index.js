let myFetch;
if (typeof fetch === 'undefined') {
    myFetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
} else {
    myFetch = fetch;
}

async function Log(stack, level, packageName, message) {
    try {
        const targetUrl = process.env.TEST_SERVER_URL || 'http://20.207.122.201/evaluation-service/logs';
        
        const data = {
            stack: (stack || "backend").toLowerCase(),
            level: (level || "info").toLowerCase(),
            package: (packageName || "unknown").toLowerCase(),
            message: message || ""
        };

        myFetch(targetUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AUTH_TOKEN || 'test-token'}`
            },
            body: JSON.stringify(data)
        }).catch(() => {});
        
    } catch (e) {}
}

const reqLogger = (req, res, next) => {
    Log(
        "backend",
        "info",
        "middleware",
        `Incoming HTTP Request: Method=${req.method}, URL=${req.originalUrl}, IP=${req.ip}`
    );

    const t0 = Date.now();
    res.on('finish', () => {
        const timeTaken = Date.now() - t0;
        let lvl = "info";
        if (res.statusCode >= 400) {
            lvl = "warn";
        }
        
        Log(
            "backend",
            lvl,
            "middleware",
            `Completed HTTP Request: Method=${req.method}, URL=${req.originalUrl}, Status=${res.statusCode}, Duration=${timeTaken}ms`
        );
    });

    next();
};

module.exports = {
    Log,
    loggingMiddleware: reqLogger
};
