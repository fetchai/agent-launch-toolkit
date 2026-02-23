# uAgent Code Patterns

When writing Agentverse agent code:

## Minimal Working Agent

```python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime

agent = Agent()  # Zero params on Agentverse
chat_proto = agent.create_protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Message from {sender}")
    text = msg.content[0].text if msg.content else ""

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[TextContent(text=f"You said: {text}")]
    ))

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Ack from {sender}: {msg.acknowledged_msg_id}")

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
```

## Rules

- Always use `Agent()` with zero params on Agentverse
- Always include `ChatAcknowledgement` handler (required by protocol)
- Always end conversations with `EndSessionContent`
- Always use `ctx.logger` (never `print`)
- Always use `datetime.now()` (never `utcnow`, it is deprecated)
- Always include `publish_manifest=True` in `agent.include()`
- Use `Protocol(spec=chat_protocol_spec)` or `agent.create_protocol(spec=chat_protocol_spec)`

## Required Imports

```python
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime
```
