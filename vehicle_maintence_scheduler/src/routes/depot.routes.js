const express = require('express');
const router = express.Router();
const apiClient = require('../services/apiClient');
router.get('/', async (req, res, next) => {
    try {
        const depots = await apiClient.fetchDepots();
        res.json({
            success: true,
            data: {
                count: depots.length,
                depots
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.get('/cache/stats', (req, res) => {
    const stats = apiClient.getCacheStats();
    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
    });
});
router.post('/cache/clear', (req, res) => {
    apiClient.clearCache();
    res.json({
        success: true,
        data: { message: 'Cache cleared successfully' },
        timestamp: new Date().toISOString()
    });
});
router.get('/:id', async (req, res, next) => {
    try {
        const depots = await apiClient.fetchDepots();
        const depot = depots.find(d => d.ID.toString() === req.params.id);
        if (!depot) {
            const error = new Error('Depot not found');
            error.status = 404;
            throw error;
        }
        res.json({
            success: true,
            data: depot,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.get('/:id/capacity', async (req, res, next) => {
    try {
        const depots = await apiClient.fetchDepots();
        const depot = depots.find(d => d.ID.toString() === req.params.id);
        if (!depot) {
            const error = new Error('Depot not found');
            error.status = 404;
            throw error;
        }
        res.json({
            success: true,
            data: {
                ID: depot.ID,
                MechanicHours: depot.MechanicHours
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;
