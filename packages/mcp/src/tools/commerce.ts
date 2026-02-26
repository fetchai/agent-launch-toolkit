import { deployAgent, resolveApiKey, setSecret } from 'agentlaunch-sdk';
import { generateFromTemplate } from 'agentlaunch-templates';

// ---------------------------------------------------------------------------
// Genesis preset definitions (expected interface from agentlaunch-templates)
// ---------------------------------------------------------------------------

interface Preset {
  name: string;
  displayName: string;
  symbol: string;
  description: string;
  role: string;
  pricing: Record<string, number>;
  intervalSeconds: number;
  dependencies: string[];
  secrets: string[];
  variables: Record<string, string>;
}

// Fallback presets used when agentlaunch-templates doesn't export getPreset yet
const FALLBACK_PRESETS: Record<string, Preset> = {
  oracle: {
    name: 'oracle',
    displayName: 'Oracle',
    symbol: 'ORACLE',
    description: 'Market data provider — prices, volumes, trends',
    role: 'data-provider',
    pricing: { 'market-data': 1_000_000_000_000_000 }, // 0.001 FET
    intervalSeconds: 300,
    dependencies: [],
    secrets: ['AGENTVERSE_API_KEY'],
    variables: { service_type: 'oracle', data_source: 'coingecko' },
  },
  brain: {
    name: 'brain',
    displayName: 'Brain',
    symbol: 'BRAIN',
    description: 'LLM reasoning engine — query understanding, analysis',
    role: 'reasoning',
    pricing: { 'llm-query': 10_000_000_000_000_000 }, // 0.01 FET
    intervalSeconds: 60,
    dependencies: ['oracle'],
    secrets: ['AGENTVERSE_API_KEY', 'OPENAI_API_KEY'],
    variables: { service_type: 'brain', model: 'gpt-4o-mini' },
  },
  analyst: {
    name: 'analyst',
    displayName: 'Analyst',
    symbol: 'ANALYST',
    description: 'Token scoring and evaluation — quality metrics',
    role: 'analysis',
    pricing: { 'token-score': 5_000_000_000_000_000 }, // 0.005 FET
    intervalSeconds: 600,
    dependencies: ['oracle'],
    secrets: ['AGENTVERSE_API_KEY'],
    variables: { service_type: 'analyst', scoring_model: 'weighted' },
  },
  coordinator: {
    name: 'coordinator',
    displayName: 'Coordinator',
    symbol: 'COORD',
    description: 'Query routing and multi-agent orchestration',
    role: 'orchestration',
    pricing: { 'route-query': 500_000_000_000_000 }, // 0.0005 FET
    intervalSeconds: 30,
    dependencies: [],
    secrets: ['AGENTVERSE_API_KEY'],
    variables: { service_type: 'coordinator' },
  },
  sentinel: {
    name: 'sentinel',
    displayName: 'Sentinel',
    symbol: 'SNTL',
    description: 'Real-time monitoring and alerts',
    role: 'monitoring',
    pricing: { 'alert-subscribe': 2_000_000_000_000_000 }, // 0.002 FET
    intervalSeconds: 120,
    dependencies: ['oracle'],
    secrets: ['AGENTVERSE_API_KEY'],
    variables: { service_type: 'sentinel', alert_threshold: '10' },
  },
  launcher: {
    name: 'launcher',
    displayName: 'Launcher',
    symbol: 'LAUNCH',
    description: 'Autonomous agent creation and deployment',
    role: 'reproduction',
    pricing: { 'launch-agent': 20_000_000_000_000_000 }, // 0.02 FET
    intervalSeconds: 3600,
    dependencies: ['analyst', 'coordinator'],
    secrets: ['AGENTVERSE_API_KEY'],
    variables: { service_type: 'launcher' },
  },
  scout: {
    name: 'scout',
    displayName: 'Scout',
    symbol: 'SCOUT',
    description: 'Agent and opportunity discovery',
    role: 'discovery',
    pricing: { 'discover-agents': 10_000_000_000_000_000 }, // 0.01 FET
    intervalSeconds: 1800,
    dependencies: ['coordinator'],
    secrets: ['AGENTVERSE_API_KEY'],
    variables: { service_type: 'scout' },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a preset either from the templates package or from fallback
 * definitions above.
 */
async function resolvePreset(presetName: string): Promise<Preset> {
  try {
    const templates = await import('agentlaunch-templates') as unknown as Record<string, unknown>;
    if (typeof templates.getPreset === 'function') {
      const preset = (templates.getPreset as (name: string) => Preset | null)(presetName);
      if (preset) return preset;
    }
  } catch {
    // templates package doesn't export getPreset yet — fall through
  }

  const fallback = FALLBACK_PRESETS[presetName];
  if (!fallback) {
    throw new Error(
      `Unknown preset: ${presetName}. Valid presets: ${Object.keys(FALLBACK_PRESETS).join(', ')}`,
    );
  }
  return fallback;
}

/**
 * Read commerce-related storage keys from Agentverse agent storage.
 *
 * Agentverse storage API:
 *   GET /v1/hosting/agents/{addr}/storage
 */
async function readCommerceFromStorage(
  address: string,
): Promise<Record<string, unknown>> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'AGENTVERSE_API_KEY is required. Set it in .env or MCP server config.',
    );
  }

  const storageUrl = `https://agentverse.ai/v1/hosting/agents/${address}/storage`;
  const response = await fetch(storageUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to read agent storage for ${address}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as Record<string, string>;

  // Parse known commerce keys from agent storage
  const parse = (key: string): unknown => {
    const raw = data[key];
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  return {
    address,
    revenue: parse('revenue_summary'),
    pricing: parse('pricing_table'),
    effortMode: parse('effort_mode') ?? 'standard',
    totalRevenue: parse('total_revenue') ?? '0',
    totalExpenses: parse('total_expenses') ?? '0',
    balance: parse('last_balance'),
    holdings: parse('cross_holdings'),
    tier: parse('tier_config'),
    gdpContribution: parse('gdp_contribution') ?? '0',
  };
}

// ---------------------------------------------------------------------------
// EXT-04: check_agent_commerce
// ---------------------------------------------------------------------------

/**
 * Check an agent's commerce status: revenue, pricing, balance, effort mode,
 * holdings. Tries SDK first, falls back to direct Agentverse storage read.
 */
export async function checkAgentCommerce(args: {
  address: string;
}): Promise<Record<string, unknown>> {
  if (!args.address || !args.address.trim()) {
    throw new Error('address is required');
  }

  // Try SDK first (may not exist yet)
  try {
    const sdk = await import('agentlaunch-sdk') as unknown as Record<string, unknown>;
    if (typeof sdk.getAgentCommerceStatus === 'function') {
      return await (sdk.getAgentCommerceStatus as (addr: string) => Promise<Record<string, unknown>>)(args.address);
    }
  } catch {
    // SDK doesn't export getAgentCommerceStatus yet — fall through
  }

  // Fallback: read storage directly via Agentverse API
  return await readCommerceFromStorage(args.address);
}

// ---------------------------------------------------------------------------
// EXT-05: network_status
// ---------------------------------------------------------------------------

/**
 * Check the status of an agent swarm: per-agent revenue, total GDP, health,
 * cross-holdings. Tries SDK first, falls back to per-agent storage reads.
 */
export async function networkStatus(args: {
  addresses: string[];
}): Promise<Record<string, unknown>> {
  if (!args.addresses || args.addresses.length === 0) {
    throw new Error('addresses is required and must contain at least one agent address');
  }

  // Try SDK first (may not exist yet)
  try {
    const sdk = await import('agentlaunch-sdk') as unknown as Record<string, unknown>;
    if (typeof sdk.getNetworkGDP === 'function') {
      return await (sdk.getNetworkGDP as (addrs: string[]) => Promise<Record<string, unknown>>)(args.addresses);
    }
  } catch {
    // SDK doesn't export getNetworkGDP yet — fall through
  }

  // Fallback: read each agent's commerce status individually
  const agents: Record<string, unknown>[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;
  let healthyCount = 0;

  for (const addr of args.addresses) {
    try {
      const status = await readCommerceFromStorage(addr);
      agents.push(status);
      totalRevenue += parseInt(String(status.totalRevenue ?? '0'), 10);
      totalExpenses += parseInt(String(status.totalExpenses ?? '0'), 10);
      healthyCount += 1;
    } catch (err) {
      agents.push({
        address: addr,
        error: err instanceof Error ? err.message : String(err),
        healthy: false,
      });
    }
  }

  return {
    agentCount: args.addresses.length,
    healthyCount,
    unhealthyCount: args.addresses.length - healthyCount,
    totalRevenue: String(totalRevenue),
    totalExpenses: String(totalExpenses),
    netGDP: String(totalRevenue - totalExpenses),
    agents,
  };
}

// ---------------------------------------------------------------------------
// EXT-06: deploy_swarm
// ---------------------------------------------------------------------------

interface DeployedAgent {
  name: string;
  preset: string;
  address: string;
  status: string;
  error?: string;
}

/**
 * Deploy a complete agent swarm. Scaffolds each agent from its Genesis preset,
 * deploys to Agentverse in sequence, sets secrets (including peer addresses
 * for discovery), and starts each one.
 */
export async function deploySwarm(args: {
  presets: string[];
  baseName?: string;
  apiKey: string;
}): Promise<Record<string, unknown>> {
  if (!args.presets || args.presets.length === 0) {
    throw new Error('presets is required and must contain at least one preset name');
  }
  if (!args.apiKey) {
    throw new Error('apiKey is required');
  }

  const baseName = args.baseName ?? 'Swarm';
  const deployed: DeployedAgent[] = [];
  const peerAddresses: Record<string, string> = {};

  for (const presetName of args.presets) {
    const agentName = `${baseName}-${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`;

    try {
      // Resolve preset
      const preset = await resolvePreset(presetName);

      // Scaffold agent code from genesis template (or custom fallback)
      let agentCode: string;
      try {
        const generated = generateFromTemplate('genesis', {
          agent_name: agentName,
          description: preset.description,
          ...preset.variables,
        });
        agentCode = generated.code;
      } catch {
        // genesis template not available yet — use custom template
        const generated = generateFromTemplate('custom', {
          agent_name: agentName,
          description: preset.description,
        });
        agentCode = generated.code;
      }

      // Deploy to Agentverse
      const result = await deployAgent({
        apiKey: args.apiKey,
        agentName,
        sourceCode: agentCode,
        secrets: {
          ...peerAddresses,
          AGENTVERSE_API_KEY: args.apiKey,
          AGENTLAUNCH_API_KEY: args.apiKey,
        },
      });

      // Track peer address for subsequent agents
      peerAddresses[`${presetName.toUpperCase()}_ADDRESS`] = result.agentAddress;

      deployed.push({
        name: agentName,
        preset: presetName,
        address: result.agentAddress,
        status: result.status,
      });
    } catch (err) {
      deployed.push({
        name: agentName,
        preset: presetName,
        address: '',
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Set peer addresses on all previously deployed agents so they know about
  // agents deployed after them
  for (const agent of deployed) {
    if (agent.status === 'failed' || !agent.address) continue;

    for (const [key, value] of Object.entries(peerAddresses)) {
      if (value === agent.address) continue; // don't set self
      try {
        await setSecret(args.apiKey, agent.address, key, value);
      } catch {
        // Non-fatal — agent may still discover peers later
      }
    }
  }

  const successful = deployed.filter((a) => a.status !== 'failed');
  const failed = deployed.filter((a) => a.status === 'failed');

  return {
    success: failed.length === 0,
    baseName,
    totalDeployed: successful.length,
    totalFailed: failed.length,
    agents: deployed,
    peerAddresses,
    nextSteps: [
      'Agents are deployed and running on Agentverse',
      'Use check_agent_commerce to monitor each agent\'s commerce status',
      'Use network_status to see overall swarm health',
      'To tokenize agents, use create_and_tokenize for each one',
    ],
  };
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const commerceHandlers = {
  check_agent_commerce: checkAgentCommerce,
  network_status: networkStatus,
  deploy_swarm: deploySwarm,
};
