import Benchmark from "benchmark";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Game, PlayerType } from "../../src/core/game/Game";
import {
  bestShoreDeploymentSource,
  candidateShoreTiles,
  closestShoreFromPlayer,
  targetTransportTile,
} from "../../src/core/game/TransportShipUtils";
import { PathFinder } from "../../src/core/pathfinding/PathFinding";
import { playerInfo, setup } from "../util/Setup";

// Create a game with actual players for more realistic testing
const game = await setup(
  "half_land_half_ocean",
  {},
  [
    playerInfo("TestPlayer1", PlayerType.Human),
    playerInfo("TestPlayer2", PlayerType.Human),
  ],
  dirname(fileURLToPath(import.meta.url)),
);

// Helper function to find players with shore access
function findShorePlayer(game: Game): any {
  for (const player of game.players()) {
    const borderTiles = Array.from(player.borderTiles()).filter((t) =>
      game.isShore(t),
    );
    if (borderTiles.length > 0) {
      return player;
    }
  }
  return null;
}

// Setup: Create test scenarios with different distances
// Using ocean_and_land map coordinates
const mapWidth = game.width();
const mapHeight = game.height();

const scenarios = [
  {
    name: "Short distance (adjacent regions)",
    src: game.ref(Math.floor(mapWidth * 0.25), Math.floor(mapHeight * 0.5)),
    dst: game.ref(Math.floor(mapWidth * 0.35), Math.floor(mapHeight * 0.5)),
  },
  {
    name: "Medium distance (quarter map)",
    src: game.ref(Math.floor(mapWidth * 0.2), Math.floor(mapHeight * 0.3)),
    dst: game.ref(Math.floor(mapWidth * 0.5), Math.floor(mapHeight * 0.3)),
  },
  {
    name: "Long distance (half map)",
    src: game.ref(Math.floor(mapWidth * 0.1), Math.floor(mapHeight * 0.5)),
    dst: game.ref(Math.floor(mapWidth * 0.7), Math.floor(mapHeight * 0.5)),
  },
  {
    name: "Very long distance (diagonal across map)",
    src: game.ref(Math.floor(mapWidth * 0.1), Math.floor(mapHeight * 0.1)),
    dst: game.ref(Math.floor(mapWidth * 0.9), Math.floor(mapHeight * 0.9)),
  },
];

// Create a dummy player for testing player-based functions
const testPlayer = game.players()[0] || findShorePlayer(game);

console.log("\n========================================");
console.log("Transport Pathfinding Performance Tests");
console.log("========================================\n");
console.log("Map:", "half_land_half_ocean");
console.log("Map size:", `${mapWidth}x${mapHeight}`);
console.log("Test player:", testPlayer?.name() || "N/A");
console.log(
  "Player shore tiles:",
  testPlayer
    ? Array.from(testPlayer.borderTiles()).filter((t) => game.isShore(t)).length
    : 0,
);
console.log("\n");

// Manual timing breakdown for the full transport initialization
console.log("Detailed Timing Breakdown (single execution)");
console.log("---------------------------------------------");
if (testPlayer) {
  const testDst = scenarios[2].dst; // Use long distance scenario

  const t0 = performance.now();
  const dst = targetTransportTile(game, testDst);
  const t1 = performance.now();
  const src = dst ? closestShoreFromPlayer(game, testPlayer, dst) : null;
  const t2 = performance.now();
  let pathComputed = false;
  if (src && dst) {
    const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
    const pathResult = pathfinder.nextTile(src, dst);
    pathComputed = pathResult.type !== undefined;
  }
  const t3 = performance.now();

  console.log(`  targetTransportTile:       ${(t1 - t0).toFixed(3)}ms`);
  console.log(`  closestShoreFromPlayer:    ${(t2 - t1).toFixed(3)}ms`);
  console.log(`  PathFinder.Mini.nextTile:  ${(t3 - t2).toFixed(3)}ms`);
  console.log(`  Total:                     ${(t3 - t0).toFixed(3)}ms`);
  console.log(
    `  Result: src=${src}, dst=${dst}, path=${pathComputed ? "computed" : "null"}`,
  );
} else {
  console.log("  No test player available - skipping detailed timing");
}
console.log("\n");

// Test 1: Basic PathFinder.Mini performance (full computation)
console.log("Test 1: PathFinder.Mini (water pathfinding)");
console.log("-------------------------------------------");
new Benchmark.Suite()
  .add("Short distance pathfinding", () => {
    const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
    pathfinder.nextTile(scenarios[0].src, scenarios[0].dst);
  })
  .add("Medium distance pathfinding", () => {
    const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
    pathfinder.nextTile(scenarios[1].src, scenarios[1].dst);
  })
  .add("Long distance pathfinding", () => {
    const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
    pathfinder.nextTile(scenarios[2].src, scenarios[2].dst);
  })
  .add("Very long distance pathfinding", () => {
    const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
    pathfinder.nextTile(scenarios[3].src, scenarios[3].dst);
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("\n");
  })
  .run({ async: true });

