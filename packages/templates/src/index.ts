/**
 * agentlaunch-templates
 *
 * Agent code templates for the AgentLaunch platform.
 *
 * Provides six ready-to-use Python agent templates built on:
 *   - Agentverse Chat Protocol v0.3.0
 *   - uAgents Agent() zero-param init
 *   - ctx.logger structured logging
 *   - Rate limiting, health monitoring, token-gated tiers
 *   - agent-launch.ai/api integration
 *
 * Platform constants (source of truth: deployed smart contracts):
 *   - Deploy fee: 120 FET (read dynamically, can change via multi-sig)
 *   - Graduation target: 30,000 FET -> auto DEX listing
 *   - Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
 *
 * @example
 * import { listTemplates, getTemplate, generateFromTemplate } from "agentlaunch-templates";
 *
 * // List all available templates
 * const templates = listTemplates();
 * console.log(templates.map(t => t.name));
 * // ["custom", "price-monitor", "trading-bot", "data-analyzer", "research", "gifter"]
 *
 * // Get metadata for a specific template
 * const tpl = getTemplate("price-monitor");
 * console.log(tpl?.variables);
 *
 * // Generate files from a template
 * const { code, readme, envExample } = generateFromTemplate("price-monitor", {
 *   agent_name: "MyPriceWatcher",
 *   token_address: "0xabc123...",
 *   alert_threshold: "10",
 * });
 */

// Re-export registry types and functions
export type { AgentTemplate, TemplateVariable } from "./registry.js";
export { listTemplates, getTemplate, getCanonicalName } from "./registry.js";

// Re-export generator types and function
export type { GenerateResult, GenerateOptions } from "./generator.js";
export { generateFromTemplate } from "./generator.js";

// Re-export presets
export type { Preset } from "./presets.js";
export { getPreset, listPresets } from "./presets.js";

// Re-export Claude context (rules, skills, docs, examples, package.json, cursor config)
export { RULES, SKILLS, DOCS, EXAMPLES, buildPackageJson, CURSOR_MCP_CONFIG, CURSOR_RULES } from "./claude-context.js";

// Re-export swarm-specific generators
export type { SwarmAgent, SwarmContext, AgentSkillContext } from "./claude-context.js";
export { buildSwarmClaudeMd, buildSwarmConfig, buildSwarmPackageJson, buildProjectSkills } from "./claude-context.js";
