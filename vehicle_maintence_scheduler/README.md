# Vehicle Maintenance Scheduler Microservice

A Node.js backend API built with Express.js that optimizes daily vehicle maintenance scheduling across multiple logistics depots. It selects vehicles to maximize operational impact while staying within each depot's mechanic-hour budget, using either 0/1 Knapsack Dynamic Programming or a Greedy approach.

## Installation

1. Clone or download the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env` and adjust variables if needed.
4. Run `npm run dev` for development mode or `npm start` to run normally.

## Features
- Fetches data from external APIs and caches it in memory.
- Dynamic Programming and Greedy algorithms for optimization.
- Comprehensive REST API for fetching depots, vehicles, and running scheduling tasks.

## Endpoints

### Depots
- `GET /api/depots` - List all depots
- `GET /api/depots/:id` - Get specific depot
- `GET /api/depots/:id/capacity` - Get depot budget info
- `POST /api/depots/cache/clear` - Clear in-memory cache
- `GET /api/depots/cache/stats` - View cache statistics

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/depot/:id` - Filter vehicles by depot
- `GET /api/vehicles/task/:id` - Get specific vehicle task
- `GET /api/vehicles/stats/summary` - Overall statistics
- `GET /api/vehicles/stats/by-depot` - Grouped statistics

### Scheduler
- `POST /api/scheduler/optimize` - Run optimization across depots. Optional body: `{ depotIds: [1, 2], algorithm: 'dp' | 'greedy' }`
- `POST /api/scheduler/optimize-depot/:id` - Optimize a single depot
- `GET /api/scheduler/status` - Service status
