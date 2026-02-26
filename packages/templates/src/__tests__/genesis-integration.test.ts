/**
 * Integration tests for Genesis template generation
 *
 * These tests verify end-to-end template generation without needing
 * an API key or network access. They exercise the full generateFromTemplate
 * pipeline and preset system to ensure generated code is valid and
 * meaningfully different across presets.
 *
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateFromTemplate } from '../generator.js';
import { listPresets, getPreset } from '../presets.js';
import { listTemplates, getTemplate } from '../registry.js';

// ---------------------------------------------------------------------------
// Genesis template generation
// ---------------------------------------------------------------------------

describe('Integration: Genesis template generation', () => {
  it('generates valid Python from genesis template', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'TestAgent',
    });

    assert.ok(result.code.length > 100, 'code should be substantial');
    assert.ok(
      result.code.includes('from uagents import'),
      'code should contain uagents import',
    );
    assert.ok(
      result.code.includes('TestAgent'),
      'code should contain the agent name',
    );
  });

  it('generates all expected output files', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'OutputTest',
    });

    assert.ok(result.code, 'should produce code');
    assert.ok(result.readme, 'should produce readme');
    assert.ok(result.envExample, 'should produce envExample');
    assert.ok(result.claudeMd, 'should produce claudeMd');
    assert.ok(result.claudeSettings, 'should produce claudeSettings');
    assert.ok(result.agentlaunchConfig, 'should produce agentlaunchConfig');
  });

  it('generates with each preset and produces unique code', () => {
    const presets = listPresets();
    const codes = new Set<string>();

    assert.ok(presets.length >= 7, `should have at least 7 presets, got ${presets.length}`);

    for (const preset of presets) {
      const result = generateFromTemplate('genesis', {
        ...preset.variables,
        agent_name: `Test_${preset.name}`,
      });

      assert.ok(
        result.code.includes(`Test_${preset.name}`),
        `code for preset "${preset.name}" should contain agent name`,
      );

      // Capture a signature of the code (first 200 chars should differ by role/description)
      codes.add(result.code.substring(0, 200));
    }

    // At least some should be different (role/description differ)
    assert.ok(
      codes.size >= 3,
      `presets should produce meaningfully different code, got ${codes.size} unique signatures`,
    );
  });

  it('strict mode rejects missing required variables', () => {
    assert.throws(
      () => generateFromTemplate('genesis', {}, { variables: {}, strict: true }),
      /agent_name/i,
      'should throw mentioning agent_name',
    );
  });

  it('non-strict mode leaves placeholder for missing required vars', () => {
    const result = generateFromTemplate(
      'genesis',
      {},
      { variables: {}, strict: false },
    );

    assert.ok(
      result.code.includes('{{agent_name}}'),
      'unresolved agent_name placeholder should remain in non-strict mode',
    );
  });

  it('generated code contains commerce layers', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'CommerceTest',
    });

    assert.ok(
      result.code.includes('PaymentService'),
      'code should include PaymentService',
    );
    assert.ok(
      result.code.includes('PricingTable'),
      'code should include PricingTable',
    );
    assert.ok(
      result.code.includes('TierManager'),
      'code should include TierManager',
    );
    assert.ok(
      result.code.includes('RevenueTracker'),
      'code should include RevenueTracker',
    );
  });

  it('generated code follows Agentverse patterns', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'PatternTest',
    });

    assert.ok(
      result.code.includes('ChatAcknowledgement'),
      'code should include ChatAcknowledgement handler',
    );
    assert.ok(
      result.code.includes('publish_manifest=True'),
      'code should include publish_manifest=True',
    );
    assert.ok(
      result.code.includes('datetime.now()'),
      'code should use datetime.now()',
    );
    assert.ok(
      !result.code.includes('datetime.utcnow()'),
      'code should not use deprecated datetime.utcnow()',
    );
  });

  it('generated code has no unresolved placeholders when agent_name is provided', () => {
    const result = generateFromTemplate('genesis', {
      agent_name: 'FullyResolved',
    });

    const unresolved = result.code.match(/\{\{\w+\}\}/g) || [];
    assert.equal(
      unresolved.length,
      0,
      `should have no unresolved placeholders, found: ${unresolved.join(', ')}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Preset round-trip through generator
// ---------------------------------------------------------------------------

describe('Integration: Preset -> Genesis round-trip', () => {
  const presetNames = [
    'oracle',
    'brain',
    'analyst',
    'coordinator',
    'sentinel',
    'launcher',
    'scout',
  ];

  for (const presetName of presetNames) {
    it(`preset "${presetName}" generates complete project with zero unresolved placeholders`, () => {
      const preset = getPreset(presetName);
      assert.ok(preset, `preset "${presetName}" should exist`);

      const result = generateFromTemplate('genesis', {
        ...preset.variables,
        agent_name: `Integration_${presetName}`,
      });

      // Verify substantial code
      assert.ok(result.code.length > 500, `${presetName}: code should be substantial`);

      // Verify no unresolved placeholders
      const unresolved = result.code.match(/\{\{\w+\}\}/g) || [];
      assert.equal(
        unresolved.length,
        0,
        `${presetName}: should have no unresolved placeholders, found: ${unresolved.join(', ')}`,
      );

      // Verify all output files exist
      assert.ok(result.readme.length > 0, `${presetName}: readme should be non-empty`);
      assert.ok(result.envExample.length > 0, `${presetName}: envExample should be non-empty`);
      assert.ok(result.claudeMd.length > 0, `${presetName}: claudeMd should be non-empty`);

      // Verify config references genesis template
      const config = JSON.parse(result.agentlaunchConfig);
      assert.equal(
        config.template,
        'genesis',
        `${presetName}: config should reference genesis template`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Template registry integration
// ---------------------------------------------------------------------------

describe('Integration: Template registry', () => {
  it('all registered templates can generate code', () => {
    const templates = listTemplates();
    assert.ok(templates.length >= 7, `should have at least 7 templates, got ${templates.length}`);

    for (const tpl of templates) {
      // Generate with just agent_name (non-strict)
      const result = generateFromTemplate(tpl.name, {
        agent_name: `RegistryTest_${tpl.name}`,
      });

      assert.ok(
        result.code.length > 50,
        `template "${tpl.name}" should produce non-trivial code`,
      );
    }
  });

  it('unknown template name throws', () => {
    assert.throws(
      () => generateFromTemplate('__nonexistent_template__', { agent_name: 'Test' }),
      /not found/i,
      'should throw for unknown template',
    );
  });
});
