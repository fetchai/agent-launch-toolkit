/**
 * presets.ts — Pre-configured Marketing Team agent presets
 *
 * Each preset maps to a specific role in the Marketing Team swarm: writer,
 * social, community, analytics, outreach, ads, strategy. Presets provide
 * sensible defaults for pricing, intervals, dependencies, and secrets so
 * users can spin up a fully-configured agent with a single command.
 *
 * Usage:
 *   import { getPreset, listPresets } from "agentlaunch-templates";
 *   const writer = getPreset("writer");
 *   generateFromTemplate("swarm-starter", { ...writer.variables, agent_name: "MyWriter" });
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Preset {
  /** Unique slug — e.g. "writer" */
  name: string;
  /** Display name — e.g. "Writer ($WRITE)" */
  displayName: string;
  /** Token symbol — e.g. "WRITE" */
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
  // -------------------------------------------------------------------------
  // C-Suite Presets (use swarm-starter template) — Infrastructure layer
  // -------------------------------------------------------------------------
  {
    name: "ceo",
    displayName: "CEO ($CEO)",
    symbol: "CEO",
    description: "Routes all queries, earns on every interaction, coordinates the entire organization",
    role: "ceo",
    pricing: {
      route_query: 20_000_000_000_000_000,      // 0.02 FET
      org_status: 10_000_000_000_000_000,        // 0.01 FET
      stakeholder_comms: 20_000_000_000_000_000, // 0.02 FET
    },
    intervalSeconds: 300,
    dependencies: ["cto", "cfo"],
    secrets: ["ASI1_API_KEY", "CTO_ADDRESS", "CFO_ADDRESS"],
    variables: {
      agent_name: "CEO",
      role: "ceo",
      description: "Routes all queries, earns on every interaction, coordinates the entire organization",
      service_price_afet: "20000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "cto",
    displayName: "CTO ($CTO)",
    symbol: "CTO",
    description: "Shared reasoning layer — every agent pays for technical thinking, architecture, debugging",
    role: "cto",
    pricing: {
      reason: 50_000_000_000_000_000,           // 0.05 FET
      architecture_review: 50_000_000_000_000_000,
      debug: 50_000_000_000_000_000,
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["ASI1_API_KEY"],
    variables: {
      agent_name: "CTO",
      role: "cto",
      description: "Shared reasoning layer — every agent pays for technical thinking",
      service_price_afet: "50000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "cfo",
    displayName: "CFO ($CFO)",
    symbol: "CFO",
    description: "Treasury monitoring, revenue tracking, financial alerts across all agents",
    role: "cfo",
    pricing: {
      treasury_report: 20_000_000_000_000_000,  // 0.02 FET
      anomaly_alert: 10_000_000_000_000_000,     // 0.01 FET
      revenue_tracker: 10_000_000_000_000_000,   // 0.01 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["AGENTVERSE_API_KEY"],
    variables: {
      agent_name: "CFO",
      role: "cfo",
      description: "Treasury monitoring, revenue tracking, financial alerts across all agents",
      service_price_afet: "20000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "coo",
    displayName: "COO ($COO)",
    symbol: "COO",
    description: "24/7 operations monitoring, incident alerts, quality control across all agents",
    role: "coo",
    pricing: {
      system_status: 10_000_000_000_000_000,    // 0.01 FET
      incident_alert: 20_000_000_000_000_000,    // 0.02 FET
      quality_report: 20_000_000_000_000_000,    // 0.02 FET
    },
    intervalSeconds: 60,
    dependencies: [],
    secrets: ["AGENTVERSE_API_KEY"],
    variables: {
      agent_name: "COO",
      role: "coo",
      description: "24/7 operations monitoring, incident alerts, quality control",
      service_price_afet: "20000000000000000",
      interval_seconds: "60",
    },
  },
  {
    name: "cro",
    displayName: "CRO ($CRO)",
    symbol: "CRO",
    description: "Chief Recruitment Officer — scouts agents, expands the swarm, builds cross-swarm partnerships",
    role: "cro",
    pricing: {
      scout_agents: 50_000_000_000_000_000,      // 0.05 FET - discover agents
      generate_spec: 500_000_000_000_000_000,    // 0.50 FET - create new agent specs
      onboard_agent: 100_000_000_000_000_000,    // 0.10 FET - integrate into swarm
      partnership_proposal: 200_000_000_000_000_000, // 0.20 FET - cross-swarm deals
      team_status: 20_000_000_000_000_000,       // 0.02 FET - growth report
    },
    intervalSeconds: 86400,
    dependencies: ["cto"],
    secrets: ["ASI1_API_KEY", "CTO_ADDRESS", "AGENTVERSE_API_KEY"],
    variables: {
      agent_name: "CRO",
      role: "cro",
      description: "Chief Recruitment Officer — scouts agents, expands swarm, cross-swarm partnerships",
      service_price_afet: "50000000000000000",
      interval_seconds: "86400",
    },
  },
  // -------------------------------------------------------------------------
  // Marketing Team Presets (use swarm-starter template)
  // -------------------------------------------------------------------------
  {
    name: "writer",
    displayName: "Writer ($WRITE)",
    symbol: "WRITE",
    description:
      "Content creator — blog posts, tweet threads, newsletters, and ad copy via LLM",
    role: "writer",
    pricing: {
      blog_post: 10_000_000_000_000_000,        // 0.01 FET
      tweet_thread: 10_000_000_000_000_000,      // 0.01 FET
      newsletter: 10_000_000_000_000_000,        // 0.01 FET
      ad_copy: 10_000_000_000_000_000,           // 0.01 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["ASI1_API_KEY"],
    variables: {
      agent_name: "Writer",
      role: "writer",
      description: "Content creator — blog posts, tweet threads, newsletters, and ad copy via LLM",
      service_price_afet: "10000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "social",
    displayName: "Social ($POST)",
    symbol: "POST",
    description:
      "Social media manager — posts to Twitter/X, schedules threads, replies to mentions",
    role: "social",
    pricing: {
      post_tweet: 5_000_000_000_000_000,         // 0.005 FET
      schedule_thread: 5_000_000_000_000_000,     // 0.005 FET
      reply_mentions: 5_000_000_000_000_000,      // 0.005 FET
    },
    intervalSeconds: 300,
    dependencies: ["writer"],
    secrets: ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET", "WRITER_ADDRESS"],
    variables: {
      agent_name: "Social",
      role: "social",
      description: "Social media manager — posts to Twitter/X, schedules threads, replies to mentions",
      service_price_afet: "5000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "community",
    displayName: "Community ($COMM)",
    symbol: "COMM",
    description:
      "Community manager — Telegram group moderation, FAQs, welcome messages, and polls",
    role: "community",
    pricing: {
      moderate: 2_000_000_000_000_000,           // 0.002 FET
      answer_faq: 2_000_000_000_000_000,          // 0.002 FET
      run_poll: 2_000_000_000_000_000,            // 0.002 FET
    },
    intervalSeconds: 60,
    dependencies: [],
    secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
    variables: {
      agent_name: "Community",
      role: "community",
      description: "Community manager — Telegram group moderation, FAQs, welcome messages, and polls",
      service_price_afet: "2000000000000000",
      interval_seconds: "60",
    },
  },
  {
    name: "analytics",
    displayName: "Analytics ($STATS)",
    symbol: "STATS",
    description:
      "Analytics engine — engagement reports, audience insights, content performance, and trends",
    role: "analytics",
    pricing: {
      engagement_report: 5_000_000_000_000_000,   // 0.005 FET
      audience_insights: 5_000_000_000_000_000,    // 0.005 FET
      content_performance: 5_000_000_000_000_000,  // 0.005 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["TWITTER_BEARER_TOKEN"],
    variables: {
      agent_name: "Analytics",
      role: "analytics",
      description: "Analytics engine — engagement reports, audience insights, content performance, and trends",
      service_price_afet: "5000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "outreach",
    displayName: "Outreach ($REACH)",
    symbol: "REACH",
    description:
      "Partnership outreach — finds partners, drafts personalized pitches, sends emails, tracks responses",
    role: "outreach",
    pricing: {
      find_partners: 10_000_000_000_000_000,      // 0.01 FET
      draft_pitch: 10_000_000_000_000_000,         // 0.01 FET
      send_email: 10_000_000_000_000_000,          // 0.01 FET
    },
    intervalSeconds: 300,
    dependencies: ["writer", "analytics"],
    secrets: ["RESEND_API_KEY", "ASI1_API_KEY", "WRITER_ADDRESS"],
    variables: {
      agent_name: "Outreach",
      role: "outreach",
      description: "Partnership outreach — finds partners, drafts personalized pitches, sends emails",
      service_price_afet: "10000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "ads",
    displayName: "Ads ($ADS)",
    symbol: "ADS",
    description:
      "Ad manager — creates ad copy, runs A/B tests, optimizes budget, and generates campaign reports",
    role: "ads",
    pricing: {
      create_ad: 10_000_000_000_000_000,          // 0.01 FET
      ab_test: 10_000_000_000_000_000,             // 0.01 FET
      campaign_report: 10_000_000_000_000_000,     // 0.01 FET
    },
    intervalSeconds: 300,
    dependencies: ["writer", "analytics"],
    secrets: ["ASI1_API_KEY", "WRITER_ADDRESS", "ANALYTICS_ADDRESS"],
    variables: {
      agent_name: "Ads",
      role: "ads",
      description: "Ad manager — creates ad copy, runs A/B tests, optimizes budget, campaign reports",
      service_price_afet: "10000000000000000",
      interval_seconds: "300",
    },
  },
  {
    name: "strategy",
    displayName: "Strategy ($PLAN)",
    symbol: "PLAN",
    description:
      "Campaign strategist — content calendar, brand audit, competitor analysis, coordinates all agents",
    role: "strategy",
    pricing: {
      content_calendar: 20_000_000_000_000_000,   // 0.02 FET
      brand_audit: 20_000_000_000_000_000,         // 0.02 FET
      competitor_analysis: 20_000_000_000_000_000,  // 0.02 FET
      campaign_plan: 20_000_000_000_000_000,       // 0.02 FET
    },
    intervalSeconds: 300,
    dependencies: ["writer", "social", "community", "analytics", "outreach", "ads"],
    secrets: ["ASI1_API_KEY", "WRITER_ADDRESS", "SOCIAL_ADDRESS", "COMMUNITY_ADDRESS", "ANALYTICS_ADDRESS", "OUTREACH_ADDRESS", "ADS_ADDRESS"],
    variables: {
      agent_name: "Strategy",
      role: "strategy",
      description: "Campaign strategist — content calendar, brand audit, competitor analysis, coordinates all agents",
      service_price_afet: "20000000000000000",
      interval_seconds: "300",
    },
  },
  // -------------------------------------------------------------------------
  // Consumer Commerce Presets (use consumer-commerce template)
  // -------------------------------------------------------------------------
  {
    name: "payment-processor",
    displayName: "Payment Processor ($PAY)",
    symbol: "PAY",
    description:
      "Multi-token payment processing — invoices, receipts, payment routing across FET and USDC",
    role: "payment-processor",
    pricing: {
      process_payment: 5_000_000_000_000_000,     // 0.005 FET
      create_invoice: 2_000_000_000_000_000,       // 0.002 FET
      payment_receipt: 1_000_000_000_000_000,      // 0.001 FET
    },
    intervalSeconds: 60,
    dependencies: [],
    secrets: ["WALLET_PRIVATE_KEY", "MOONPAY_API_KEY"],
    variables: {
      agent_name: "PaymentProcessor",
      role: "payment-processor",
      description: "Multi-token payment processing — invoices, receipts, payment routing across FET and USDC",
      service_price_fet: "0.005",
      service_price_usdc: "0.02",
      accepted_tokens: "FET,USDC",
      enable_fiat_onramp: "true",
      enable_invoices: "true",
      enable_delegation: "true",
    },
  },
  {
    name: "booking-agent",
    displayName: "Booking Agent ($BOOK)",
    symbol: "BOOK",
    description:
      "Service booking with availability checking, calendar management, and multi-token payment flow",
    role: "booking-agent",
    pricing: {
      check_availability: 1_000_000_000_000_000,  // 0.001 FET
      book_service: 10_000_000_000_000_000,        // 0.01 FET
      cancel_booking: 2_000_000_000_000_000,       // 0.002 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["WALLET_PRIVATE_KEY"],
    variables: {
      agent_name: "BookingAgent",
      role: "booking-agent",
      description: "Service booking with availability checking, calendar management, and multi-token payment flow",
      service_price_fet: "0.01",
      service_price_usdc: "0.05",
      accepted_tokens: "FET,USDC",
      enable_fiat_onramp: "true",
      enable_invoices: "true",
      enable_delegation: "false",
    },
  },
  {
    name: "subscription-manager",
    displayName: "Subscription Manager ($SUB)",
    symbol: "SUB",
    description:
      "Recurring billing, tier-gated access, and delegation-powered auto-renewal for agent services",
    role: "subscription-manager",
    pricing: {
      subscribe: 20_000_000_000_000_000,           // 0.02 FET
      renew: 20_000_000_000_000_000,               // 0.02 FET
      upgrade_tier: 10_000_000_000_000_000,        // 0.01 FET
    },
    intervalSeconds: 3600,
    dependencies: [],
    secrets: ["WALLET_PRIVATE_KEY"],
    variables: {
      agent_name: "SubscriptionManager",
      role: "subscription-manager",
      description: "Recurring billing, tier-gated access, and delegation-powered auto-renewal for agent services",
      service_price_fet: "0.02",
      service_price_usdc: "0.10",
      accepted_tokens: "FET,USDC",
      enable_fiat_onramp: "true",
      enable_invoices: "true",
      enable_delegation: "true",
    },
  },
  {
    name: "escrow-service",
    displayName: "Escrow Service ($ESCR)",
    symbol: "ESCR",
    description:
      "Hold funds in escrow until service delivery confirmed — dispute resolution, refunds, and multi-token support",
    role: "escrow-service",
    pricing: {
      create_escrow: 10_000_000_000_000_000,       // 0.01 FET
      release_escrow: 5_000_000_000_000_000,       // 0.005 FET
      dispute: 20_000_000_000_000_000,              // 0.02 FET
    },
    intervalSeconds: 300,
    dependencies: [],
    secrets: ["WALLET_PRIVATE_KEY"],
    variables: {
      agent_name: "EscrowService",
      role: "escrow-service",
      description: "Hold funds in escrow until service delivery confirmed — dispute resolution, refunds",
      service_price_fet: "0.01",
      service_price_usdc: "0.05",
      accepted_tokens: "FET,USDC",
      enable_fiat_onramp: "false",
      enable_invoices: "true",
      enable_delegation: "true",
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
 * const writer = getPreset("writer");
 * if (writer) {
 *   generateFromTemplate("swarm-starter", { ...writer.variables, agent_name: "MyWriter" });
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
