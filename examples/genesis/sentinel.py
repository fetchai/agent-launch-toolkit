#!/usr/bin/env python3
"""
Sentinel Agent ($ALERT) — Real-Time Watchdog for the Genesis Network

What it does:
  - Monitors token prices every 60 seconds
  - Detects anomalies: price spikes, crash alerts, volume surges
  - Maintains a watchlist and sends alerts when thresholds are breached

What it charges:
  - monitor:        0.002 FET — add token to watchlist
  - alert:          0.002 FET — get recent alerts
  - anomaly_report: 0.002 FET — full anomaly analysis

What it consumes:
  - Oracle agent for price data (optional)

Secrets needed:
  - AGENTVERSE_API_KEY
  - AGENTLAUNCH_API_KEY
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

AGENTLAUNCH_API = os.environ.get("AGENTLAUNCH_API", "https://agent-launch.ai/api")

# Alert thresholds
PRICE_SPIKE_PCT = 15.0     # +15% triggers spike alert
PRICE_CRASH_PCT = -10.0    # -10% triggers crash alert
VOLUME_SURGE_MULT = 3.0    # 3x normal volume triggers surge alert

# In-memory state
_watchlist: dict = {}       # address -> {name, last_price, prices, alerts}
_alerts: list = []          # recent alerts (max 100)


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------


def fetch_price(address: str) -> dict:
    try:
        r = requests.get(f"{AGENTLAUNCH_API}/tokens/address/{address}", timeout=5)
        if r.status_code == 200:
            data = r.json()
            token = data if "price" in data else data.get("token", data.get("data", {}))
            return {
                "name": token.get("name", "Unknown"),
                "price": float(token.get("price", token.get("currentPrice", 0))),
                "volume": float(token.get("volume24h", token.get("volume", 0))),
                "holders": int(token.get("holders", token.get("holderCount", 0))),
            }
    except Exception:
        pass
    return {}


# ---------------------------------------------------------------------------
# Anomaly detection
# ---------------------------------------------------------------------------


def check_anomalies(address: str, current: dict) -> list:
    """Check for anomalies against historical data. Returns list of alerts."""
    if address not in _watchlist:
        return []

    entry = _watchlist[address]
    alerts = []
    price = current.get("price", 0)
    volume = current.get("volume", 0)
    last_price = entry.get("last_price", 0)
    prices = entry.get("prices", [])

    # Price spike/crash detection
    if last_price > 0 and price > 0:
        pct_change = ((price - last_price) / last_price) * 100
        if pct_change >= PRICE_SPIKE_PCT:
            alerts.append({
                "type": "PRICE_SPIKE",
                "token": entry.get("name", address[:12]),
                "address": address,
                "change_pct": round(pct_change, 2),
                "from_price": last_price,
                "to_price": price,
                "ts": datetime.now().isoformat(),
            })
        elif pct_change <= PRICE_CRASH_PCT:
            alerts.append({
                "type": "PRICE_CRASH",
                "token": entry.get("name", address[:12]),
                "address": address,
                "change_pct": round(pct_change, 2),
                "from_price": last_price,
                "to_price": price,
                "ts": datetime.now().isoformat(),
            })

    # Volume surge detection
    if len(prices) >= 5:
        avg_volume = entry.get("avg_volume", 0)
        if avg_volume > 0 and volume >= avg_volume * VOLUME_SURGE_MULT:
            alerts.append({
                "type": "VOLUME_SURGE",
                "token": entry.get("name", address[:12]),
                "address": address,
                "current_volume": volume,
                "avg_volume": avg_volume,
                "multiplier": round(volume / avg_volume, 1),
                "ts": datetime.now().isoformat(),
            })

    return alerts


def update_watchlist(address: str, current: dict) -> None:
    """Update watchlist entry with new data."""
    if address not in _watchlist:
        _watchlist[address] = {
            "name": current.get("name", address[:12]),
            "last_price": 0,
            "prices": [],
            "volumes": [],
            "avg_volume": 0,
            "added": datetime.now().isoformat(),
        }

    entry = _watchlist[address]
    price = current.get("price", 0)
    volume = current.get("volume", 0)

    entry["last_price"] = price
    entry["prices"].append(price)
    entry["prices"] = entry["prices"][-100:]

    entry["volumes"].append(volume)
    entry["volumes"] = entry["volumes"][-100:]

    if entry["volumes"]:
        entry["avg_volume"] = sum(entry["volumes"]) / len(entry["volumes"])


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
            "Sentinel Agent ($ALERT) — Real-Time Watchdog\n\n"
            "Commands:\n"
            "  watch <address>    — add token to watchlist (0.002 FET)\n"
            "  unwatch <address>  — remove from watchlist\n"
            "  watchlist          — show monitored tokens\n"
            "  alerts [N]         — show last N alerts (0.002 FET)\n"
            "  report <address>   — anomaly report (0.002 FET)\n"
            "  thresholds         — current alert thresholds\n"
            "  help               — this message\n\n"
            f"Monitoring interval: 60 seconds\n"
            f"Watchlist size: {len(_watchlist)} tokens"
        )
        return

    if lower == "thresholds":
        await reply(ctx, sender,
            f"Alert Thresholds:\n"
            f"  Price spike: +{PRICE_SPIKE_PCT}%\n"
            f"  Price crash: {PRICE_CRASH_PCT}%\n"
            f"  Volume surge: {VOLUME_SURGE_MULT}x average",
            end=True,
        )
        return

    if lower.startswith("watch ") and not lower.startswith("watchlist"):
        addr = text.split(maxsplit=1)[1].strip()
        data = fetch_price(addr)
        if not data:
            await reply(ctx, sender, f"Could not fetch data for {addr}", end=True)
            return
        update_watchlist(addr, data)
        await reply(ctx, sender,
            f"Added to watchlist: {data.get('name', addr[:12])}\n"
            f"  Price: {data['price']:.8f} FET\n"
            f"  Holders: {data['holders']}\n"
            f"  Monitoring every 60 seconds.",
            end=True,
        )
        return

    if lower.startswith("unwatch "):
        addr = text.split(maxsplit=1)[1].strip()
        if addr in _watchlist:
            name = _watchlist[addr].get("name", addr[:12])
            del _watchlist[addr]
            await reply(ctx, sender, f"Removed {name} from watchlist.", end=True)
        else:
            await reply(ctx, sender, f"Token not in watchlist: {addr}", end=True)
        return

    if lower == "watchlist":
        if not _watchlist:
            await reply(ctx, sender, "Watchlist is empty. Use 'watch <address>' to add tokens.", end=True)
            return
        lines = [f"Watchlist ({len(_watchlist)} tokens):"]
        for addr, entry in _watchlist.items():
            lines.append(
                f"  {entry['name']}: {entry['last_price']:.8f} FET "
                f"({len(entry['prices'])} samples)"
            )
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("alerts"):
        parts = text.split()
        n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 10
        if not _alerts:
            await reply(ctx, sender, "No alerts yet.", end=True)
            return
        recent = _alerts[-n:]
        lines = [f"Last {len(recent)} alerts:"]
        for a in reversed(recent):
            if a["type"] == "PRICE_SPIKE":
                lines.append(f"  [{a['ts'][:19]}] SPIKE {a['token']} +{a['change_pct']}%")
            elif a["type"] == "PRICE_CRASH":
                lines.append(f"  [{a['ts'][:19]}] CRASH {a['token']} {a['change_pct']}%")
            elif a["type"] == "VOLUME_SURGE":
                lines.append(f"  [{a['ts'][:19]}] VOLUME {a['token']} {a['multiplier']}x")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("report "):
        addr = text.split(maxsplit=1)[1].strip()
        if addr not in _watchlist:
            await reply(ctx, sender, f"Token not in watchlist. Use 'watch {addr}' first.", end=True)
            return
        entry = _watchlist[addr]
        prices = entry["prices"]
        if len(prices) < 2:
            await reply(ctx, sender, "Not enough data for a report. Check back later.", end=True)
            return
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        volatility = (max_price - min_price) / avg_price * 100 if avg_price else 0
        token_alerts = [a for a in _alerts if a.get("address") == addr]
        await reply(ctx, sender,
            f"Anomaly Report: {entry['name']}\n"
            f"  Samples: {len(prices)}\n"
            f"  Current: {entry['last_price']:.8f} FET\n"
            f"  Average: {avg_price:.8f} FET\n"
            f"  Min: {min_price:.8f} / Max: {max_price:.8f}\n"
            f"  Volatility: {volatility:.1f}%\n"
            f"  Alerts triggered: {len(token_alerts)}\n"
            f"  Avg volume: {entry['avg_volume']:.2f} FET",
            end=True,
        )
        return

    await reply(ctx, sender,
        "Sentinel Agent ($ALERT). Type 'help' for commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=60.0)
async def monitor_watchlist(ctx: Context) -> None:
    """Check all watched tokens for anomalies every 60 seconds."""
    if not _watchlist:
        return

    total_alerts = 0
    for addr in list(_watchlist.keys()):
        data = fetch_price(addr)
        if not data:
            continue
        new_alerts = check_anomalies(addr, data)
        update_watchlist(addr, data)
        for a in new_alerts:
            _alerts.append(a)
            total_alerts += 1
            ctx.logger.info(f"[ALERT] {a['type']} {a.get('token', addr[:12])}")

    # Trim alerts list
    while len(_alerts) > 100:
        _alerts.pop(0)

    ctx.logger.info(
        f"[SENTINEL] Scanned {len(_watchlist)} tokens. "
        f"New alerts: {total_alerts}. Total alerts: {len(_alerts)}."
    )


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
