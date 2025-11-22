# OpenFront Feature Ideas

This document contains feature proposals for OpenFront.io, organized by AI model that generated them.

---

## Features by Claude Sonnet 4.5

### 1. Alliance Extension Negotiation System

**What**: Allow allies to request extending alliance duration before it expires (already has infrastructure - `AllianceExtensionIntent`)

**Why**: Currently alliances have fixed durations. This would add diplomatic depth by allowing allies to prolong beneficial relationships

**Implementation**:

- Add notification when alliance is about 30s from expiring
- Add radial menu option to request extension
- Both parties must agree to extend (similar to initial alliance request flow)
- Extend by configurable duration (30s, 1min, 2min)

**Files**: `AllianceImpl.ts`, `PlayerImpl.ts`, `RadialMenuElements.ts`, `EventsDisplay.ts`

---

### 2. Defensive Pact System (Multi-Player Alliance Defense)

**What**: Allow allies to automatically counter-attack when their ally is attacked

**Why**: Adds strategic depth - attacking an allied player becomes riskier, encouraging more careful diplomacy

**Implementation**:

- Add "Defensive Pact" option when allied (toggle on/off)
- When ally with pact is attacked, send auto-attack from pact partner's nearby territories
- Add visual indicator (new icon) showing which players have defensive pacts
- Stats tracking for pact activations

**Files**: `AttackExecution.ts`, `PlayerImpl.ts`, `PlayerIcons.ts`, `GameUpdates.ts`

---

### 3. Territory Trading/Gifting System

**What**: Allow players to gift/trade individual tiles to allies

**Why**: Enables strategic territory exchanges, helps weaker allies, creates new diplomatic options

**Implementation**:

- Add "Gift Territory" option in radial menu for tiles you own
- Recipient must accept (prevent griefing)
- Transfer tile ownership and any structures
- Cooldown to prevent spam
- Stats tracking for territories gifted/received

**Files**: `PlayerImpl.ts`, `RadialMenuElements.ts`, `GameUpdates.ts`, new `TerritoryGiftExecution.ts`

---

### 4. Smart Bot Difficulty Modes (Enhanced AI)

**What**: Implement distinct bot personalities/strategies beyond current difficulty levels

**Why**: Current bots are "FakeHuman" with basic behavior. This would make singleplayer more varied and interesting

**Implementation**:

- "Aggressive" - prioritizes attacks, builds nukes early
- "Economic" - focuses on cities/gold, trades actively
- "Defensive" - builds lots of defenses, rarely attacks
- "Opportunistic" - targets weak players, avoids strong ones
- Each personality affects decision weights in `FakeHumanExecution.ts`

**Files**: `FakeHumanExecution.ts`, `Schemas.ts`, `SinglePlayerModal.ts`, `GameConfig`

---

### 5. Resource Lending System (Gold/Troop Loans)

**What**: Allow players to lend resources with automatic repayment over time

**Why**: Adds economic depth - stronger players can invest in weaker allies expecting returns

**Implementation**:

- New "Lend Gold/Troops" option (separate from donate)
- Specify loan amount and repayment rate (% per 30s)
- Auto-deduct from borrower's income until repaid
- Track outstanding loans in player panel
- Defaulting on loan triggers embargo or betrayal penalty
- Both parties see loan status and remaining balance

**Files**: `PlayerImpl.ts`, `PlayerExecution.ts`, `RadialMenuElements.ts`, `PlayerPanel.ts`, new `LoanImpl.ts`

---

## Features by GPT-4.5

### 1. Dynamic World Events (Global Modifiers)

**Idea**: Periodic, map-wide events that temporarily change rules: e.g. "Nuclear Winter" (reduced gold income, slower troop regen), "Golden Age" (extra gold from workers), "Ceasefire Storm" (no new attacks for 30 seconds).

**Gameplay impact**: Adds unpredictability and mid-game pivots; players must adapt strategies.

**Implementation sketch**:

- Server-side event scheduler tied to ticks
- New `GameUpdate` type for "world_event_started/ended"
- Client-side banner + icon somewhere near the top bar with a short description and timer

**Files**: `GameImpl.ts`, `GameUpdates.ts`, `StatsModal.ts`/new HUD component, translations in `resources/lang/*.json`

---

### 2. Alliance Reputation & History Panel

**Idea**: Track and surface how trustworthy each player is over the course of a match (and maybe across matches): how many alliances formed, broken, betrayed, average alliance duration, etc.

**Gameplay impact**: Social meta: you can quickly see who's a chronic traitor vs. a reliable ally.

**Implementation sketch**:

- Extend `Stats` to track alliance-related events (requests, accept, break, betray)
- New tab/section in `player-panel` showing "Reputation" with simple tags (Trustworthy / Unreliable / Backstabber)

