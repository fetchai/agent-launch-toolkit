/**
 * presets.ts — Pre-configured Genesis Network agent presets
 *
 * Each preset maps to a specific role in the Genesis swarm: oracle, brain,
 * analyst, coordinator, sentinel, launcher, scout. Presets provide sensible
 * defaults for pricing, intervals, dependencies, and secrets so users can
 * spin up a fully-configured agent with a single command.
 *
 * Usage:
 *   import { getPreset, listPresets } from "agentlaunch-templates";
 *   const oracle = getPreset("oracle");
 *   generateFromTemplate("genesis", { ...oracle.variables, agent_name: "MyOracle" });
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Preset {
  /** Unique slug — e.g. "oracle" */
  name: string;
  /** Display name — e.g. "Oracle ($DATA)" */
  displayName: string;
  /** Token symbol — e.g. "DATA" */
  symbol: string;
  /** One-line description */
  description: string;
  /** Matches the `role` template variable */
  role: string;
  /** Service name -> price in atestfet */
  pricing: Record<string, number>;
  /** Background task interval in seconds */
  intervalSeconds: number;
  /** Agent roles this preset consumes (dependencies) */
  dependencies: string[];
  /** Extra secrets needed beyond the base set */
  secrets: string[];
  /** Template variable overrides (merged with user-supplied variables) */
  variables: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

// 1 FET = 1_000_000_000_000_000_000 atestfet (10^18)
// Price shortcuts:
//   0.001  FET = 1_000_000_000_000_000
//   0.0005 FET =   500_000_000_000_000
//   0.002  FET = 2_000_000_000_000_000
//   0.005  FET = 5_000_000_000_000_000
//   0.01   FET = 10_000_000_000_000_000
//   0.02   FET = 20_000_000_000_000_000

const PRESETS: Preset[] = [
  {
    name: "oracle",
    displayName: "Oracle ($DATA)",
    symbol: "DATA",
    description:
      "Market data provider — price feeds, OHLC history, and market summaries for the swarm",
    role: "oracle",
    pricing: {
      price_feed: 1_000_000_000_000_000,       // 0.001 FET
      ohlc_history: 1_000_000_000_000_000,      // 0.001 FET
      market_summary: 1_000_000_000_000_000,    // 0.001 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: [],
    variables: {
      role: "oracle",
      description: "Market data oracle — price feeds, OHLC history, and market summaries",
      service_price_afet: "1000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "brain",
    displayName: "Brain ($THINK)",
    symbol: "THINK",
    description:
      "LLM reasoning engine — query classification, summarization, and deep analysis",
    role: "brain",
    pricing: {
      reason: 10_000_000_000_000_000,           // 0.01 FET
      classify: 10_000_000_000_000_000,          // 0.01 FET
      summarize: 10_000_000_000_000_000,         // 0.01 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["HF_TOKEN"],
    variables: {
      role: "brain",
      description: "LLM reasoning engine — query classification, summarization, and deep analysis",
      service_price_afet: "10000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "analyst",
    displayName: "Analyst ($SCORE)",
    symbol: "SCORE",
    description:
      "Token scoring engine — quality evaluation, risk assessment, and ranking",
    role: "analyst",
    pricing: {
      score_token: 5_000_000_000_000_000,       // 0.005 FET
      evaluate_quality: 5_000_000_000_000_000,   // 0.005 FET
      rank_tokens: 5_000_000_000_000_000,        // 0.005 FET
    },
    intervalSeconds: 300,
    dependencies: ["oracle"],
    secrets: [],
    variables: {
      role: "analyst",
      description: "Token scoring engine — quality evaluation, risk assessment, and ranking",
      service_price_afet: "5000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "coordinator",
    displayName: "Coordinator ($ROUTE)",
    symbol: "ROUTE",
    description:
      "Query router — discovers agents, routes queries to the right specialist",
    role: "coordinator",
    pricing: {
      route_query: 500_000_000_000_000,          // 0.0005 FET
      discover_agents: 500_000_000_000_000,      // 0.0005 FET
    },
    intervalSeconds: 300,
    dependencies: ["oracle", "brain"],
    secrets: [],
    variables: {
      role: "coordinator",
      description: "Query router — discovers agents, routes queries to the right specialist",
      service_price_afet: "500000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "sentinel",
    displayName: "Sentinel ($ALERT)",
    symbol: "ALERT",
    description:
      "Real-time watchdog — monitors tokens, detects anomalies, sends alerts",
    role: "sentinel",
    pricing: {
      monitor: 2_000_000_000_000_000,            // 0.002 FET
      alert: 2_000_000_000_000_000,              // 0.002 FET
      anomaly_report: 2_000_000_000_000_000,     // 0.002 FET
    },
    intervalSeconds: 60,
    dependencies: ["oracle"],
    secrets: [],
    variables: {
      role: "sentinel",
      description: "Real-time watchdog — monitors tokens, detects anomalies, sends alerts",
      service_price_afet: "2000000000000000",
      interval_seconds: "60",
    },
  },
  {
    name: "launcher",
    displayName: "Launcher ($LAUNCH)",
    symbol: "LAUNCH",
    description:
      "Gap finder — discovers unmet needs, scaffolds new agents, recommends deployments",
    role: "launcher",
    pricing: {
      find_gap: 20_000_000_000_000_000,          // 0.02 FET
      scaffold_agent: 20_000_000_000_000_000,    // 0.02 FET
      deploy_recommendation: 20_000_000_000_000_000, // 0.02 FET
    },
    intervalSeconds: 300,
    dependencies: ["analyst", "coordinator"],
    secrets: [],
    variables: {
      role: "launcher",
      description: "Gap finder — discovers unmet needs, scaffolds new agents, recommends deployments",
      service_price_afet: "20000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "scout",
    displayName: "Scout ($FIND)",
    symbol: "FIND",
    description:
      "Agent scout — discovers promising agents, evaluates quality, recommends tokenization",
    role: "scout",
    pricing: {
      discover_agents: 10_000_000_000_000_000,   // 0.01 FET
      evaluate_agent: 10_000_000_000_000_000,    // 0.01 FET
      tokenize_recommendation: 10_000_000_000_000_000, // 0.01 FET
    },
    intervalSeconds: 300,
    dependencies: ["analyst"],
    secrets: [],
    variables: {
      role: "scout",
      description: "Agent scout — discovers promising agents, evaluates quality, recommends tokenization",
      service_price_afet: "10000000000000000",
      interval_seconds: "300",
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a preset by name, or undefined if not found.
 *
 * @example
 * const oracle = getPreset("oracle");
 * if (oracle) {
 *   generateFromTemplate("genesis", { ...oracle.variables, agent_name: "MyOracle" });
 * }
 */
export function getPreset(name: string): Preset | undefined {
  return PRESETS.find((p) => p.name === name);
}

/**
 * Returns a copy of all available presets.
 */
export function listPresets(): Preset[] {
  return [...PRESETS];
}
