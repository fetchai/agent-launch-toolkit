/**
 * Tests for Genesis template and Presets system — TST-01
 *
 * Verifies:
 *   - Genesis template generates valid output with basic variables
 *   - All 7 presets generate valid code via generateFromTemplate("genesis", ...)
 *   - Variable substitution replaces all expected placeholders
 *   - Generated code contains required markers and imports
 *   - Commerce layers (PaymentService, PricingTable, TierManager) present
 *   - Strict mode throws on missing required variables
 *   - Default values are used when only agent_name is provided
 *   - getTemplate("genesis") returns the template metadata
 *   - listTemplates() includes genesis and it is first in the list
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateFromTemplate } from '../generator.js';
import { getTemplate, listTemplates } from '../registry.js';
import { getPreset, listPresets } from '../presets.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESET_NAMES = [
  'oracle',
  'brain',
  'analyst',
  'coordinator',
  'sentinel',
  'launcher',
  'scout',
];

// ---------------------------------------------------------------------------
// Genesis template registration
// ---------------------------------------------------------------------------

describe('Genesis template — registration', () => {
  it('getTemplate("genesis") returns a valid template object', () => {
    const tpl = getTemplate('genesis');
    assert.ok(tpl, 'genesis template should exist in the registry');
    assert.equal(tpl.name, 'genesis');
    assert.ok(tpl.description, 'template should have a description');
    assert.ok(tpl.category, 'template should have a category');
    assert.ok(Array.isArray(tpl.variables), 'template should have variables array');
    assert.ok(typeof tpl.code === 'string', 'template should have code string');
  });

  it('listTemplates() includes genesis', () => {
    const templates = listTemplates();
    const names = templates.map((t) => t.name);
    assert.ok(names.includes('genesis'), `genesis should be in list: ${names.join(', ')}`);
  });

  it('genesis is first in the template list', () => {
    const templates = listTemplates();
    assert.equal(
      templates[0].name,
      'genesis',
      `First template should be genesis, got: ${templates[0].name}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Basic generation
// ---------------------------------------------------------------------------

describe('Genesis template — basic generation', () => {
  it('generates valid output with agent_name', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestAgent',
    });

    assert.ok(result.code, 'should produce code');
    assert.ok(result.readme, 'should produce readme');
    assert.ok(result.envExample, 'should produce envExample');
    assert.ok(result.claudeMd, 'should produce claudeMd');
    assert.ok(result.claudeSettings, 'should produce claudeSettings');
    assert.ok(result.agentlaunchConfig, 'should produce agentlaunchConfig');
  });

  it('code output is non-empty Python', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestAgent',
    });

    assert.ok(result.code.length > 100, 'code should be substantial');
    // Python import check
    assert.ok(
      result.code.includes('from uagents import Agent, Context'),
      'code should contain uagents import',
    );
  });

  it('readme mentions the agent name', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'MyGenesisBot',
    });

    assert.ok(
      result.readme.includes('MyGenesisBot'),
      'readme should mention agent_name',
    );
  });

  it('envExample lists required environment variables', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestAgent',
    });

    assert.ok(
      result.envExample.includes('AGENTVERSE_API_KEY'),
      'envExample should include AGENTVERSE_API_KEY',
    );
  });

  it('agentlaunchConfig references the genesis template', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestAgent',
    });

    const config = JSON.parse(result.agentlaunchConfig);
    assert.equal(
      config.template,
      'genesis',
      'config should reference genesis template',
    );
  });
});

// ---------------------------------------------------------------------------
// Variable substitution
// ---------------------------------------------------------------------------

describe('Genesis template — variable substitution', () => {
  it('replaces {{agent_name}} in the code', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'AlphaOracle',
    });

    assert.ok(
      result.code.includes('AlphaOracle'),
      'code should contain the agent name',
    );
    assert.ok(
      !result.code.includes('{{agent_name}}'),
      'code should not contain raw {{agent_name}} placeholder',
    );
  });

  it('replaces {{description}} in the code', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
      description: 'A custom description for testing',
    });

    assert.ok(
      result.code.includes('A custom description for testing'),
      'code should contain the description',
    );
  });

  it('replaces {{role}} in the code', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
      role: 'data-oracle',
    });

    assert.ok(
      result.code.includes('data-oracle'),
      'code should contain the role',
    );
  });

  it('replaces {{service_price_afet}} in the code', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
      service_price_afet: '5000000000000000',
    });

    assert.ok(
      result.code.includes('5000000000000000'),
      'code should contain the service price',
    );
  });
});

// ---------------------------------------------------------------------------
// Required code markers
// ---------------------------------------------------------------------------

describe('Genesis template — required code markers', () => {
  it('contains YOUR SWARM LOGIC marker', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('YOUR SWARM LOGIC'),
      'code should contain YOUR SWARM LOGIC marker for customization',
    );
  });

  it('contains required uagents import', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('from uagents import Agent, Context'),
      'code should import Agent and Context from uagents',
    );
  });

  it('contains ChatAcknowledgement handler', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('ChatAcknowledgement'),
      'code should include ChatAcknowledgement handler',
    );
  });

  it('contains publish_manifest=True', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('publish_manifest=True'),
      'code should include publish_manifest=True in agent.include()',
    );
  });

  it('uses datetime.now() not datetime.utcnow()', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    // Should use datetime.now()
    assert.ok(
      result.code.includes('datetime.now()'),
      'code should use datetime.now()',
    );
    // Should NOT use the deprecated datetime.utcnow()
    assert.ok(
      !result.code.includes('datetime.utcnow()'),
      'code should not use deprecated datetime.utcnow()',
    );
  });
});

// ---------------------------------------------------------------------------
// Commerce layers
// ---------------------------------------------------------------------------

describe('Genesis template — commerce layers', () => {
  it('contains PaymentService', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('PaymentService'),
      'code should include PaymentService class',
    );
  });

  it('contains PricingTable', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('PricingTable'),
      'code should include PricingTable class',
    );
  });

  it('contains TierManager', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('TierManager'),
      'code should include TierManager class',
    );
  });

  it('contains RevenueTracker', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestBot',
    });

    assert.ok(
      result.code.includes('RevenueTracker'),
      'code should include RevenueTracker for GDP tracking',
    );
  });
});

// ---------------------------------------------------------------------------
// Strict mode
// ---------------------------------------------------------------------------

describe('Genesis template — strict mode', () => {
  it('throws when strict is true and agent_name is missing', () => {
    assert.throws(
      () =>
        generateFromTemplate('genesis', {}, { variables: {}, strict: true }),
      /agent_name/i,
      'should throw mentioning agent_name',
    );
  });

  it('does not throw when strict is false and agent_name is missing', () => {
    assert.doesNotThrow(
      () =>
        generateFromTemplate('genesis', {}, { variables: {}, strict: false }),
      'should not throw in non-strict mode',
    );
  });

  it('leaves placeholder when strict is false and required var is missing', () => {
    const result = generateFromTemplate(
      'genesis',
      {},
      { variables: {}, strict: false },
    );

    // The unresolved placeholder should remain
    assert.ok(
      result.code.includes('{{agent_name}}'),
      'unresolved placeholder should remain in non-strict mode',
    );
  });
});

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

describe('Genesis template — default values', () => {
  it('uses default values when only agent_name is provided', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'MinimalAgent',
    });

    // Code should be valid (no raw {{...}} placeholders for defaulted vars)
    // agent_name is provided, all other vars should use defaults
    assert.ok(result.code.includes('MinimalAgent'), 'agent_name should be substituted');

    // The code should not have unresolved required placeholders
    // (description may have a default, role may have a default, etc.)
    // Check that most template variables with defaults are resolved
    const unresolvedCount = (result.code.match(/\{\{\w+\}\}/g) || []).length;
    // Some optional vars without defaults may remain, but required ones with defaults should be resolved
    assert.ok(
      unresolvedCount === 0,
      `Should have no unresolved placeholders, found ${unresolvedCount}: ${(result.code.match(/\{\{\w+\}\}/g) || []).join(', ')}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

describe('Presets — listPresets()', () => {
  it('returns an array of presets', () => {
    const presets = listPresets();
    assert.ok(Array.isArray(presets), 'listPresets() should return an array');
    assert.ok(presets.length >= 7, `should have at least 7 presets, got ${presets.length}`);
  });

  it('each preset has required fields', () => {
    const presets = listPresets();

    for (const preset of presets) {
      assert.ok(preset.name, `preset should have name`);
      assert.ok(preset.displayName, `preset ${preset.name} should have displayName`);
      assert.ok(preset.symbol, `preset ${preset.name} should have symbol`);
      assert.ok(preset.description, `preset ${preset.name} should have description`);
      assert.ok(preset.role, `preset ${preset.name} should have role`);
      assert.ok(preset.variables, `preset ${preset.name} should have variables`);
      assert.ok(
        typeof preset.variables === 'object',
        `preset ${preset.name} variables should be an object`,
      );
    }
  });

  it('includes all 7 seed agent presets', () => {
    const presets = listPresets();
    const presetNames = presets.map((p: { name: string }) => p.name);

    for (const expected of PRESET_NAMES) {
      assert.ok(
        presetNames.includes(expected),
        `should include "${expected}" preset. Available: ${presetNames.join(', ')}`,
      );
    }
  });
});

describe('Presets — getPreset()', () => {
  it('returns a preset for each known name', () => {
    for (const name of PRESET_NAMES) {
      const preset = getPreset(name);
      assert.ok(preset, `getPreset("${name}") should return a preset`);
      assert.equal(preset.name, name);
    }
  });

  it('returns undefined for an unknown preset name', () => {
    const preset = getPreset('nonexistent-preset-xyz');
    assert.equal(preset, undefined, 'unknown preset should return undefined');
  });

  it('oracle preset has expected structure', () => {
    const oracle = getPreset('oracle');
    assert.ok(oracle, 'oracle preset should exist');
    assert.ok(oracle.displayName, 'oracle should have displayName');
    assert.ok(oracle.symbol, 'oracle should have symbol');
    assert.ok(oracle.description, 'oracle should have description');
    assert.ok(oracle.role, 'oracle should have role');
    assert.ok(oracle.variables.agent_name, 'oracle variables should include agent_name');
  });
});

// ---------------------------------------------------------------------------
// All presets generate valid code
// ---------------------------------------------------------------------------

describe('Presets — all presets generate valid genesis code', () => {
  for (const presetName of PRESET_NAMES) {
    it(`preset "${presetName}" generates valid code from genesis template`, () => {
      const preset = getPreset(presetName);
      assert.ok(preset, `preset "${presetName}" should exist`);

      const result = generateFromTemplate('genesis', preset.variables);

      // Basic validity checks
      assert.ok(result.code, `${presetName}: should produce code`);
      assert.ok(result.code.length > 100, `${presetName}: code should be substantial`);

      // Should contain the preset's agent name
      assert.ok(
        result.code.includes(preset.variables.agent_name),
        `${presetName}: code should contain the agent name "${preset.variables.agent_name}"`,
      );

      // Should have required imports
      assert.ok(
        result.code.includes('from uagents import'),
        `${presetName}: code should have uagents import`,
      );

      // No unresolved placeholders
      const unresolved = result.code.match(/\{\{\w+\}\}/g) || [];
      assert.equal(
        unresolved.length,
        0,
        `${presetName}: should have no unresolved placeholders, found: ${unresolved.join(', ')}`,
      );

      // Should produce all expected files
      assert.ok(result.readme, `${presetName}: should produce readme`);
      assert.ok(result.envExample, `${presetName}: should produce envExample`);
      assert.ok(result.claudeMd, `${presetName}: should produce claudeMd`);
      assert.ok(result.claudeSettings, `${presetName}: should produce claudeSettings`);
      assert.ok(result.agentlaunchConfig, `${presetName}: should produce agentlaunchConfig`);
    });
  }
});
