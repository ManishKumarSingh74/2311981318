require('dotenv').config();
const express = require('express');
const cors = require('cors');
const depotRoutes = require('./routes/depot.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const schedulerRoutes = require('./routes/scheduler.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { loggingMiddleware, Log } = require('../../logging_middleware/index');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use('/api/depots', depotRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use(loggingMiddleware);
app.use((req, res) => {
    res.status(404).json({
        error: {
            status: 404,
            message: 'Not Found',
            timestamp: new Date().toISOString()
        }
    });
});
app.use(errorHandler);
app.listen(PORT, () => {
    Log("backend", "info", "handler", `Server successfully started and is running on port ${PORT}`);
});
