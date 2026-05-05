const express = require('express');
const router = express.Router();
const apiClient = require('../services/apiClient');
const optimizationService = require('../services/optimizationService');
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'online',
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    });
});
router.post('/optimize', async (req, res, next) => {
    try {
        const { depotIds, algorithm = 'dp' } = req.body;
        if (!['dp', 'greedy'].includes(algorithm)) {
            const error = new Error("Invalid algorithm. Must be 'dp' or 'greedy'");
            error.status = 400;
            throw error;
        }
        const start = performance.now();
        const [allVehicles, allDepots] = await Promise.all([
            apiClient.fetchVehicles(),
            apiClient.fetchDepots()
        ]);
        let depotsToProcess = allDepots;
        if (depotIds && Array.isArray(depotIds)) {
            depotsToProcess = allDepots.filter(d => depotIds.includes(d.ID));
            if (depotsToProcess.length === 0) {
                const error = new Error("No matching depots found for provided depotIds");
                error.status = 404;
                throw error;
            }
        }
        const vehiclesToProcess = allVehicles;
        optimizationService.validateInput(vehiclesToProcess, depotsToProcess);
        const result = optimizationService.scheduleVehicles(vehiclesToProcess, depotsToProcess, algorithm);
        const end = performance.now();
        const executionTimeMs = (end - start).toFixed(2);
        res.json({
            success: true,
            data: {
                ...result,
                algorithm,
                executionTimeMs: `${executionTimeMs}ms`
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
router.post('/optimize-depot/:id', async (req, res, next) => {
    try {
        const depotId = parseInt(req.params.id, 10);
        const { algorithm = 'dp' } = req.body;
        if (!['dp', 'greedy'].includes(algorithm)) {
            const error = new Error("Invalid algorithm. Must be 'dp' or 'greedy'");
            error.status = 400;
            throw error;
        }
        const start = performance.now();
        const [allVehicles, allDepots] = await Promise.all([
            apiClient.fetchVehicles(),
            apiClient.fetchDepots()
        ]);
        const depot = allDepots.find(d => d.ID === depotId);
        if (!depot) {
            const error = new Error("Depot not found");
            error.status = 404;
            throw error;
        }
        const vehiclesToProcess = allVehicles;
        optimizationService.validateInput(vehiclesToProcess, [depot]);
        const result = optimizationService.scheduleVehicles(vehiclesToProcess, [depot], algorithm);
        const end = performance.now();
        const executionTimeMs = (end - start).toFixed(2);
        res.json({
            success: true,
            data: {
                depotId,
                algorithm,
                schedule: result.schedule[depotId] || [],
                metrics: result.metrics[depotId],
                executionTimeMs: `${executionTimeMs}ms`
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;
