# Transport Pathfinding Performance Analysis

## Overview

This document describes the performance test setup for transport ship pathfinding in OpenFrontIO. The test measures the computational cost of various operations involved in creating and routing transport ships across water.

## Test File

`TransportPathfindingPerf.ts` - Comprehensive performance benchmarks for transport pathfinding operations

## What is Being Tested

Transport ships in OpenFrontIO require several computational steps:

1. **targetTransportTile** - Find the landing zone (closest shore tile to target)
2. **closestShoreFromPlayer** - Find the spawn point (closest player shore tile to destination)
3. **PathFinder.Mini** - Compute the water path from spawn to landing zone using A\* algorithm
4. **candidateShoreTiles** - Select candidate spawn points for optimization
5. **bestShoreDeploymentSource** - Find optimal spawn point using A\* on candidates

The full transport initialization combines steps 1-3, which happens every time a player creates a new transport ship.

## Test Scenarios

The test uses 4 distance scenarios on a 16x16 map (half_land_half_ocean):

- **Short**: Adjacent regions (~10% of map width)
- **Medium**: Quarter map (~25% of map width)
- **Long**: Half map (~60% of map width)
- **Very Long**: Diagonal across map (~80% of diagonal distance)

## Baseline Results (Current Implementation)

### Test 1: PathFinder.Mini (Core Water Pathfinding)

```
Short distance:     ~567,000 ops/sec  (~0.0018ms per operation)
Medium distance:    ~625,000 ops/sec  (~0.0016ms per operation)
Long distance:      ~501,000 ops/sec  (~0.0020ms per operation)
Very long distance: ~700,000 ops/sec  (~0.0014ms per operation)
```

### Test 2: targetTransportTile (Landing Zone Finding)

```
All distances:      ~19,000 ops/sec   (~0.053ms per operation)
```

### Test 6: Full Transport Initialization

```
All distances:      ~19,000 ops/sec   (~0.053ms per operation)
```

## Key Findings

1. **PathFinder.Mini is very fast** - Over 500,000 operations per second for water pathfinding
2. **targetTransportTile dominates the cost** - ~97% of the initialization time
3. **Distance doesn't significantly affect performance** - All scenarios perform similarly

## Current Bottleneck

The `targetTransportTile` function is the primary bottleneck, taking approximately **0.053ms per call**. This function:

- Determines the player owner of the target tile
- Calls `closestShoreFromPlayer` which iterates through all border tiles
- Filters for shore tiles and calculates Manhattan distances

## Code Flow

```typescript
// TransportShipExecution.init() calls:
this.dst = targetTransportTile(this.mg, this.ref);  // ~0.053ms
↓
const closestTileSrc = this.attacker.canBuild(UnitType.TransportShip, this.dst);
↓
// Later in tick():
const result = this.pathFinder.nextTile(this.boat.tile(), this.dst);  // ~0.002ms
```

## Optimization Opportunities

### High Priority

1. **Cache shore tiles per player** - Avoid filtering borderTiles() on every call
2. **Spatial indexing** - Use quadtree/grid for faster nearest shore lookups
3. **Lazy computation** - Only compute paths when transport moves, not on init

### Medium Priority

4. **Path reuse** - Cache common routes between regions
5. **Early termination** - Stop shore search after finding "good enough" match
6. **Parallel candidate evaluation** - For bestShoreDeploymentSource

### Low Priority

7. **Mini A\* optimization** - Although already fast, could optimize node expansion
8. **Distance heuristic improvements** - Better estimates for water paths

## How to Run

```bash
npm run perf
# or specifically:
npx tsx tests/perf/TransportPathfindingPerf.ts
```

## Interpreting Results

- **ops/sec** - Operations per second (higher is better)
- **±X%** - Margin of error (lower is better, <5% is good)
- **X runs sampled** - Number of benchmark iterations (higher is more reliable)

## Optimization Implementation

### ✅ Implemented: Shore Tile Caching (High Priority)

**Commit:** pathfinding-optimization branch

**Changes Made:**

1. Added `_shoreTilesCache` field to `PlayerImpl` class
2. Added `shoreTiles()` method that returns cached shore tiles
3. Added `invalidateShoreTilesCache()` called when territories change
4. Updated `closestShoreFromPlayer()` to use cached data
5. Updated `candidateShoreTiles()` to use cached data

**Performance Impact:**

- **14.76x faster** for cached shore tile lookups
- **93.2% reduction** in computation time per call
- Cache rebuilds only on territory changes (rare relative to lookups)

**Benchmark Results:**

```
OLD (no cache):     385,951 ops/sec
NEW (cached):       5,697,051 ops/sec
NEW (rebuild):      385,670 ops/sec

Speedup: 14.76x faster for cached lookups
```

**Real-world Impact:**
In a typical game with 500 transport pathfinding lookups:

- OLD: 1.30ms total
- NEW: 0.15ms total (including 25 cache rebuilds)
- **Savings: 1.14ms (88.2% faster)**

**Files Modified:**

- `src/core/game/PlayerImpl.ts` - Added cache fields and methods
- `src/core/game/Game.ts` - Added interface methods
- `src/core/game/GameImpl.ts` - Added cache invalidation on territory changes
- `src/core/game/TransportShipUtils.ts` - Updated to use cached shore tiles

**Testing:**

- `tests/perf/ShoreTileCachingBenchmark.ts` - Microbenchmark demonstrating optimization
- Original tests still pass with cached implementation

---

## Next Steps

1. Review this baseline performance data
2. Identify which optimization provides best cost/benefit ratio
3. Implement optimization in a new commit
4. Re-run this test to measure improvement
5. Compare before/after metrics

## Notes

- Test uses small map (16x16) for consistency and speed
- Real game maps (like Giant World Map at 4110x1948) will show different absolute performance but similar relative patterns
- Players without shore tiles will skip Tests 3-5
- The benchmark library automatically adjusts iteration count to get statistically significant results
