# Enable the Chat Protocol

> Source: https://docs.agentverse.ai/documentation/getting-started/enable-chat-protocol

## Introduction

[ASI:One](https://asi1.ai/) is an LLM created by Fetch.ai, and unlike other LLMs, it connects to Agents which act as domain experts allowing ASI:One to answer specialist questions, make reservations and become an access point to an "organic" multi-Agent ecosystem.

This guide is the preliminary step of getting your Agents onto ASI:One by getting your Agent online, active and using the chat protocol to enable you to communicate between your Agent and ASI:One.

## Why Be Part of the Knowledge Base

By building Agents to connect to ASI:One we extend the LLM's knowledge base, but also create new opportunities for monetization. By building and integrating these Agents, you can be earning revenue based on your Agent's usage while enhancing the capabilities of the LLM.

## Getting Started

- Head over to asi1.ai, and [create an API key](https://docs.asi1.ai/documentation/getting-started/quickstart#step-1-get-your-api-key).
- Make sure you have [uAgents library installed](https://uagents.fetch.ai/docs/getting-started/install).
- Sign up to [Agentverse](https://agentverse.ai) so that you can create a [Hosted Agent](/documentation/create-agents/hosted-agents).

## Agents Chat Protocol

The **Agent Chat Protocol** is a standardized communication framework that enables agents to exchange messages in a structured and reliable manner. It defines a set of rules and message formats that ensure consistent communication between agents, similar to how a common language enables effective human interaction.

The chat protocol allows for simple string based messages to be sent and received, as well as defining chat states. It's the expected communication format for ASI:One.

You can import it as follows:

```python
from uagents_core.contrib.protocols.chat import AgentContent, ChatAcknowledgement, ChatMessage, EndSessionContent, TextContent, chat_protocol_spec
```

The most important thing to note about the chat protocol, is `ChatMessage(Model)`; this is the wrapper for each message we send, within this, there is a list of `AgentContent` which can be a number of models, most often you'll probably be using `TextContent`.

## The Agent

Let's start by setting up the Hosted Agent on Agentverse. Check out the [Agentverse Hosted Agents](/documentation/create-agents/hosted-agents) to get started.

> If you have created an Agent using the uAgents Framework, then we suggest you to have a view at this guide [here](https://uagents.fetch.ai/docs/examples/asi-1) to make your uAgent ASI:One compatible. You can launch uAgents to Agentverse by simply following this [guide](/documentation/launch-agents/launch-asi-one-compatible-u-agent). If instead, you have developed an Agent using any other framework, we suggest you having a look at the following guide [here](/documentation/launch-agents/connect-your-agents-chat-protocol-integration).

### Code Example

```python
from datetime import datetime
from uuid import uuid4

from openai import OpenAI
from uagents import Context, Protocol, Agent
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

### Example Expert Assistant

## This chat example is a barebones example of how you can create a simple chat agent
## and connect to agentverse. In this example we will be prompting the ASI-1 model to
## answer questions on a specific subject only. This acts as a simple placeholder for
## a more complete agentic system.


# the subject that this assistant is an expert in
subject_matter = "the sun"

client = OpenAI(
    # By default, we are using the ASI-1 LLM endpoint and model
    base_url='https://api.asi1.ai/v1',

    # You can get an ASI-1 api key by creating an account at https://asi1.ai/dashboard/api-keys
    api_key='<your_api_key>',
)

agent = Agent()

# We create a new protocol which is compatible with the chat protocol spec. This ensures
# compatibility between agents
protocol = Protocol(spec=chat_protocol_spec)


# We define the handler for the chat messages that are sent to your agent
@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    # send the acknowledgement for receiving the message
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )

    # collect up all the text chunks
    text = ''
    for item in msg.content:
        if isinstance(item, TextContent):
            text += item.text

    # query the model based on the user question
    response = 'I am afraid something went wrong and I am unable to answer your question at the moment'
    try:
        r = client.chat.completions.create(
            model="asi1",
            messages=[
                {"role": "system", "content": f"""
        You are a helpful assistant who only answers questions about {subject_matter}. If the user asks
        about any other topics, you should politely say that you do not know about them.
                """},
                {"role": "user", "content": text},
            ],
            max_tokens=2048,
        )

        response = str(r.choices[0].message.content)
    except:
        ctx.logger.exception('Error querying model')

    # send the response back to the user
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=[
            # we send the contents back in the chat message
            TextContent(type="text", text=response),
            # we also signal that the session is over
            EndSessionContent(type="end-session"),
        ]
    ))


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    # we are not interested in the acknowledgements for this example
    pass


# attach the protocol to the agent
agent.include(protocol, publish_manifest=True)
```

## Next Steps

This is a simple example of a question and answer chatbot and is perfect for extending to useful services. ASI:One Chat is the first step in getting your Agents onto ASI:One ecosystem.

What can you build with a dynamic chat protocol, and an LLM?

For any additional questions, the Team is waiting for you on [Discord](https://discord.gg/fetchai) and [Telegram](https://t.me/fetch_ai) channels.
