const optimizeDepotTasks = (tasks, budget) => {
    const numTasks = tasks.length;
    const table = Array(numTasks + 1).fill(0).map(() => Array(budget + 1).fill(0));
    
    for (let i = 1; i <= numTasks; i++) {
        const currentTask = tasks[i - 1];
        const cost = currentTask.Duration;
        const score = currentTask.Impact;
        
        for (let b = 0; b <= budget; b++) {
            if (cost <= b) {
                table[i][b] = Math.max(score + table[i - 1][b - cost], table[i - 1][b]);
            } else {
                table[i][b] = table[i - 1][b];
            }
        }
    }
    
    const chosenTasks = [];
    let budgetLeft = budget;
    let timeSpent = 0;
    
    for (let i = numTasks; i > 0 && table[i][budgetLeft] > 0; i--) {
        if (table[i][budgetLeft] !== table[i - 1][budgetLeft]) {
            const currentTask = tasks[i - 1];
            chosenTasks.push(currentTask.TaskID);
            timeSpent += currentTask.Duration;
            budgetLeft -= currentTask.Duration;
        }
    }
    
    return {
        selectedTaskIds: chosenTasks,
        totalImpact: table[numTasks][budget],
        totalDuration: timeSpent
    };
};

const optimizeGreedy = (tasks, budget) => {
    const ordered = [...tasks].sort((task1, task2) => {
        const ratio1 = task1.Impact / task1.Duration;
        const ratio2 = task2.Impact / task2.Duration;
        return ratio2 - ratio1; 
    });
    
    const chosenTasks = [];
    let usedBudget = 0;
    let accumulatedScore = 0;
    
    for (const t of ordered) {
        if (usedBudget + t.Duration <= budget) {
            chosenTasks.push(t.TaskID);
            usedBudget += t.Duration;
            accumulatedScore += t.Impact;
        }
    }
    
    return {
        selectedTaskIds: chosenTasks,
        totalImpact: accumulatedScore,
        totalDuration: usedBudget
    };
};

const scheduleVehicles = (vehicles, depots, algorithm = 'dp') => {
    let unassigned = [...vehicles];
    const finalPlan = {};
    const vehiclesData = {};
    let sumImpact = 0;
    let sumDuration = 0;
    const stats = {};
    
    const mapTasks = vehicles.reduce((acc, v) => {
        acc[v.TaskID] = v;
        return acc;
    }, {});
    
    for (const d of depots) {
        const id = d.ID;
        const limit = d.MechanicHours;
        
        let output;
        if (algorithm === 'greedy') {
            output = optimizeGreedy(unassigned, limit);
        } else {
            output = optimizeDepotTasks(unassigned, limit);
        }
        
        finalPlan[id] = output.selectedTaskIds;
        sumImpact += output.totalImpact;
        sumDuration += output.totalDuration;
        
        const used = output.totalDuration;
        const perc = limit > 0 ? (used / limit) * 100 : 0;
        
        stats[id] = {
            budgetUsed: used,
            capacity: limit,
            budgetUtilization: `${perc.toFixed(2)}%`,
            vehiclesSelected: output.selectedTaskIds.length,
            availableVehiclesAtStart: unassigned.length
        };
        
        output.selectedTaskIds.forEach(tid => {
            vehiclesData[tid] = mapTasks[tid];
        });
        
        const picked = new Set(output.selectedTaskIds);
        unassigned = unassigned.filter(v => !picked.has(v.TaskID));
    }
    
    return {
        schedule: finalPlan,
        selectedVehicles: vehiclesData,
        totalImpact: sumImpact,
        totalDuration: sumDuration,
        metrics: stats
    };
};

const checkData = (vehicles, depots) => {
    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
        throw new Error('Vehicles array is missing or empty');
    }
    if (!depots || !Array.isArray(depots) || depots.length === 0) {
        throw new Error('Depots array is missing or empty');
    }
    for (const v of vehicles) {
        if (!v.TaskID || v.Duration === undefined || v.Impact === undefined) {
            throw new Error(`Vehicle ${v.TaskID || 'unknown'} is missing required fields`);
        }
        if (v.Duration <= 0) {
            throw new Error(`Vehicle ${v.TaskID} has invalid duration`);
        }
        if (v.Impact < 0) {
            throw new Error(`Vehicle ${v.TaskID} has invalid impact`);
        }
    }
    for (const d of depots) {
        if (!d.ID || d.MechanicHours === undefined) {
            throw new Error(`Depot ${d.ID || 'unknown'} is missing required fields`);
        }
        if (d.MechanicHours < 0) {
            throw new Error(`Depot ${d.ID} has invalid MechanicHours`);
        }
    }
};

module.exports = {
    optimizeDepotTasks,
    optimizeGreedy,
    scheduleVehicles,
    checkData
};
