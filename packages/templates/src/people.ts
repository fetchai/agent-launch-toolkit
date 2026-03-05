/**
 * people.ts — Org Chart to Agent Swarm Generator
 *
 * Transform any organization into a coordinated AI agent swarm.
 * C-levels become infrastructure agents. Department heads become specialists.
 * Teams become service agents. Everyone's expertise scales 24/7.
 *
 * Usage:
 *   import { generateSwarmFromOrg, OrgChart, EXAMPLE_ORGS } from "agentlaunch-templates";
 *
 *   // Quick start with a preset org
 *   const startup = generateSwarmFromOrg(EXAMPLE_ORGS.startup);
 *   const enterprise = generateSwarmFromOrg(EXAMPLE_ORGS.enterprise);
 *
 *   // Or define your own
 *   const myOrg: OrgChart = {
 *     name: "Acme Corp",
 *     cSuite: [
 *       { role: "ceo", name: "Jane Smith", title: "CEO" },
 *       { role: "cto", name: "Bob Lee", title: "CTO" },
 *     ],
 *     departments: [
 *       { name: "Engineering", head: "Alice", services: ["code_review", "debug", "architecture"] },
 *     ],
 *   };
 *   const swarm = generateSwarmFromOrg(myOrg);
 */

import { Preset, getPreset } from "./presets.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** C-Suite role identifiers */
export type CSuiteRole = "ceo" | "cto" | "cfo" | "coo" | "cro";

/** A single executive in the C-Suite */
export interface Executive {
  role: CSuiteRole;
  name: string;
  title?: string;
  quote?: string;
}

/** A department with a head and services */
export interface Department {
  name: string;
  head?: string;
  headTitle?: string;
  services: string[];
  pricePerCall?: number; // FET per service call
  intervalSeconds?: number;
}

/** A team within a department (optional granularity) */
export interface Team {
  name: string;
  department: string;
  lead?: string;
  services: string[];
  pricePerCall?: number;
}

/** Full org chart definition */
export interface OrgChart {
  name: string;
  symbol?: string; // Token prefix, e.g., "ACME" → $ACME-CEO
  cSuite: Executive[];
  departments?: Department[];
  teams?: Team[];
}

/** Generated agent configuration */
export interface SwarmAgent {
  name: string;
  displayName: string;
  symbol: string;
  role: string;
  description: string;
  namedAfter: string;
  title: string;
  tier: "c-suite" | "department" | "team";
  services: Record<string, number>; // service -> price in atestfet
  intervalSeconds: number;
  dependencies: string[];
  crossHoldings: string[];
  variables: Record<string, string>;
}

