import { deployAgent, resolveApiKey, setSecret } from 'agentlaunch-sdk';
import { generateFromTemplate } from 'agentlaunch-templates';

// ---------------------------------------------------------------------------
// Marketing Team preset definitions (expected interface from agentlaunch-templates)
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
  writer: {
    name: 'writer',
    displayName: 'Writer',
    symbol: 'WRITE',
    description: 'Content creator — blog posts, tweet threads, newsletters, ad copy',
    role: 'writer',
    pricing: { 'blog-post': 10_000_000_000_000_000 }, // 0.01 FET
    intervalSeconds: 300,
    dependencies: [],
    secrets: ['AGENTVERSE_API_KEY', 'ASI1_API_KEY'],
    variables: { service_type: 'writer' },
  },
  social: {
    name: 'social',
    displayName: 'Social',
    symbol: 'POST',
    description: 'Social media manager — Twitter/X posting, scheduling, replies',
    role: 'social',
    pricing: { 'post-tweet': 5_000_000_000_000_000 }, // 0.005 FET
    intervalSeconds: 300,
    dependencies: ['writer'],
    secrets: ['AGENTVERSE_API_KEY', 'TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET', 'WRITER_ADDRESS'],
    variables: { service_type: 'social' },
  },
  community: {
    name: 'community',
    displayName: 'Community',
    symbol: 'COMM',
    description: 'Community manager — Telegram moderation, FAQs, welcome messages',
    role: 'community',
    pricing: { 'moderate': 2_000_000_000_000_000 }, // 0.002 FET
    intervalSeconds: 60,
    dependencies: [],
    secrets: ['AGENTVERSE_API_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
    variables: { service_type: 'community' },
  },
  analytics: {
    name: 'analytics',
    displayName: 'Analytics',
    symbol: 'STATS',
    description: 'Analytics engine — engagement reports, audience insights, trends',
    role: 'analytics',
    pricing: { 'engagement-report': 5_000_000_000_000_000 }, // 0.005 FET
    intervalSeconds: 300,
    dependencies: [],
    secrets: ['AGENTVERSE_API_KEY', 'TWITTER_BEARER_TOKEN'],
    variables: { service_type: 'analytics' },
  },
  outreach: {
    name: 'outreach',
    displayName: 'Outreach',
    symbol: 'REACH',
    description: 'Partnership outreach — find partners, draft pitches, send emails',
    role: 'outreach',
    pricing: { 'draft-pitch': 10_000_000_000_000_000 }, // 0.01 FET
    intervalSeconds: 300,
    dependencies: ['writer', 'analytics'],
    secrets: ['AGENTVERSE_API_KEY', 'RESEND_API_KEY', 'ASI1_API_KEY', 'WRITER_ADDRESS'],
    variables: { service_type: 'outreach' },
  },
  ads: {
    name: 'ads',
    displayName: 'Ads',
    symbol: 'ADS',
    description: 'Ad manager — ad copy, A/B tests, budget optimization',
    role: 'ads',
    pricing: { 'create-ad': 10_000_000_000_000_000 }, // 0.01 FET
    intervalSeconds: 300,
    dependencies: ['writer', 'analytics'],
    secrets: ['AGENTVERSE_API_KEY', 'ASI1_API_KEY', 'WRITER_ADDRESS', 'ANALYTICS_ADDRESS'],
    variables: { service_type: 'ads' },
  },
  strategy: {
    name: 'strategy',
    displayName: 'Strategy',
    symbol: 'PLAN',
    description: 'Campaign strategist — content calendar, brand audit, coordinates all agents',
    role: 'strategy',
    pricing: { 'campaign-plan': 20_000_000_000_000_000 }, // 0.02 FET
    intervalSeconds: 300,
    dependencies: ['writer', 'social', 'community', 'analytics', 'outreach', 'ads'],
    secrets: ['AGENTVERSE_API_KEY', 'ASI1_API_KEY', 'WRITER_ADDRESS', 'SOCIAL_ADDRESS', 'COMMUNITY_ADDRESS', 'ANALYTICS_ADDRESS', 'OUTREACH_ADDRESS', 'ADS_ADDRESS'],
    variables: { service_type: 'strategy' },
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
 * Deploy a complete agent swarm. Scaffolds each agent from its preset,
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

      // Scaffold agent code from swarm-starter template (or custom fallback)
      let agentCode: string;
      try {
        const generated = generateFromTemplate('swarm-starter', {
          agent_name: agentName,
          description: preset.description,
          ...preset.variables,
        });
        agentCode = generated.code;
      } catch {
        // swarm-starter template not available yet — use custom template
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
