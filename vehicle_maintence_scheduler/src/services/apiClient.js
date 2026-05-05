const axios = require('axios');
const { logger } = require('../../../logging_middleware/index');
const cache = {
    depots: { data: null, timestamp: null },
    vehicles: { data: null, timestamp: null }
};
const getCacheTTL = () => {
    return parseInt(process.env.CACHE_TTL, 10) || 3600;
};
const isCacheValid = (key) => {
    if (process.env.ENABLE_CACHE !== 'true') return false;
    const entry = cache[key];
    if (!entry || !entry.data || !entry.timestamp) return false;
    const now = Date.now();
    const ttlMs = getCacheTTL() * 1000;
    return (now - entry.timestamp) < ttlMs;
};
const fetchDepots = async () => {
    if (isCacheValid('depots')) {
        return cache.depots.data;
    }
    try {
        const url = process.env.DEPOT_API_URL || 'http://20.207.122.201/evaluation-service/depots';
        const response = await axios.get(url);
        const depotsData = response.data.depots || response.data;
        if (process.env.ENABLE_CACHE === 'true') {
            cache.depots = {
                data: depotsData,
                timestamp: Date.now()
            };
        }
        return depotsData;
    } catch (error) {
        logger.error(`Error fetching depots: ${error.message}`);
        throw new Error(`Failed to fetch depots: ${error.message}`);
    }
};
const fetchVehicles = async () => {
    if (isCacheValid('vehicles')) {
        return cache.vehicles.data;
    }
    try {
        const url = process.env.VEHICLES_API_URL || 'http://20.207.122.201/evaluation-service/vehicles';
        const response = await axios.get(url);
        const vehiclesData = response.data.vehicles || response.data;
        if (process.env.ENABLE_CACHE === 'true') {
            cache.vehicles = {
                data: vehiclesData,
                timestamp: Date.now()
            };
        }
        return vehiclesData;
    } catch (error) {
        logger.error(`Error fetching vehicles: ${error.message}`);
        throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }
};
const clearCache = () => {
    cache.depots = { data: null, timestamp: null };
    cache.vehicles = { data: null, timestamp: null };
};
const getCacheStats = () => {
    const now = Date.now();
    const ttlMs = getCacheTTL() * 1000;
    return {
        enabled: process.env.ENABLE_CACHE === 'true',
        ttlSeconds: getCacheTTL(),
        depots: {
            hasData: !!cache.depots.data,
            ageSeconds: cache.depots.timestamp ? Math.round((now - cache.depots.timestamp) / 1000) : null,
            expiresInSeconds: cache.depots.timestamp ? Math.round((cache.depots.timestamp + ttlMs - now) / 1000) : null,
            isValid: isCacheValid('depots')
        },
        vehicles: {
            hasData: !!cache.vehicles.data,
            ageSeconds: cache.vehicles.timestamp ? Math.round((now - cache.vehicles.timestamp) / 1000) : null,
            expiresInSeconds: cache.vehicles.timestamp ? Math.round((cache.vehicles.timestamp + ttlMs - now) / 1000) : null,
            isValid: isCacheValid('vehicles')
        }
    };
};
module.exports = {
    fetchDepots,
    fetchVehicles,
    clearCache,
    getCacheStats
};