// Test 2: targetTransportTile performance
console.log("Test 2: targetTransportTile (finding landing zone)");
console.log("---------------------------------------------------");
new Benchmark.Suite()
  .add("targetTransportTile - Short", () => {
    targetTransportTile(game, scenarios[0].dst);
  })
  .add("targetTransportTile - Medium", () => {
    targetTransportTile(game, scenarios[1].dst);
  })
  .add("targetTransportTile - Long", () => {
    targetTransportTile(game, scenarios[2].dst);
  })
  .add("targetTransportTile - Very long", () => {
    targetTransportTile(game, scenarios[3].dst);
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("\n");
  })
  .run({ async: true });

// Test 3: closestShoreFromPlayer performance
if (testPlayer) {
  console.log("Test 3: closestShoreFromPlayer (finding spawn point)");
  console.log("-----------------------------------------------------");
  new Benchmark.Suite()
    .add("closestShoreFromPlayer - Short", () => {
      closestShoreFromPlayer(game, testPlayer, scenarios[0].dst);
    })
    .add("closestShoreFromPlayer - Medium", () => {
      closestShoreFromPlayer(game, testPlayer, scenarios[1].dst);
    })
    .add("closestShoreFromPlayer - Long", () => {
      closestShoreFromPlayer(game, testPlayer, scenarios[2].dst);
    })
    .add("closestShoreFromPlayer - Very long", () => {
      closestShoreFromPlayer(game, testPlayer, scenarios[3].dst);
    })
    .on("cycle", (event: any) => {
      console.log(String(event.target));
    })
    .on("complete", function (this: any) {
      console.log("\n");
    })
    .run({ async: true });

  // Test 4: candidateShoreTiles performance
  console.log("Test 4: candidateShoreTiles (finding spawn candidates)");
  console.log("--------------------------------------------------------");
  new Benchmark.Suite()
    .add("candidateShoreTiles - Short", () => {
      candidateShoreTiles(game, testPlayer, scenarios[0].dst);
    })
    .add("candidateShoreTiles - Medium", () => {
      candidateShoreTiles(game, testPlayer, scenarios[1].dst);
    })
    .add("candidateShoreTiles - Long", () => {
      candidateShoreTiles(game, testPlayer, scenarios[2].dst);
    })
    .add("candidateShoreTiles - Very long", () => {
      candidateShoreTiles(game, testPlayer, scenarios[3].dst);
    })
    .on("cycle", (event: any) => {
      console.log(String(event.target));
    })
    .on("complete", function (this: any) {
      console.log("\n");
    })
    .run({ async: true });

  // Test 5: bestShoreDeploymentSource (full A* search)
  console.log("Test 5: bestShoreDeploymentSource (optimal spawn with A*)");
  console.log("----------------------------------------------------------");
  new Benchmark.Suite()
    .add("bestShoreDeploymentSource - Short", () => {
      bestShoreDeploymentSource(game, testPlayer, scenarios[0].dst);
    })
    .add("bestShoreDeploymentSource - Medium", () => {
      bestShoreDeploymentSource(game, testPlayer, scenarios[1].dst);
    })
    .add("bestShoreDeploymentSource - Long", () => {
      bestShoreDeploymentSource(game, testPlayer, scenarios[2].dst);
    })
    .add("bestShoreDeploymentSource - Very long", () => {
      bestShoreDeploymentSource(game, testPlayer, scenarios[3].dst);
    })
    .on("cycle", (event: any) => {
      console.log(String(event.target));
    })
    .on("complete", function (this: any) {
      console.log("\n");
    })
    .run({ async: true });
}

// Test 6: Full transport initialization cost simulation
console.log("Test 6: Full transport initialization (combined operations)");
console.log("-----------------------------------------------------------");
new Benchmark.Suite()
  .add("Full transport init - Short", () => {
    const dst = targetTransportTile(game, scenarios[0].dst);
    if (dst && testPlayer) {
      const src = closestShoreFromPlayer(game, testPlayer, dst);
      if (src) {
        const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
        pathfinder.nextTile(src, dst);
      }
    }
  })
  .add("Full transport init - Medium", () => {
    const dst = targetTransportTile(game, scenarios[1].dst);
    if (dst && testPlayer) {
      const src = closestShoreFromPlayer(game, testPlayer, dst);
      if (src) {
        const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
        pathfinder.nextTile(src, dst);
      }
    }
  })
  .add("Full transport init - Long", () => {
    const dst = targetTransportTile(game, scenarios[2].dst);
    if (dst && testPlayer) {
      const src = closestShoreFromPlayer(game, testPlayer, dst);
      if (src) {
        const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
        pathfinder.nextTile(src, dst);
      }
    }
  })
  .add("Full transport init - Very long", () => {
    const dst = targetTransportTile(game, scenarios[3].dst);
    if (dst && testPlayer) {
      const src = closestShoreFromPlayer(game, testPlayer, dst);
      if (src) {
        const pathfinder = PathFinder.Mini(game, 10_000, true, 100);
        pathfinder.nextTile(src, dst);
      }
    }
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("\n========================================");
    console.log("All tests completed!");
    console.log("========================================");
  })
  .run({ async: true });
