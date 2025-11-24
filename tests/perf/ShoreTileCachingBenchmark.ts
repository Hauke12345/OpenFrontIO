import Benchmark from "benchmark";

// Simulate before/after optimization impact
// This microbenchmark demonstrates the performance difference

// Simulate a player's border tiles (mix of shore and non-shore)
const borderTiles: number[] = [];
for (let i = 0; i < 200; i++) {
  borderTiles.push(i);
}

// Simulate which tiles are shores (about 30% of border tiles)
const shoreSet = new Set<number>();
for (let i = 0; i < 200; i++) {
  if (i % 3 === 0) {
    // Every 3rd tile is a shore
    shoreSet.add(i);
  }
}

// Simulate isShore function
function isShore(tile: number): boolean {
  return shoreSet.has(tile);
}

// Simulate manhattanDist function
function manhattanDist(a: number, b: number): number {
  return Math.abs(a - b);
}

// OLD IMPLEMENTATION (before optimization)
function closestShoreFromPlayer_OLD(
  borderTiles: number[],
  target: number,
): number | null {
  // This is what happened before: Array + filter + reduce
  const shoreTiles = borderTiles.filter((t) => isShore(t));
  if (shoreTiles.length === 0) {
    return null;
  }

  return shoreTiles.reduce((closest, current) => {
    const closestDistance = manhattanDist(target, closest);
    const currentDistance = manhattanDist(target, current);
    return currentDistance < closestDistance ? current : closest;
  });
}

// NEW IMPLEMENTATION (with caching)
let cachedShoreTiles: number[] | null = null;

function getShoreTiles(): readonly number[] {
  cachedShoreTiles ??= borderTiles.filter((t) => isShore(t));
  return cachedShoreTiles;
}

function closestShoreFromPlayer_NEW(target: number): number | null {
  const shoreTiles = getShoreTiles();
  if (shoreTiles.length === 0) {
    return null;
  }

  return shoreTiles.reduce((closest, current) => {
    const closestDistance = manhattanDist(target, closest);
    const currentDistance = manhattanDist(target, current);
    return currentDistance < closestDistance ? current : closest;
  });
}

console.log("\n========================================");
console.log("Shore Tile Caching - Microbenchmark");
console.log("========================================\n");
console.log("Scenario:");
console.log("  - Player has 200 border tiles");
console.log("  - 66 of them are shore tiles (~33%)");
console.log(
  "  - Transport pathfinding calls closestShoreFromPlayer frequently",
);
console.log("\n");

console.log("OLD Implementation (no caching):");
console.log("  1. Filter borderTiles for shores: O(200)");
console.log("  2. Reduce to find closest: O(66)");
console.log("  Total: ~266 operations per call");
console.log("\nNEW Implementation (with caching):");
console.log("  1. Return cached shore tiles: O(1)");
console.log("  2. Reduce to find closest: O(66)");
console.log("  Total: ~66 operations per call (cached)");
console.log("  Cache rebuild: ~200 operations (only on territory change)");
console.log("\n");

new Benchmark.Suite()
  .add("OLD: No caching (filter every time)", () => {
    closestShoreFromPlayer_OLD(borderTiles, 150);
  })
  .add("NEW: With caching (filter once)", () => {
    closestShoreFromPlayer_NEW(150);
  })
  .add("NEW: Cache rebuild cost", () => {
    cachedShoreTiles = null; // Invalidate
    closestShoreFromPlayer_NEW(150); // Rebuild
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    const oldOps = this[0].hz;
    const newOps = this[1].hz;
    const rebuildOps = this[2].hz;

    console.log("\n========================================");
    console.log("Results");
    console.log("========================================\n");
    console.log(`OLD (no cache):     ${oldOps.toLocaleString()} ops/sec`);
    console.log(`NEW (cached):       ${newOps.toLocaleString()} ops/sec`);
    console.log(`NEW (rebuild):      ${rebuildOps.toLocaleString()} ops/sec`);
    console.log("\n");
    console.log(`Speedup (cached):   ${(newOps / oldOps).toFixed(2)}x faster`);
    console.log(
      `Time saved:         ${((1 - oldOps / newOps) * 100).toFixed(1)}% less time per call`,
    );
    console.log("\n");
    console.log("Real-world impact:");
    console.log(`  - Transport ships created per game: ~100-1000`);
    console.log(`  - Pathfinding lookups per ship: ~10-100`);
    console.log(`  - Total lookups saved: thousands per game`);
    console.log(`  - Territory changes (cache invalidations): ~10-50 per game`);
    console.log("\n");
    console.log(`In a typical game with 500 transport lookups:`);
    const oldTime = (500 / oldOps) * 1000;
    const newTime = (500 / newOps) * 1000 + (25 / rebuildOps) * 1000;
    console.log(`  - OLD: ${oldTime.toFixed(2)}ms total`);
    console.log(`  - NEW: ${newTime.toFixed(2)}ms total (with 25 rebuilds)`);
    console.log(
      `  - Saved: ${(oldTime - newTime).toFixed(2)}ms (${((1 - newTime / oldTime) * 100).toFixed(1)}%)`,
    );
    console.log("\n========================================");
  })
  .run({ async: true });