**Files**: `Stats.ts`, `StatsImpl.ts`, `PlayerImpl.ts`, `player-panel` UI

---

### 3. Scenario / Challenge Mode (Curated Mini-Campaigns)

**Idea**: A set of hand-crafted scenarios with special win conditions (e.g. "Survive 10 minutes against 3 bots", "Capture 3 specific capitals") accessible from a new "Scenarios" button.

**Gameplay impact**: Gives solo players structured goals beyond standard FFA; good for learning mechanics.

**Implementation sketch**:

- Add scenario definitions (map, starting positions, custom config, victory conditions)
- New modal in main menu to select scenario and show difficulty + description
- Server checks alternate victory conditions and ends game accordingly

**Files**: New `Scenarios.ts` (config), `SinglePlayerModal.ts` or new `ScenarioModal`, `GameRunner.ts` / `GameImpl.ts`

---

### 4. Advanced Trade Agreements (Recurring Resource Deals)

**Idea**: Instead of only one-off gold/troop donations, allow setting up ongoing trades: "Send 20 gold per tick in exchange for 10 troops per tick for 2 minutes".

**Gameplay impact**: Deepens diplomacy and economy, encourages long-term alliances and specialized roles (economic vs. military).

**Implementation sketch**:

- New "Trade Agreement" intent type with terms (duration, gold/troop flow, direction)
- Server applies adjustments each tick while agreement is active
- Trade summary shown in `player-panel` under a "Trade Agreements" sub-section

**Files**: `Schemas.ts` (new intent), `PlayerImpl.ts`, `PlayerExecution.ts`, `player-panel`

---

### 5. Nuke Doctrine System (Configurable Nuclear Policies)

**Idea**: Each player can choose a doctrine that changes how nukes behave for them: e.g. "Precision Strikes" (smaller radius, less collateral, less traitor penalty), "Total War" (larger radius, more fallout, harsher diplomatic penalties), "Defensive Deterrent" (discounted SAMs, more cost for nukes).

**Gameplay impact**: Adds asymmetry and meaningful pre-commitment to playstyle; nukes become more than just "build or don't build".

**Implementation sketch**:

- New per-player doctrine enum set pre-game or early-game via settings/radial menu
- Doctrines feed into `NukeExecution` config: radius, death factors, alliance-breaking penalties
- UI: small doctrine icon in `player-panel` + description tooltip

**Files**: `GameConfig` / `PlayerInfo`, `NukeExecution.ts`, `PlayerImpl.ts`, `player-panel`, translations

---

## Features by GPT Codex

### 1. Strategic Weather System

Add regional weather effects (storms weaken boats, fog reduces vision, heatwaves slow troop regen) cycling across the map. It forces players to adapt troop movements and attack timing based on rotating environmental modifiers.

**Implementation**:

- Weather zones that move across map tiles
- Each weather type modifies game mechanics (movement speed, attack damage, visibility)
- Visual overlay showing weather patterns
- Weather prediction system (1-2 minutes ahead)

---

### 2. Command Queue & Macro Orders

Let players queue multiple actions—e.g., "build city, then immediately upgrade to port, then auto-send boat attack if enemy nearby." A small command queue UI would reduce micromanagement and reward planning.

**Implementation**:

- Command queue data structure per player
- UI panel showing queued commands with drag-to-reorder
- Conditional execution support (if/then logic)
- Auto-execute queue items when conditions met

---

### 3. Espionage & Intel Network

Introduce spy units or intel stations that reveal enemy troop counts or queued builds for a limited time. Players could invest gold in "recon missions" that target a specific enemy tile, revealing hidden info.

**Implementation**:

- New unit type: Spy or Intel Station
- Temporary fog-of-war removal for target area
- Enemy intel panel showing revealed information
- Counter-intelligence options to detect/block spies

---

### 4. War Weariness Economy

A long-running war incurs penalties (reduced worker output, slower troop regen), while peace time slowly removes them. This pushes players to think about pacing wars and signing temporary truces to reset penalties.

**Implementation**:

- War weariness meter per player
- Increases based on active attacks and casualties
- Decreases during peace periods
- Modifies gold income and troop regeneration rates
- Visual indicator in player stats

---

### 5. Prestige Goals / Triumph Cards

Random "side objectives" (hold three ports simultaneously, donate 1000 gold, capture a capital without nukes). Completing one grants a small but permanent perk for the match (faster boat speed, cheaper upgrades). Adds variety and mid-game incentives beyond simply expanding.

**Implementation**:

- Pool of possible triumph objectives
- Each player gets 2-3 random objectives at game start
- Progress tracking UI
- Reward system with stackable perks
- Achievement-style notifications when completed

---

## Contributing

These are brainstorming ideas. Before implementing any feature:

1. Open an issue for discussion
2. Get maintainer approval
3. Break down into implementable tasks
4. Consider backward compatibility and testing requirements
