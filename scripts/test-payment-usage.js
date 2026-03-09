const apiKey = process.env.AGENTVERSE_API_KEY;
const AGENT_ADDR = 'agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9';

// Test actually using payment protocol
const testCode = `
from datetime import datetime
from uuid import uuid4
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)
from uagents_core.contrib.protocols.payment import (
    RequestPayment,
    CommitPayment,
    CompletePayment,
    RejectPayment,
    CancelPayment,
    Funds,
    payment_protocol_spec,
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# This line was the original error - using Protocol() directly
seller_proto = Protocol(spec=payment_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Message from {sender}")
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(),
        acknowledged_msg_id=msg.msg_id,
    ))

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text="Payment protocol is working!"),
            EndSessionContent(type="end-session"),
        ],
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.debug(f"Ack")

@seller_proto.on_message(CommitPayment)
async def handle_commit(ctx: Context, sender: str, msg: CommitPayment):
    ctx.logger.info(f"CommitPayment from {sender}")

@seller_proto.on_message(RejectPayment)
async def handle_reject(ctx: Context, sender: str, msg: RejectPayment):
    ctx.logger.info(f"RejectPayment from {sender}")

agent.include(chat_proto, publish_manifest=True)
agent.include(seller_proto, publish_manifest=True)
`;

async function main() {
  console.log('Stopping agent...');
  await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Uploading payment usage test...');
  const codeArray = [{ language: 'python', name: 'agent.py', value: testCode }];

  const uploadRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/code`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: JSON.stringify(codeArray) })
  });
  console.log('Upload:', uploadRes.status);

  console.log('Starting...');
  await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: '{}'
  });

  console.log('Waiting for compilation (60s max)...');
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const s = await statusRes.json();
    console.log(`[${(i+1)*5}s] compiled: ${s.compiled}`);
    if (s.compiled) {
      console.log('\n✅ Payment protocol usage works!');
      return;
    }
  }

  console.log('\n❌ Not compiled - checking logs...');
  const logsRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/logs`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const logs = await logsRes.json();
  console.log('Last logs:', (logs.logs || []).slice(-5));
}

main().catch(console.error);
