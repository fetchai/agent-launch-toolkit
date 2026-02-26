#!/usr/bin/env python3
"""
Brain Agent ($THINK) — LLM Reasoning Engine for the Genesis Network

What it does:
  - Classifies incoming queries (market, technical, general)
  - Summarizes long text into concise insights
  - Provides deep reasoning via Hugging Face Inference API

What it charges:
  - reason:    0.01 FET — deep analysis using LLM
  - classify:  0.01 FET — query classification
  - summarize: 0.01 FET — text summarization

What it consumes:
  - Nothing (standalone reasoning engine)

Secrets needed:
  - AGENTVERSE_API_KEY
  - HF_TOKEN (Hugging Face Inference API token)
"""

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

import json
import os
from datetime import datetime
from uuid import uuid4

import requests

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_MODEL = os.environ.get(
    "HF_MODEL",
    "mistralai/Mistral-7B-Instruct-v0.2",
)
HF_API = "https://api-inference.huggingface.co/models"


# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------


def llm_generate(prompt: str, max_tokens: int = 512) -> str:
    """Call Hugging Face Inference API."""
    if not HF_TOKEN:
        return "[HF_TOKEN not set — cannot call LLM. Set it as an Agentverse secret.]"
    try:
        r = requests.post(
            f"{HF_API}/{HF_MODEL}",
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={
                "inputs": prompt,
                "parameters": {"max_new_tokens": max_tokens, "temperature": 0.7},
            },
            timeout=30,
        )
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and data:
                return data[0].get("generated_text", "No output")
            return str(data)
        return f"LLM error ({r.status_code}): {r.text[:200]}"
    except Exception as e:
        return f"LLM error: {e}"


def classify_query(text: str) -> str:
    """Classify a query into categories using keyword heuristics + LLM fallback."""
    lower = text.lower()
    if any(w in lower for w in ["price", "token", "market", "trade", "buy", "sell", "volume"]):
        return "market"
    if any(w in lower for w in ["deploy", "agent", "code", "scaffold", "build", "api"]):
        return "technical"
    if any(w in lower for w in ["fee", "graduation", "bonding", "curve", "holder"]):
        return "platform"
    # Fallback: use LLM if available
    if HF_TOKEN:
        prompt = (
            f"Classify this query into one category: market, technical, platform, general.\n"
            f"Query: {text[:200]}\nCategory:"
        )
        result = llm_generate(prompt, max_tokens=10).strip().lower()
        for cat in ["market", "technical", "platform", "general"]:
            if cat in result:
                return cat
    return "general"


def summarize_text(text: str) -> str:
    """Summarize long text into key points."""
    if len(text) < 100:
        return text
    prompt = (
        f"Summarize the following text in 3-5 bullet points:\n\n{text[:2000]}\n\nSummary:"
    )
    return llm_generate(prompt, max_tokens=300)


def reason_about(query: str) -> str:
    """Deep analysis and reasoning about a query."""
    prompt = (
        f"You are an expert AI agent analyst working in the Fetch.ai ecosystem. "
        f"The AgentLaunch platform lets agents get tokenized with bonding curves. "
        f"Trading fee is 2% to protocol treasury (no creator fee). "
        f"Graduation target is 30,000 FET for auto DEX listing.\n\n"
        f"Provide a thorough analysis for this query:\n{query[:1000]}\n\nAnalysis:"
    )
    return llm_generate(prompt, max_tokens=512)


# ---------------------------------------------------------------------------
# Reply helper
# ---------------------------------------------------------------------------


async def reply(ctx, sender, text, end=False):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    await ctx.send(
        sender,
        ChatMessage(timestamp=datetime.now(), msg_id=uuid4(), content=content),
    )


# ---------------------------------------------------------------------------
# Agent setup
# ---------------------------------------------------------------------------

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# Track usage for basic stats
_stats = {"classify": 0, "summarize": 0, "reason": 0}


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )

    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    lower = text.lower()

    if lower in ("help", "?"):
        await reply(ctx, sender,
            "Brain Agent ($THINK) — LLM Reasoning Engine\n\n"
            "Commands:\n"
            "  classify <text>   — classify query type (0.01 FET)\n"
            "  summarize <text>  — summarize text (0.01 FET)\n"
            "  reason <query>    — deep analysis (0.01 FET)\n"
            "  stats             — usage statistics\n"
            "  help              — this message\n\n"
            f"LLM Model: {HF_MODEL}\n"
            f"HF_TOKEN: {'configured' if HF_TOKEN else 'NOT SET'}"
        )
        return

    if lower == "stats":
        await reply(ctx, sender,
            f"Brain Usage Stats:\n"
            f"  classify:  {_stats['classify']} calls\n"
            f"  summarize: {_stats['summarize']} calls\n"
            f"  reason:    {_stats['reason']} calls",
            end=True,
        )
        return

    if lower.startswith("classify "):
        query = text[9:].strip()
        category = classify_query(query)
        _stats["classify"] += 1
        await reply(ctx, sender,
            f"Classification: {category.upper()}\nQuery: {query[:100]}",
            end=True,
        )
        return

    if lower.startswith("summarize "):
        body = text[10:].strip()
        summary = summarize_text(body)
        _stats["summarize"] += 1
        await reply(ctx, sender, f"Summary:\n{summary}", end=True)
        return

    if lower.startswith("reason "):
        query = text[7:].strip()
        analysis = reason_about(query)
        _stats["reason"] += 1
        await reply(ctx, sender, f"Analysis:\n{analysis}", end=True)
        return

    # Default: treat as a reason query
    if len(text) > 10:
        analysis = reason_about(text)
        _stats["reason"] += 1
        await reply(ctx, sender, f"Analysis:\n{analysis}", end=True)
        return

    await reply(ctx, sender,
        "Brain Agent ($THINK). Type 'help' for commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
