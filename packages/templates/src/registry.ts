/**
 * registry.ts — Template registry for agentlaunch-templates
 *
 * All templates are imported here and exposed via listTemplates() / getTemplate().
 * Add new templates by:
 *   1. Creating src/templates/<name>.ts exporting `template: AgentTemplate`
 *   2. Importing and adding to TEMPLATES below
 */

import { template as customTemplate } from "./templates/custom.js";
import { template as priceMonitorTemplate } from "./templates/price-monitor.js";
import { template as tradingBotTemplate } from "./templates/trading-bot.js";
import { template as dataAnalyzerTemplate } from "./templates/data-analyzer.js";
import { template as researchTemplate } from "./templates/research.js";
import { template as gifterTemplate } from "./templates/gifter.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TemplateVariable {
  /** Variable name used as {{name}} placeholder in the template code */
  name: string;
  /** Whether this variable must be supplied by the caller (default: false) */
  required?: boolean;
  /** Default value used when caller does not provide the variable */
  default?: string;
  /** Human-readable description shown in CLI help and MCP prompts */
  description: string;
}

export interface AgentTemplate {
  /** Unique slug used to look up the template — e.g. "price-monitor" */
  name: string;
  /** One-line description shown in listings */
  description: string;
  /** Category label for grouping — e.g. "AI/ML", "Finance", "Infrastructure" */
  category: string;
  /** Variables that will be substituted into the template code */
  variables: TemplateVariable[];
  /** Python package names required by the generated agent.py */
  dependencies: string[];
  /** Environment variable names that must be set as Agentverse secrets */
  secrets: string[];
  /** The Python source code with {{variable}} placeholders */
  code: string;
}

// ---------------------------------------------------------------------------
// Internal registry
// ---------------------------------------------------------------------------

const TEMPLATES: AgentTemplate[] = [
  customTemplate,
  priceMonitorTemplate,
  tradingBotTemplate,
  dataAnalyzerTemplate,
  researchTemplate,
  gifterTemplate,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a copy of the full template registry.
 * Safe to mutate — the original array is not exposed.
 */
export function listTemplates(): AgentTemplate[] {
  return [...TEMPLATES];
}

/**
 * Looks up a template by its `name` slug.
 * Returns `undefined` if no template with that name exists.
 *
 * @example
 * const tpl = getTemplate("price-monitor");
 * if (!tpl) throw new Error("Template not found");
 */
export function getTemplate(name: string): AgentTemplate | undefined {
  return TEMPLATES.find((t) => t.name === name);
}
