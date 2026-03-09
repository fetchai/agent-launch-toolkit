const fs = require('fs');
const apiKey = process.env.AGENTVERSE_API_KEY;
const AGENT_ADDR = 'agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9';

// Create a minimal test agent without payment protocol
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

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Message from {sender}")
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(),
        acknowledged_msg_id=msg.msg_id,
    ))

    text = " ".join(item.text for item in msg.content if hasattr(item, 'text')).strip()

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text=f"GIFT agent is online! You said: {text[:100]}"),
            EndSessionContent(type="end-session"),
        ],
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.debug(f"Ack from {sender}")

agent.include(chat_proto, publish_manifest=True)
`;

async function main() {
  // Stop
  console.log('Stopping agent...');
  await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  await new Promise(r => setTimeout(r, 2000));

  // Upload minimal test code
  console.log('Uploading minimal test code...');
  const codeArray = [{ language: 'python', name: 'agent.py', value: testCode }];

  const uploadRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/code`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: JSON.stringify(codeArray) })
  });
  console.log('Upload:', uploadRes.status, await uploadRes.text());

  // Start
  console.log('Starting...');
  await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: '{}'
  });

  // Poll for 30s
  console.log('Waiting for compilation...');
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const s = await statusRes.json();
    console.log(`[${(i+1)*5}s] compiled: ${s.compiled}`);
    if (s.compiled) {
      console.log('\n✅ Minimal agent works!');
      return;
    }
  }
  console.log('\n❌ Still not compiled');
}

main().catch(console.error);
