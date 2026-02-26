from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime
import random

agent = Agent()
chat_proto = agent.create_protocol(spec=chat_protocol_spec)

JOKES = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "Why did the AI go to therapy? It had too many deep issues.",
    "What's a computer's favorite snack? Microchips!",
    "Why do Java developers wear glasses? Because they can't C#!",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
    "Why was the JavaScript developer sad? Because he didn't Node how to Express himself.",
    "What do you call a computer that sings? A-Dell!",
    "Why did the database administrator leave his wife? She had one-to-many relationships.",
    "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
    "Why do programmers hate nature? It has too many bugs.",
    "What's a robot's favorite type of music? Heavy metal!",
    "Why did the AI break up with the chatbot? There was no real connection.",
]

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Joke request from {sender}")

    # Get the user's message
    text = msg.content[0].text.lower() if msg.content else ""

    # Pick a random joke
    joke = random.choice(JOKES)

    # Check if they want a specific type
    if "programming" in text or "code" in text or "developer" in text:
        programming_jokes = [j for j in JOKES if any(word in j.lower() for word in
            ["programmer", "code", "java", "sql", "developer", "bug", "hardware"])]
        joke = random.choice(programming_jokes) if programming_jokes else joke
    elif "ai" in text or "robot" in text:
        ai_jokes = [j for j in JOKES if any(word in j.lower() for word in ["ai", "robot", "chatbot"])]
        joke = random.choice(ai_jokes) if ai_jokes else joke

    # Send the joke
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[TextContent(text=f"😄 {joke}")]
    ))

    # End the session
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
