const express = require('express');
const router = express.Router();
const apiClient = require('../services/apiClient');
router.get('/', async (req, res, next) => {
    try {
        const vehicles = await apiClient.fetchVehicles();
        res.json({
            success: true,
            data: {
                count: vehicles.length,
                vehicles
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.get('/stats/summary', async (req, res, next) => {
    try {
        const vehicles = await apiClient.fetchVehicles();
        const totalDuration = vehicles.reduce((sum, v) => sum + v.Duration, 0);
        const totalImpact = vehicles.reduce((sum, v) => sum + v.Impact, 0);
        res.json({
            success: true,
            data: {
                totalVehicles: vehicles.length,
                totalDuration,
                totalImpact,
                averageDuration: vehicles.length ? Number((totalDuration / vehicles.length).toFixed(2)) : 0,
                averageImpact: vehicles.length ? Number((totalImpact / vehicles.length).toFixed(2)) : 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.get('/stats/by-depot', async (req, res, next) => {
    try {
        const vehicles = await apiClient.fetchVehicles();
        const stats = vehicles.reduce((acc, v) => {
            const depotId = v.DepotID || 'unassigned';
            if (!acc[depotId]) {
                acc[depotId] = { count: 0, totalDuration: 0, totalImpact: 0 };
            }
            acc[depotId].count++;
            acc[depotId].totalDuration += v.Duration;
            acc[depotId].totalImpact += v.Impact;
            return acc;
        }, {});
        Object.keys(stats).forEach(depotId => {
            stats[depotId].averageDuration = Number((stats[depotId].totalDuration / stats[depotId].count).toFixed(2));
            stats[depotId].averageImpact = Number((stats[depotId].totalImpact / stats[depotId].count).toFixed(2));
        });
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.get('/depot/:id', async (req, res, next) => {
    try {
        const vehicles = await apiClient.fetchVehicles();
        const depotVehicles = vehicles.filter(v => v.DepotID && v.DepotID.toString() === req.params.id);
        res.json({
            success: true,
            data: {
                count: depotVehicles.length,
                vehicles: depotVehicles
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.get('/task/:id', async (req, res, next) => {
    try {
        const vehicles = await apiClient.fetchVehicles();
        const vehicle = vehicles.find(v => v.TaskID === req.params.id);
        if (!vehicle) {
            const error = new Error('Vehicle task not found');
            error.status = 404;
            throw error;
        }
        res.json({
            success: true,
            data: vehicle,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;
