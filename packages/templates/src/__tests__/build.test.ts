/**
 * Build verification tests — TST-04
 *
 * Verifies:
 *   - All packages export correctly (no import errors)
 *   - No TypeScript errors (verified by compilation)
 *   - Genesis template and presets are accessible
 *   - SDK storage and commerce modules are accessible
 *   - Existing functionality is not broken by new modules
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Templates package exports
// ---------------------------------------------------------------------------

describe('Build verification — templates package', () => {
  it('exports generateFromTemplate', async () => {
    const mod = await import('../generator.js');
    assert.ok(
      typeof mod.generateFromTemplate === 'function',
      'generateFromTemplate should be a function',
    );
  });

  it('exports getTemplate and listTemplates from registry', async () => {
    const mod = await import('../registry.js');
    assert.ok(
      typeof mod.getTemplate === 'function',
      'getTemplate should be a function',
    );
    assert.ok(
      typeof mod.listTemplates === 'function',
      'listTemplates should be a function',
    );
  });

  it('exports getPreset and listPresets from presets', async () => {
    // presets.js will be created by the presets agent
    const mod = await import('../presets.js') as unknown as Record<string, unknown>;
    assert.ok(
      typeof mod['getPreset'] === 'function',
      'getPreset should be a function',
    );
    assert.ok(
      typeof mod['listPresets'] === 'function',
      'listPresets should be a function',
    );
  });

  it('index.ts re-exports all required symbols', async () => {
    const mod = await import('../index.js') as unknown as Record<string, unknown>;
    assert.ok(typeof mod['generateFromTemplate'] === 'function');
    assert.ok(typeof mod['getTemplate'] === 'function');
    assert.ok(typeof mod['listTemplates'] === 'function');
    assert.ok(typeof mod['getPreset'] === 'function');
    assert.ok(typeof mod['listPresets'] === 'function');
  });

  it('listTemplates returns at least 7 templates (6 original + genesis)', async () => {
    const { listTemplates } = await import('../registry.js');
    const templates = listTemplates();
    assert.ok(
      templates.length >= 7,
      `should have at least 7 templates, got ${templates.length}`,
    );
  });

  it('all original templates are still present', async () => {
    const { listTemplates } = await import('../registry.js');
    const templates = listTemplates();
    const names = templates.map((t) => t.name);

    const originalTemplates = [
      'custom',
      'price-monitor',
      'trading-bot',
      'data-analyzer',
      'research',
      'gifter',
    ];

    for (const name of originalTemplates) {
      assert.ok(
        names.includes(name),
        `original template "${name}" should still be present. Available: ${names.join(', ')}`,
      );
    }
  });

  it('genesis template is present', async () => {
    const { getTemplate } = await import('../registry.js');
    const genesis = getTemplate('genesis');
    assert.ok(genesis, 'genesis template should be registered');
  });
});

// ---------------------------------------------------------------------------
// SDK package exports (via workspace package name)
// ---------------------------------------------------------------------------

describe('Build verification — SDK package', () => {
  it('exports AgentLaunchClient', async () => {
    const mod = await import('agentlaunch-sdk');
    assert.ok(
      typeof mod.AgentLaunchClient === 'function',
      'should export AgentLaunchClient',
    );
  });

  it('exports AgentLaunch fluent wrapper', async () => {
    const mod = await import('agentlaunch-sdk');
    assert.ok(
      typeof mod.AgentLaunch === 'function',
      'should export AgentLaunch',
    );
  });

  it('exports storage functions', async () => {
    // Cast to Record to access properties that will be added by the storage module agent
    const mod = await import('agentlaunch-sdk') as unknown as Record<string, unknown>;
    assert.ok(typeof mod['listStorage'] === 'function', 'should export listStorage');
    assert.ok(typeof mod['getStorage'] === 'function', 'should export getStorage');
    assert.ok(typeof mod['putStorage'] === 'function', 'should export putStorage');
    assert.ok(typeof mod['deleteStorage'] === 'function', 'should export deleteStorage');
  });

  it('exports commerce functions', async () => {
    // Cast to Record to access properties that will be added by the commerce module agent
    const mod = await import('agentlaunch-sdk') as unknown as Record<string, unknown>;
    assert.ok(typeof mod['getAgentRevenue'] === 'function', 'should export getAgentRevenue');
    assert.ok(typeof mod['getPricingTable'] === 'function', 'should export getPricingTable');
    assert.ok(typeof mod['getAgentCommerceStatus'] === 'function', 'should export getAgentCommerceStatus');
    assert.ok(typeof mod['getNetworkGDP'] === 'function', 'should export getNetworkGDP');
  });

  it('AgentLaunch fluent wrapper creates all namespaces', async () => {
    const { AgentLaunch } = await import('agentlaunch-sdk');
    const al = new AgentLaunch({ apiKey: 'test-key' });
    assert.ok(al.tokens, 'should have tokens namespace');
    assert.ok(al.market, 'should have market namespace');
    assert.ok(al.handoff, 'should have handoff namespace');
    assert.ok(al.agents, 'should have agents namespace');
  });
});

// ---------------------------------------------------------------------------
// Cross-package compatibility
// ---------------------------------------------------------------------------

describe('Build verification — cross-package compatibility', () => {
  it('generateFromTemplate produces valid code for all original templates', async () => {
    const { generateFromTemplate, listTemplates } = await import('../index.js');
    const templates = listTemplates();

    for (const tpl of templates) {
      const result = generateFromTemplate(tpl.name, {
        agent_name: 'BuildTestAgent',
      });

      assert.ok(
        result.code,
        `${tpl.name}: should produce code`,
      );
      assert.ok(
        result.readme,
        `${tpl.name}: should produce readme`,
      );
      assert.ok(
        result.envExample,
        `${tpl.name}: should produce envExample`,
      );
    }
  });

  it('GenerateResult type has all expected fields', async () => {
    const { generateFromTemplate } = await import('../generator.js');
    const result = generateFromTemplate('custom', {
      agent_name: 'TypeTest',
    });

    // Verify all fields from GenerateResult interface
    assert.ok(typeof result.code === 'string');
    assert.ok(typeof result.readme === 'string');
    assert.ok(typeof result.envExample === 'string');
    assert.ok(typeof result.claudeMd === 'string');
    assert.ok(typeof result.claudeSettings === 'string');
    assert.ok(typeof result.agentlaunchConfig === 'string');
  });
});
