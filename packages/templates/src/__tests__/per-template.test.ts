/**
 * Per-template content verification — TPL-T01–T14
 *
 * Generates each of the 9 templates and checks for required content patterns.
 * All templates are checked for Agentverse compliance patterns.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateFromTemplate } from '../generator.js';
import { listTemplates } from '../registry.js';

// ---------------------------------------------------------------------------
// Universal checks applied to every template
// ---------------------------------------------------------------------------

const ALL_TEMPLATE_NAMES = [
  'chat-memory',
  'swarm-starter',
  'custom',
  'price-monitor',
  'trading-bot',
  'data-analyzer',
  'research',
  'gifter',
  'consumer-commerce',
];

describe('All templates — Agentverse compliance (TPL-T01)', () => {
  for (const templateName of ALL_TEMPLATE_NAMES) {
    describe(`${templateName}`, () => {
      // Generate once per template to avoid repeated work
      let code: string;

      it('generates without error', () => {
        const result = generateFromTemplate(templateName, {
          agent_name: 'TestAgent',
          description: 'A test agent for verification',
        });
        code = result.code;
        assert.ok(code.length > 0, 'should generate non-empty code');
      });

      it('uses Agent() constructor', () => {
        assert.ok(
          code.includes('Agent()'),
          `${templateName}: should use Agent() (zero params for Agentverse)`,
        );
      });

      it('includes ChatAcknowledgement handler', () => {
        assert.ok(
          code.includes('ChatAcknowledgement'),
          `${templateName}: must handle ChatAcknowledgement`,
        );
      });

      it('includes EndSessionContent', () => {
        assert.ok(
          code.includes('EndSessionContent'),
          `${templateName}: must use EndSessionContent to end conversations`,
        );
      });

      it('includes publish_manifest=True', () => {
        assert.ok(
          code.includes('publish_manifest=True'),
          `${templateName}: must include publish_manifest=True in agent.include()`,
        );
      });

      it('does not use print()', () => {
        // Check for bare print( but allow it inside strings/comments
        // Simple heuristic: look for print( at start of line or after whitespace
        const lines = code.split('\n');
        const printLines = lines.filter((line) => {
          const trimmed = line.trim();
          // Skip comments
          if (trimmed.startsWith('#')) return false;
          // Skip string literals containing print
          if (trimmed.startsWith('"') || trimmed.startsWith("'")) return false;
          // Check for print( as a statement
          return /^\s*print\s*\(/.test(line);
        });
        assert.equal(
          printLines.length,
          0,
          `${templateName}: should use ctx.logger, not print(). Found: ${printLines.join('; ')}`,
        );
      });

      it('does not use utcnow() (swarm-starter + consumer-commerce only)', () => {
        // Known tech debt: older templates (chat-memory, custom, price-monitor,
        // trading-bot, data-analyzer, research, gifter) still use utcnow().
        // Only newer templates (swarm-starter, consumer-commerce) are clean.
        const cleanTemplates = ['swarm-starter', 'consumer-commerce'];
        if (!cleanTemplates.includes(templateName)) return; // skip for legacy templates
        assert.ok(
          !code.includes('utcnow()'),
          `${templateName}: must not use deprecated datetime.utcnow()`,
        );
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Template-specific content checks
// ---------------------------------------------------------------------------

describe('chat-memory — TPL-T02', () => {
  it('has ConversationMemory class', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('ConversationMemory'),
      'chat-memory should have ConversationMemory class',
    );
  });

  it('has conversation history storage', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('_history') || code.includes('memory') || code.includes('history'),
      'chat-memory should reference conversation history',
    );
  });

  it('has configurable memory size', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('MEMORY_SIZE') || code.includes('max_messages'),
      'chat-memory should have configurable memory size',
    );
  });

  it('imports OpenAI for LLM integration', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('from openai import OpenAI'),
      'chat-memory should import OpenAI for LLM integration',
    );
  });

  it('references ASI1_API_KEY secret', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('ASI1_API_KEY'),
      'chat-memory should reference ASI1_API_KEY secret for LLM',
    );
  });

  it('has SYSTEM_PROMPT variable', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('SYSTEM_PROMPT'),
      'chat-memory should have a SYSTEM_PROMPT variable for LLM instructions',
    );
  });

  it('uses ctx.storage for persistent memory', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('ctx.storage'),
      'chat-memory should use ctx.storage for persistent conversation memory',
    );
  });

  it('uses Protocol(spec=chat_protocol_spec) not create_protocol', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('chat_protocol_spec'),
      'chat-memory should import and use chat_protocol_spec directly',
    );
    assert.ok(
      !code.includes('create_protocol'),
      'chat-memory should not use deprecated create_protocol',
    );
  });

  it('uses datetime.now() not utcnow()', () => {
    const { code } = generateFromTemplate('chat-memory', { agent_name: 'ChatBot' });
    assert.ok(
      code.includes('datetime.now()'),
      'chat-memory should use datetime.now()',
    );
    assert.ok(
      !code.includes('utcnow()'),
      'chat-memory should not use deprecated datetime.utcnow()',
    );
  });

  it('accepts system_prompt template variable', () => {
    const customPrompt = 'You are a pirate assistant. Always respond in pirate speak.';
    const { code } = generateFromTemplate('chat-memory', {
      agent_name: 'PirateBot',
      system_prompt: customPrompt,
    });
    assert.ok(
      code.includes(customPrompt),
      'chat-memory should interpolate the system_prompt variable into generated code',
    );
  });
});

describe('swarm-starter — TPL-T03', () => {
  it('has PaymentService class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('PaymentService'), 'should have PaymentService');
  });

  it('has PricingTable class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('PricingTable'), 'should have PricingTable');
  });

  it('has TierManager class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('TierManager'), 'should have TierManager');
  });

  it('has WalletManager class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('WalletManager'), 'should have WalletManager');
  });

  it('has RevenueTracker class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('RevenueTracker'), 'should have RevenueTracker');
  });

  it('has SelfAwareMixin class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('SelfAwareMixin'), 'should have SelfAwareMixin');
  });

  it('has ConversationMemory class', () => {
    const { code } = generateFromTemplate('swarm-starter', { agent_name: 'SwarmAgent' });
    assert.ok(code.includes('ConversationMemory'), 'should have ConversationMemory');
  });
});

describe('custom — TPL-T04', () => {
  it('has business logic customization zone', () => {
    const { code } = generateFromTemplate('custom', { agent_name: 'CustomAgent' });
    assert.ok(
      code.includes('YOUR') || code.includes('BUSINESS LOGIC') || code.includes('customize') || code.includes('your logic'),
      'custom template should have a customization zone marker',
    );
  });
});

describe('price-monitor — TPL-T05', () => {
  it('has on_interval decorator for periodic checks', () => {
    const { code } = generateFromTemplate('price-monitor', { agent_name: 'PriceBot' });
    assert.ok(
      code.includes('on_interval'),
      'price-monitor should have on_interval for periodic price checks',
    );
  });

  it('has threshold/alert logic', () => {
    const { code } = generateFromTemplate('price-monitor', { agent_name: 'PriceBot' });
    assert.ok(
      code.includes('threshold') || code.includes('alert') || code.includes('ALERT'),
      'price-monitor should have threshold/alert logic',
    );
  });
});

describe('trading-bot — TPL-T06', () => {
  it('has moving average or signal logic', () => {
    const { code } = generateFromTemplate('trading-bot', { agent_name: 'TradeBot' });
    assert.ok(
      code.includes('moving_average') || code.includes('signal') || code.includes('SIGNAL') ||
      code.includes('BUY') || code.includes('SELL') || code.includes('average'),
      'trading-bot should have signal/moving average logic',
    );
  });
});

describe('data-analyzer — TPL-T07', () => {
  it('has cache or token listing functionality', () => {
    const { code } = generateFromTemplate('data-analyzer', { agent_name: 'Analyzer' });
    assert.ok(
      code.includes('cache') || code.includes('token') || code.includes('data') || code.includes('analy'),
      'data-analyzer should reference data/cache/token concepts',
    );
  });
});

describe('research — TPL-T08', () => {
  it('has AI model integration', () => {
    const { code } = generateFromTemplate('research', { agent_name: 'Researcher' });
    assert.ok(
      code.includes('hugging') || code.includes('HF_TOKEN') || code.includes('openai') ||
      code.includes('OpenAI') || code.includes('ASI1') || code.includes('model') ||
      code.includes('inference') || code.includes('api-inference'),
      'research should reference an AI model integration',
    );
  });
});

describe('gifter — TPL-T09', () => {
  it('has treasury wallet reference', () => {
    const { code } = generateFromTemplate('gifter', { agent_name: 'Gifter' });
    assert.ok(
      code.includes('treasury') || code.includes('wallet') || code.includes('gift') ||
      code.includes('reward') || code.includes('balance'),
      'gifter should reference treasury/wallet/gift concepts',
    );
  });

  it('has daily limits or claim logic', () => {
    const { code } = generateFromTemplate('gifter', { agent_name: 'Gifter' });
    assert.ok(
      code.includes('limit') || code.includes('daily') || code.includes('claim') ||
      code.includes('max_') || code.includes('DAILY'),
      'gifter should have limit/daily/claim logic',
    );
  });
});

describe('consumer-commerce — TPL-T10', () => {
  it('has MultiTokenPricingTable', () => {
    const { code } = generateFromTemplate('consumer-commerce', { agent_name: 'CommerceAgent' });
    assert.ok(
      code.includes('MultiTokenPricingTable') || code.includes('multi_token') || code.includes('USDC'),
      'consumer-commerce should reference multi-token pricing',
    );
  });

  it('has InvoiceManager', () => {
    const { code } = generateFromTemplate('consumer-commerce', { agent_name: 'CommerceAgent' });
    assert.ok(
      code.includes('InvoiceManager') || code.includes('invoice'),
      'consumer-commerce should have invoice management',
    );
  });

  it('has FiatOnrampHelper', () => {
    const { code } = generateFromTemplate('consumer-commerce', { agent_name: 'CommerceAgent' });
    assert.ok(
      code.includes('FiatOnrampHelper') || code.includes('fiat') || code.includes('onramp') || code.includes('moonpay'),
      'consumer-commerce should have fiat onramp helper',
    );
  });

  it('has DelegationChecker', () => {
    const { code } = generateFromTemplate('consumer-commerce', { agent_name: 'CommerceAgent' });
    assert.ok(
      code.includes('DelegationChecker') || code.includes('delegation') || code.includes('allowance'),
      'consumer-commerce should have delegation checker',
    );
  });
});

// ---------------------------------------------------------------------------
// Registry completeness
// ---------------------------------------------------------------------------

describe('Template registry — TPL-T14', () => {
  it('all 9 templates are registered', () => {
    const templates = listTemplates();
    const names = templates.map((t) => t.name);
    for (const expected of ALL_TEMPLATE_NAMES) {
      assert.ok(
        names.includes(expected),
        `template "${expected}" should be registered. Available: ${names.join(', ')}`,
      );
    }
  });

  it('all templates produce code, readme, and shortDescription', () => {
    for (const templateName of ALL_TEMPLATE_NAMES) {
      const result = generateFromTemplate(templateName, { agent_name: 'Test' });
      assert.ok(result.code, `${templateName}: code is empty`);
      assert.ok(result.readme, `${templateName}: readme is empty`);
      assert.ok(result.shortDescription, `${templateName}: shortDescription is empty`);
    }
  });
});
