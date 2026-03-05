/**
 * Tests for the consumer-commerce template and presets.
 *
 * Verifies:
 *   - Template is registered and accessible
 *   - Template generates valid Python code with variable substitution
 *   - All 4 consumer presets exist and have correct structure
 *   - Presets produce valid template output
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('consumer-commerce template', () => {
  it('is registered in the template registry', async () => {
    const { getTemplate } = await import('../registry.js');
    const tmpl = getTemplate('consumer-commerce');
    assert.ok(tmpl, 'consumer-commerce template should exist');
    assert.equal(tmpl.name, 'consumer-commerce');
    assert.equal(tmpl.category, 'Commerce');
  });

  it('appears in listTemplates()', async () => {
    const { listTemplates } = await import('../registry.js');
    const all = listTemplates();
    const names = all.map((t) => t.name);
    assert.ok(names.includes('consumer-commerce'), 'Should be in template list');
  });

  it('has the expected variables', async () => {
    const { getTemplate } = await import('../registry.js');
    const tmpl = getTemplate('consumer-commerce')!;
    const varNames = tmpl.variables.map((v) => v.name);
    assert.ok(varNames.includes('agent_name'));
    assert.ok(varNames.includes('description'));
    assert.ok(varNames.includes('service_price_fet'));
    assert.ok(varNames.includes('service_price_usdc'));
    assert.ok(varNames.includes('accepted_tokens'));
    assert.ok(varNames.includes('enable_fiat_onramp'));
    assert.ok(varNames.includes('enable_invoices'));
    assert.ok(varNames.includes('enable_delegation'));
  });

  it('generates valid Python code with variable substitution', async () => {
    const { generateFromTemplate } = await import('../generator.js');
    const result = generateFromTemplate('consumer-commerce', {
      agent_name: 'TestPayAgent',
      description: 'A test payment agent',
      service_price_fet: '0.01',
      service_price_usdc: '0.05',
      accepted_tokens: 'FET,USDC',
      enable_fiat_onramp: 'true',
      enable_invoices: 'true',
      enable_delegation: 'true',
    });

    assert.ok(result.code, 'Should generate code');
    assert.ok(result.code.includes('TestPayAgent'), 'Should substitute agent_name');
    assert.ok(result.code.includes('A test payment agent'), 'Should substitute description');
    assert.ok(result.code.includes('MultiTokenPricingTable'), 'Should include MultiTokenPricingTable');
    assert.ok(result.code.includes('InvoiceManager'), 'Should include InvoiceManager');
    assert.ok(result.code.includes('FiatOnrampHelper'), 'Should include FiatOnrampHelper');
    assert.ok(result.code.includes('DelegationChecker'), 'Should include DelegationChecker');
    assert.ok(result.code.includes('chat_protocol_spec'), 'Should use chat protocol');
    assert.ok(result.code.includes('publish_manifest=True'), 'Should have publish_manifest');
  });

  it('generated code does not contain unsubstituted variables', async () => {
    const { generateFromTemplate } = await import('../generator.js');
    const result = generateFromTemplate('consumer-commerce', {
      agent_name: 'PayBot',
      description: 'Payment bot',
    });

    // Check that no {{variable}} placeholders remain
    const unsubstituted = result.code.match(/\{\{[a-z_]+\}\}/g);
    assert.equal(
      unsubstituted,
      null,
      `Should have no unsubstituted variables, found: ${unsubstituted?.join(', ')}`,
    );
  });
});

describe('Consumer commerce presets', () => {
  it('payment-processor preset exists', async () => {
    const { getPreset } = await import('../presets.js');
    const preset = getPreset('payment-processor');
    assert.ok(preset, 'payment-processor preset should exist');
    assert.equal(preset.symbol, 'PAY');
    assert.ok(preset.variables.accepted_tokens?.includes('USDC'));
  });

  it('booking-agent preset exists', async () => {
    const { getPreset } = await import('../presets.js');
    const preset = getPreset('booking-agent');
    assert.ok(preset, 'booking-agent preset should exist');
    assert.equal(preset.symbol, 'BOOK');
  });

  it('subscription-manager preset exists', async () => {
    const { getPreset } = await import('../presets.js');
    const preset = getPreset('subscription-manager');
    assert.ok(preset, 'subscription-manager preset should exist');
    assert.equal(preset.symbol, 'SUB');
    assert.equal(preset.variables.enable_delegation, 'true');
  });

  it('escrow-service preset exists', async () => {
    const { getPreset } = await import('../presets.js');
    const preset = getPreset('escrow-service');
    assert.ok(preset, 'escrow-service preset should exist');
    assert.equal(preset.symbol, 'ESCR');
  });

  it('all consumer presets appear in listPresets()', async () => {
    const { listPresets } = await import('../presets.js');
    const all = listPresets();
    const names = all.map((p) => p.name);
    assert.ok(names.includes('payment-processor'));
    assert.ok(names.includes('booking-agent'));
    assert.ok(names.includes('subscription-manager'));
    assert.ok(names.includes('escrow-service'));
  });

  it('consumer presets have required variable keys', async () => {
    const { listPresets } = await import('../presets.js');
    const consumerPresets = listPresets().filter((p) =>
      ['payment-processor', 'booking-agent', 'subscription-manager', 'escrow-service'].includes(p.name),
    );

    for (const preset of consumerPresets) {
      assert.ok(preset.variables.service_price_fet, `${preset.name} should have service_price_fet`);
      assert.ok(preset.variables.service_price_usdc, `${preset.name} should have service_price_usdc`);
      assert.ok(preset.variables.accepted_tokens, `${preset.name} should have accepted_tokens`);
    }
  });
});
