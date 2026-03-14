/**
 * Coverage gap tests — TPL-R06, TPL-G05–G07, TPL-P03, TPL-P06
 *
 * Fills coverage gaps in the templates package:
 *   - Registry edge cases (nonexistent template lookup)
 *   - Generator edge cases (extra variables, keyword content, shortDescription)
 *   - C-Suite preset verification (ceo, cto, cfo, coo, cro)
 *   - Consumer commerce preset code generation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getTemplate, listTemplates } from '../registry.js';
import { generateFromTemplate } from '../generator.js';
import { getPreset, listPresets } from '../presets.js';

// ---------------------------------------------------------------------------
// TPL-R06: Registry edge cases
// ---------------------------------------------------------------------------

describe('Template Registry — edge cases', () => {
  it('TPL-R06: getTemplate("nonexistent") returns undefined', () => {
    const result = getTemplate('nonexistent');
    assert.equal(result, undefined, 'should return undefined for unknown template name');
  });

  it('TPL-R06: getTemplate with empty string returns undefined', () => {
    const result = getTemplate('');
    assert.equal(result, undefined, 'should return undefined for empty string');
  });

  it('TPL-R06: getTemplate with similar-but-wrong name returns undefined', () => {
    const result = getTemplate('chat_memory'); // underscore instead of hyphen
    assert.equal(result, undefined, 'should not match with underscore variant');
  });
});

// ---------------------------------------------------------------------------
// TPL-G05 to G07: Generator edge cases
// ---------------------------------------------------------------------------

describe('Generator — edge cases', () => {
  it('TPL-G05: extra variables passed through without error', () => {
    assert.doesNotThrow(() => {
      generateFromTemplate('custom', {
        agent_name: 'Test',
        extra_var: 'value',
        another: 'thing',
      });
    }, 'should not throw when extra variables are provided');
  });

  it('TPL-G05: extra variables do not corrupt the generated output', () => {
    const result = generateFromTemplate('custom', {
      agent_name: 'TestAgent',
      extra_var: 'SHOULD_NOT_APPEAR_IN_CODE',
    });
    // The code should still be valid (contain Agent()) regardless of extra vars
    assert.ok(result.code.includes('Agent()'), 'generated code should still contain Agent()');
  });

  it('TPL-G06: chat-memory code contains memory-related logic', () => {
    const result = generateFromTemplate('chat-memory', {
      agent_name: 'MemoryBot',
    });
    const code = result.code;
    const hasMemoryKeyword =
      code.includes('memory') ||
      code.includes('Memory') ||
      code.includes('history') ||
      code.includes('History');
    assert.ok(hasMemoryKeyword, 'chat-memory should contain memory-related keywords');
  });

  it('TPL-G06: swarm-starter code contains commerce-related patterns', () => {
    const result = generateFromTemplate('swarm-starter', {
      agent_name: 'SwarmBot',
    });
    const code = result.code;
    const hasCommerceKeyword =
      code.includes('Payment') ||
      code.includes('Pricing') ||
      code.includes('Revenue') ||
      code.includes('Tier') ||
      code.includes('commerce');
    assert.ok(hasCommerceKeyword, 'swarm-starter should contain commerce-related keywords');
  });

  it('TPL-G07: generated output has a non-empty shortDescription string', () => {
    const templates = listTemplates();
    for (const tpl of templates) {
      const result = generateFromTemplate(tpl.name, {
        agent_name: 'DescTest',
      });
      assert.equal(
        typeof result.shortDescription,
        'string',
        `${tpl.name}: shortDescription should be a string`,
      );
      assert.ok(
        result.shortDescription.length > 0,
        `${tpl.name}: shortDescription should be non-empty`,
      );
    }
  });

  it('TPL-G07: shortDescription is at most 200 characters', () => {
    const result = generateFromTemplate('chat-memory', {
      agent_name: 'A'.repeat(300), // very long name to test truncation
    });
    assert.ok(
      result.shortDescription.length <= 200,
      `shortDescription should be max 200 chars, got ${result.shortDescription.length}`,
    );
  });
});

// ---------------------------------------------------------------------------
// TPL-P03: C-Suite Presets
// ---------------------------------------------------------------------------

describe('C-Suite Presets — TPL-P03', () => {
  const csuite = ['ceo', 'cto', 'cfo', 'coo', 'cro'] as const;
  const expectedSymbols: Record<string, string> = {
    ceo: 'CEO',
    cto: 'CTO',
    cfo: 'CFO',
    coo: 'COO',
    cro: 'CRO',
  };

  for (const role of csuite) {
    describe(`${role} preset`, () => {
      it('exists and is not undefined', () => {
        const preset = getPreset(role);
        assert.ok(preset, `getPreset("${role}") should return a preset`);
      });

      it('has required fields: name, displayName, symbol, variables', () => {
        const preset = getPreset(role)!;
        assert.equal(typeof preset.name, 'string', 'name should be a string');
        assert.equal(typeof preset.displayName, 'string', 'displayName should be a string');
        assert.equal(typeof preset.symbol, 'string', 'symbol should be a string');
        assert.ok(preset.variables, 'variables should exist');
        assert.equal(typeof preset.variables, 'object', 'variables should be an object');
      });

      it(`has symbol "${expectedSymbols[role]}"`, () => {
        const preset = getPreset(role)!;
        assert.equal(preset.symbol, expectedSymbols[role], `symbol should be ${expectedSymbols[role]}`);
      });

      it('has variables.agent_name set', () => {
        const preset = getPreset(role)!;
        assert.ok(
          preset.variables.agent_name,
          `${role} preset should have variables.agent_name`,
        );
      });

      it('has a description', () => {
        const preset = getPreset(role)!;
        assert.ok(
          preset.description && preset.description.length > 0,
          `${role} preset should have a non-empty description`,
        );
      });

      it('has pricing with at least one service', () => {
        const preset = getPreset(role)!;
        assert.ok(
          Object.keys(preset.pricing).length > 0,
          `${role} preset should have at least one service in pricing`,
        );
      });
    });
  }

  it('all 5 C-Suite presets are present in listPresets()', () => {
    const allPresets = listPresets();
    const presetNames = allPresets.map((p) => p.name);
    for (const role of csuite) {
      assert.ok(
        presetNames.includes(role),
        `listPresets() should include "${role}". Got: ${presetNames.join(', ')}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// TPL-P06: Consumer Commerce Presets
// ---------------------------------------------------------------------------

describe('Consumer Commerce Presets — TPL-P06', () => {
  const consumerPresets = [
    'payment-processor',
    'booking-agent',
    'subscription-manager',
    'escrow-service',
  ] as const;

  for (const presetName of consumerPresets) {
    describe(`${presetName} preset`, () => {
      it('exists via getPreset()', () => {
        const preset = getPreset(presetName);
        assert.ok(preset, `getPreset("${presetName}") should return a preset`);
      });

      it('generates valid code via consumer-commerce template', () => {
        const preset = getPreset(presetName)!;
        const result = generateFromTemplate('consumer-commerce', {
          ...preset.variables,
          agent_name: 'TestAgent',
        });
        assert.ok(result.code.length > 0, 'should generate non-empty code');
      });

      it('generated code contains Agent()', () => {
        const preset = getPreset(presetName)!;
        const result = generateFromTemplate('consumer-commerce', {
          ...preset.variables,
          agent_name: 'TestAgent',
        });
        assert.ok(
          result.code.includes('Agent()'),
          `${presetName}: generated code should contain Agent()`,
        );
      });

      it('generated code contains ChatAcknowledgement', () => {
        const preset = getPreset(presetName)!;
        const result = generateFromTemplate('consumer-commerce', {
          ...preset.variables,
          agent_name: 'TestAgent',
        });
        assert.ok(
          result.code.includes('ChatAcknowledgement'),
          `${presetName}: generated code should contain ChatAcknowledgement`,
        );
      });

      it('generated code contains EndSessionContent', () => {
        const preset = getPreset(presetName)!;
        const result = generateFromTemplate('consumer-commerce', {
          ...preset.variables,
          agent_name: 'TestAgent',
        });
        assert.ok(
          result.code.includes('EndSessionContent'),
          `${presetName}: generated code should contain EndSessionContent`,
        );
      });
    });
  }
});