/** Complete swarm configuration */
export interface SwarmConfig {
  orgName: string;
  totalAgents: number;
  totalDeployCost: number; // FET
  deploymentWaves: {
    wave: number;
    agents: string[];
    parallel: boolean;
  }[];
  agents: SwarmAgent[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// 1 FET = 10^18 atestfet
const FET = 1_000_000_000_000_000_000n;
const toAtestfet = (fet: number): number => Number(BigInt(Math.floor(fet * 100)) * (FET / 100n));

/** Default pricing by tier */
const DEFAULT_PRICING = {
  "c-suite": 0.02, // FET per query
  department: 0.01,
  team: 0.005,
};

/** C-Suite agent definitions */
const C_SUITE_CONFIGS: Record<CSuiteRole, Omit<SwarmAgent, "namedAfter" | "title" | "symbol">> = {
  ceo: {
    name: "ceo",
    displayName: "The CEO",
    role: "ceo",
    description: "Routes all queries, earns on every interaction, coordinates the entire organization",
    tier: "c-suite",
    services: {
      route_query: toAtestfet(0.02),
      org_status: toAtestfet(0.01),
      stakeholder_comms: toAtestfet(0.02),
    },
    intervalSeconds: 300,
    dependencies: ["cto", "cfo"],
    crossHoldings: ["cto", "cfo", "coo"],
    variables: {
      role: "ceo",
      service_price_afet: String(toAtestfet(0.02)),
      interval_seconds: "300",
    },
  },
  cto: {
    name: "cto",
    displayName: "The CTO",
    role: "cto",
    description: "Shared reasoning layer — every agent pays for technical thinking",
    tier: "c-suite",
    services: {
      reason: toAtestfet(0.05),
      architecture_review: toAtestfet(0.05),
      debug: toAtestfet(0.05),
    },
    intervalSeconds: 300,
    dependencies: [],
    crossHoldings: [], // CTO is the dependency, doesn't hold others
    variables: {
      role: "cto",
      service_price_afet: String(toAtestfet(0.05)),
      interval_seconds: "300",
    },
  },
  cfo: {
    name: "cfo",
    displayName: "The CFO",
    role: "cfo",
    description: "Treasury monitoring, revenue tracking, financial alerts across all agents",
    tier: "c-suite",
    services: {
      treasury_report: toAtestfet(0.02),
      anomaly_alert: toAtestfet(0.01),
      revenue_tracker: toAtestfet(0.01),
    },
    intervalSeconds: 300,
    dependencies: [],
    crossHoldings: ["cto"],
    variables: {
      role: "cfo",
      service_price_afet: String(toAtestfet(0.02)),
      interval_seconds: "300",
    },
  },
  coo: {
    name: "coo",
    displayName: "The COO",
    role: "coo",
    description: "24/7 operations monitoring, incident alerts, quality control",
    tier: "c-suite",
    services: {
      system_status: toAtestfet(0.01),
      incident_alert: toAtestfet(0.02),
      quality_report: toAtestfet(0.02),
    },
    intervalSeconds: 60,
    dependencies: [],
    crossHoldings: ["ceo", "cto", "cfo"],
    variables: {
      role: "coo",
      service_price_afet: String(toAtestfet(0.02)),
      interval_seconds: "60",
    },
  },
  cro: {
    name: "cro",
    displayName: "The CRO",
    role: "cro",
    description: "Chief Recruitment Officer — scouts agents, expands the swarm, builds cross-swarm partnerships",
    tier: "c-suite",
    services: {
      scout_agents: toAtestfet(0.05),      // Discover agents on Agentverse
      generate_spec: toAtestfet(0.50),      // Create new agent specifications
      onboard_agent: toAtestfet(0.10),      // Integrate agent into swarm
      partnership_proposal: toAtestfet(0.20), // Propose cross-swarm partnership
      team_status: toAtestfet(0.02),        // Report on swarm growth
    },
    intervalSeconds: 86400,
    dependencies: ["cto"],
    crossHoldings: ["cto", "ceo"],
    variables: {
      role: "cro",
      service_price_afet: String(toAtestfet(0.05)),
      interval_seconds: "86400",
    },
  },
};

// ---------------------------------------------------------------------------
// Example Org Charts
// ---------------------------------------------------------------------------

export const EXAMPLE_ORGS: Record<string, OrgChart> = {
  /** Minimal startup — just founders */
  startup: {
    name: "Startup",
    symbol: "START",
    cSuite: [
      { role: "ceo", name: "Founder", title: "CEO / Founder" },
      { role: "cto", name: "Technical Co-founder", title: "CTO" },
    ],
    departments: [
      {
        name: "Product",
        services: ["roadmap", "user_research", "prioritize"],
        pricePerCall: 0.01,
      },
    ],
  },

  /** Small team — 5 C-levels + 3 departments */
  smb: {
    name: "SMB",
    symbol: "SMB",
    cSuite: [
      { role: "ceo", name: "CEO", title: "Chief Executive Officer" },
      { role: "cto", name: "CTO", title: "Chief Technology Officer" },
      { role: "cfo", name: "CFO", title: "Chief Financial Officer" },
    ],
    departments: [
      {
        name: "Engineering",
        head: "Engineering Lead",
        services: ["code_review", "debug", "deploy"],
        pricePerCall: 0.01,
      },
      {
        name: "Sales",
        head: "Sales Lead",
        services: ["prospect", "qualify", "close"],
        pricePerCall: 0.01,
      },
      {
        name: "Support",
        head: "Support Lead",
        services: ["ticket", "escalate", "knowledge_base"],
        pricePerCall: 0.005,
      },
    ],
  },

  /** Full C-Suite + departments + teams */
  enterprise: {
    name: "Enterprise",
    symbol: "ENT",
    cSuite: [
      { role: "ceo", name: "CEO", title: "Chief Executive Officer" },
      { role: "cto", name: "CTO", title: "Chief Technology Officer" },
      { role: "cfo", name: "CFO", title: "Chief Financial Officer" },
      { role: "coo", name: "COO", title: "Chief Operating Officer" },
      { role: "cro", name: "CRO", title: "Chief Recruitment Officer" },
    ],
    departments: [
      {
        name: "Engineering",
        head: "VP Engineering",
        services: ["architecture", "code_review", "debug", "deploy"],
        pricePerCall: 0.02,
      },
      {
        name: "Product",
        head: "VP Product",
        services: ["roadmap", "requirements", "prioritize", "launch"],
        pricePerCall: 0.02,
      },
      {
        name: "Sales",
        head: "VP Sales",
        services: ["prospect", "qualify", "negotiate", "close"],
        pricePerCall: 0.02,
      },
      {
        name: "Marketing",
        head: "VP Marketing",
        services: ["content", "campaigns", "analytics", "brand"],
        pricePerCall: 0.01,
      },
      {
        name: "Support",
        head: "VP Support",
        services: ["ticket", "escalate", "knowledge_base", "onboard"],
        pricePerCall: 0.01,
      },
      {
        name: "HR",
        head: "VP HR",
        services: ["recruit", "onboard", "review", "offboard"],
        pricePerCall: 0.01,
      },
    ],
    teams: [
      {
        name: "Frontend",
        department: "Engineering",
        lead: "Frontend Lead",
        services: ["ui_review", "component_audit", "a11y_check"],
        pricePerCall: 0.01,
      },
      {
        name: "Backend",
        department: "Engineering",
        lead: "Backend Lead",
        services: ["api_review", "db_optimize", "security_audit"],
        pricePerCall: 0.01,
      },
      {
        name: "DevOps",
        department: "Engineering",
        lead: "DevOps Lead",
        services: ["deploy", "monitor", "incident_response"],
        pricePerCall: 0.01,
      },
    ],
  },

  /** Marketing team (matches existing presets) */
  marketing: {
    name: "Marketing Team",
    symbol: "MKT",
    cSuite: [
      { role: "ceo", name: "Marketing Director", title: "Director of Marketing" },
    ],
    departments: [
      { name: "Content", services: ["blog_post", "tweet_thread", "newsletter", "ad_copy"], pricePerCall: 0.01 },
      { name: "Social", services: ["post_tweet", "schedule_thread", "reply_mentions"], pricePerCall: 0.005 },
      { name: "Community", services: ["moderate", "answer_faq", "run_poll"], pricePerCall: 0.002 },
      { name: "Analytics", services: ["engagement_report", "audience_insights", "content_performance"], pricePerCall: 0.005 },
      { name: "Outreach", services: ["find_partners", "draft_pitch", "send_email"], pricePerCall: 0.01 },
      { name: "Ads", services: ["create_ad", "ab_test", "campaign_report"], pricePerCall: 0.01 },
      { name: "Strategy", services: ["content_calendar", "brand_audit", "competitor_analysis"], pricePerCall: 0.02 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate a complete swarm configuration from an org chart.
 *
 * @example
 * const config = generateSwarmFromOrg(EXAMPLE_ORGS.enterprise);
 * console.log(`Total agents: ${config.totalAgents}`);
 * console.log(`Deploy cost: ${config.totalDeployCost} FET`);
 */
export function generateSwarmFromOrg(org: OrgChart): SwarmConfig {
  const agents: SwarmAgent[] = [];
  const prefix = org.symbol || org.name.toUpperCase().replace(/\s+/g, "").slice(0, 4);

  // Wave 1: C-Suite (sequential — CTO first)
  const cSuiteOrder: CSuiteRole[] = ["cto", "cfo", "coo", "ceo", "cro"];
  const cSuiteRoles = org.cSuite.map((e) => e.role);

  for (const role of cSuiteOrder) {
    const exec = org.cSuite.find((e) => e.role === role);
    if (!exec) continue;

    const config = C_SUITE_CONFIGS[role];
    agents.push({
      ...config,
      symbol: `${prefix}-${role.toUpperCase()}`,
      namedAfter: exec.name,
      title: exec.title || exec.name,
    });
  }

  // Wave 2: Departments (parallel)
  if (org.departments) {
    for (const dept of org.departments) {
      const slug = dept.name.toLowerCase().replace(/\s+/g, "-");
      const priceAfet = toAtestfet(dept.pricePerCall || DEFAULT_PRICING.department);

      const services: Record<string, number> = {};
      for (const svc of dept.services) {
        services[svc] = priceAfet;
      }

      agents.push({
        name: slug,
        displayName: `${dept.name} Lead`,
        symbol: `${prefix}-${slug.toUpperCase().slice(0, 4)}`,
        role: slug,
        description: `${dept.name} department — ${dept.services.join(", ")}`,
        namedAfter: dept.head || `${dept.name} Team`,
        title: dept.headTitle || `Head of ${dept.name}`,
        tier: "department",
        services,
        intervalSeconds: dept.intervalSeconds || 300,
        dependencies: ["cto"], // All departments use CTO for reasoning
        crossHoldings: ["cto"],
        variables: {
          role: slug,
          service_price_afet: String(priceAfet),
          interval_seconds: String(dept.intervalSeconds || 300),
        },
      });
    }
  }

  // Wave 3: Teams (parallel)
  if (org.teams) {
    for (const team of org.teams) {
      const slug = team.name.toLowerCase().replace(/\s+/g, "-");
      const deptSlug = team.department.toLowerCase().replace(/\s+/g, "-");
      const priceAfet = toAtestfet(team.pricePerCall || DEFAULT_PRICING.team);

      const services: Record<string, number> = {};
      for (const svc of team.services) {
        services[svc] = priceAfet;
      }

      agents.push({
        name: slug,
        displayName: `${team.name} Team`,
        symbol: `${prefix}-${slug.toUpperCase().slice(0, 4)}`,
        role: slug,
        description: `${team.name} team (${team.department}) — ${team.services.join(", ")}`,
        namedAfter: team.lead || `${team.name} Team`,
        title: team.lead || `${team.name} Lead`,
        tier: "team",
        services,
        intervalSeconds: 300,
        dependencies: ["cto", deptSlug],
        crossHoldings: ["cto", deptSlug],
        variables: {
          role: slug,
          service_price_afet: String(priceAfet),
          interval_seconds: "300",
        },
      });
    }
  }

  // Build deployment waves
  const cSuiteAgents = agents.filter((a) => a.tier === "c-suite").map((a) => a.name);
  const deptAgents = agents.filter((a) => a.tier === "department").map((a) => a.name);
  const teamAgents = agents.filter((a) => a.tier === "team").map((a) => a.name);

  const deploymentWaves = [];
  if (cSuiteAgents.length > 0) {
    deploymentWaves.push({ wave: 1, agents: cSuiteAgents, parallel: false });
  }
  if (deptAgents.length > 0) {
    deploymentWaves.push({ wave: 2, agents: deptAgents, parallel: true });
  }
  if (teamAgents.length > 0) {
    deploymentWaves.push({ wave: 3, agents: teamAgents, parallel: true });
  }

  return {
    orgName: org.name,
    totalAgents: agents.length,
    totalDeployCost: agents.length * 120,
    deploymentWaves,
    agents,
  };
}

/**
 * Generate a YAML-style org chart template for users to fill in.
 */
export function generateOrgTemplate(size: "startup" | "smb" | "enterprise" = "smb"): string {
  const templates: Record<string, string> = {
    startup: `# Startup Org Chart
# Fill in your team details, then run: npx agentlaunch swarm-from-org people.yaml

name: "My Startup"
symbol: "ACME"  # Token prefix: $ACME-CEO, $ACME-CTO, etc.

cSuite:
  - role: ceo
    name: "Your Name"
    title: "CEO / Founder"
  - role: cto
    name: "Technical Co-founder"
    title: "CTO"

departments:
  - name: "Product"
    head: "Product Lead"
    services: ["roadmap", "user_research", "prioritize"]
    pricePerCall: 0.01  # FET per service call
`,

    smb: `# SMB Org Chart
# Fill in your team details, then run: npx agentlaunch swarm-from-org people.yaml

name: "My Company"
symbol: "CORP"  # Token prefix: $CORP-CEO, $CORP-CTO, etc.

cSuite:
  - role: ceo
    name: "CEO Name"
    title: "Chief Executive Officer"
  - role: cto
    name: "CTO Name"
    title: "Chief Technology Officer"
  - role: cfo
    name: "CFO Name"
    title: "Chief Financial Officer"

departments:
  - name: "Engineering"
    head: "Engineering Lead"
    services: ["code_review", "debug", "deploy", "architecture"]
    pricePerCall: 0.01

  - name: "Sales"
    head: "Sales Lead"
    services: ["prospect", "qualify", "negotiate", "close"]
    pricePerCall: 0.01

  - name: "Support"
    head: "Support Lead"
    services: ["ticket", "escalate", "knowledge_base"]
    pricePerCall: 0.005
`,

    enterprise: `# Enterprise Org Chart
# Fill in your team details, then run: npx agentlaunch swarm-from-org people.yaml

name: "Enterprise Corp"
symbol: "ENT"  # Token prefix: $ENT-CEO, $ENT-CTO, etc.

cSuite:
  - role: ceo
    name: "CEO Name"
    title: "Chief Executive Officer"
  - role: cto
    name: "CTO Name"
    title: "Chief Technology Officer"
  - role: cfo
    name: "CFO Name"
    title: "Chief Financial Officer"
  - role: coo
    name: "COO Name"
    title: "Chief Operating Officer"
  - role: cro
    name: "CRO Name"
    title: "Chief Recruitment Officer"

departments:
  - name: "Engineering"
    head: "VP Engineering"
    services: ["architecture", "code_review", "debug", "deploy"]
    pricePerCall: 0.02

  - name: "Product"
    head: "VP Product"
    services: ["roadmap", "requirements", "prioritize", "launch"]
    pricePerCall: 0.02

  - name: "Sales"
    head: "VP Sales"
    services: ["prospect", "qualify", "negotiate", "close"]
    pricePerCall: 0.02

  - name: "Marketing"
    head: "VP Marketing"
    services: ["content", "campaigns", "analytics", "brand"]
    pricePerCall: 0.01

  - name: "Support"
    head: "VP Support"
    services: ["ticket", "escalate", "knowledge_base", "onboard"]
    pricePerCall: 0.01

  - name: "HR"
    head: "VP HR"
    services: ["recruit", "onboard", "review", "offboard"]
    pricePerCall: 0.01

teams:
  - name: "Frontend"
    department: "Engineering"
    lead: "Frontend Lead"
    services: ["ui_review", "component_audit", "a11y_check"]
    pricePerCall: 0.01

  - name: "Backend"
    department: "Engineering"
    lead: "Backend Lead"
    services: ["api_review", "db_optimize", "security_audit"]
    pricePerCall: 0.01

  - name: "DevOps"
    department: "Engineering"
    lead: "DevOps Lead"
    services: ["deploy", "monitor", "incident_response"]
    pricePerCall: 0.01
`,
  };

  return templates[size] || templates.smb;
}

/**
 * Convert a SwarmConfig to a summary string.
 */
export function summarizeSwarm(config: SwarmConfig): string {
  const lines: string[] = [
    `# ${config.orgName} Agent Swarm`,
    ``,
    `**Total Agents:** ${config.totalAgents}`,
    `**Deploy Cost:** ${config.totalDeployCost} FET`,
    ``,
    `## Deployment Waves`,
    ``,
  ];

  for (const wave of config.deploymentWaves) {
    const mode = wave.parallel ? "(parallel)" : "(sequential)";
    lines.push(`### Wave ${wave.wave} ${mode}`);
    for (const agent of wave.agents) {
      const a = config.agents.find((x) => x.name === agent)!;
      lines.push(`- **${a.displayName}** ($${a.symbol}) — ${a.namedAfter}`);
    }
    lines.push(``);
  }

  lines.push(`## Cross-Holdings`);
  lines.push(``);
  for (const agent of config.agents) {
    if (agent.crossHoldings.length > 0) {
      lines.push(`- ${agent.displayName} holds: ${agent.crossHoldings.map((h) => `$${h.toUpperCase()}`).join(", ")}`);
    }
  }

  return lines.join("\n");
}
