const knapsack01 = (items, capacity) => {
    const n = items.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        const item = items[i - 1];
        const weight = item.Duration;
        const value = item.Impact;
        for (let w = 0; w <= capacity; w++) {
            if (weight <= w) {
                dp[i][w] = Math.max(value + dp[i - 1][w - weight], dp[i - 1][w]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    const selectedTaskIds = [];
    let w = capacity;
    let totalDuration = 0;
    for (let i = n; i > 0 && dp[i][w] > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const item = items[i - 1];
            selectedTaskIds.push(item.TaskID);
            totalDuration += item.Duration;
            w -= item.Duration;
        }
    }
    return {
        selectedTaskIds,
        totalImpact: dp[n][capacity],
        totalDuration
    };
};
const knapsackGreedy = (items, capacity) => {
    const sortedItems = [...items].sort((a, b) => {
        const densityA = a.Impact / a.Duration;
        const densityB = b.Impact / b.Duration;
        return densityB - densityA; 
    });
    const selectedTaskIds = [];
    let currentWeight = 0;
    let totalImpact = 0;
    for (const item of sortedItems) {
        if (currentWeight + item.Duration <= capacity) {
            selectedTaskIds.push(item.TaskID);
            currentWeight += item.Duration;
            totalImpact += item.Impact;
        }
    }
    return {
        selectedTaskIds,
        totalImpact,
        totalDuration: currentWeight
    };
};
const scheduleVehicles = (vehicles, depots, algorithm = 'dp') => {
    let remainingVehicles = [...vehicles];
    const schedule = {};
    const selectedVehiclesMap = {};
    let totalOverallImpact = 0;
    let totalOverallDuration = 0;
    const metrics = {};
    const vehicleLookup = vehicles.reduce((acc, v) => {
        acc[v.TaskID] = v;
        return acc;
    }, {});
    for (const depot of depots) {
        const depotId = depot.ID;
        const capacity = depot.MechanicHours;
        let result;
        if (algorithm === 'greedy') {
            result = knapsackGreedy(remainingVehicles, capacity);
        } else {
            result = knapsack01(remainingVehicles, capacity);
        }
        schedule[depotId] = result.selectedTaskIds;
        totalOverallImpact += result.totalImpact;
        totalOverallDuration += result.totalDuration;
        const budgetUsed = result.totalDuration;
        const budgetUtilization = capacity > 0 ? (budgetUsed / capacity) * 100 : 0;
        metrics[depotId] = {
            budgetUsed,
            capacity,
            budgetUtilization: `${budgetUtilization.toFixed(2)}%`,
            vehiclesSelected: result.selectedTaskIds.length,
            availableVehiclesAtStart: remainingVehicles.length
        };
        result.selectedTaskIds.forEach(taskId => {
            selectedVehiclesMap[taskId] = vehicleLookup[taskId];
        });
        const selectedSet = new Set(result.selectedTaskIds);
        remainingVehicles = remainingVehicles.filter(v => !selectedSet.has(v.TaskID));
    }
    return {
        schedule,
        selectedVehicles: selectedVehiclesMap,
        totalImpact: totalOverallImpact,
        totalDuration: totalOverallDuration,
        metrics
    };
};
const validateInput = (vehicles, depots) => {
    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
        throw new Error('Vehicles array is missing or empty');
    }
    if (!depots || !Array.isArray(depots) || depots.length === 0) {
        throw new Error('Depots array is missing or empty');
    }
    for (const vehicle of vehicles) {
        if (!vehicle.TaskID || vehicle.Duration === undefined || vehicle.Impact === undefined) {
            throw new Error(`Vehicle ${vehicle.TaskID || 'unknown'} is missing required fields`);
        }
        if (vehicle.Duration <= 0) {
            throw new Error(`Vehicle ${vehicle.TaskID} has invalid duration`);
        }
        if (vehicle.Impact < 0) {
            throw new Error(`Vehicle ${vehicle.TaskID} has invalid impact`);
        }
    }
    for (const depot of depots) {
        if (!depot.ID || depot.MechanicHours === undefined) {
            throw new Error(`Depot ${depot.ID || 'unknown'} is missing required fields`);
        }
        if (depot.MechanicHours < 0) {
            throw new Error(`Depot ${depot.ID} has invalid MechanicHours`);
        }
    }
};
module.exports = {
    knapsack01,
    knapsackGreedy,
    scheduleVehicles,
    validateInput
};
