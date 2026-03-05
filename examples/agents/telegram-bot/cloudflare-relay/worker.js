/**
 * Cloudflare Worker — Telegram webhook relay for Agentverse agents.
 *
 * Receives Telegram webhook updates, forwards the message text to your
 * Agentverse agent via its REST endpoint, and sends the response back
 * to Telegram. Sub-second latency.
 *
 * Secrets (set via `wrangler secret put`):
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   AGENT_ADDRESS        — your agent1q... address
 *
 * Deploy:
 *   wrangler deploy
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>.workers.dev/webhook"
 */

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/webhook") {
      return new Response("OK");
    }

    const update = await request.json();
    const message = update.message;
    if (!message?.text) return new Response("OK");

    const { chat, text, from } = message;

    // Forward to Agentverse agent via chat endpoint
    const agentReply = await forwardToAgent(env, text, from?.username || "user");

    // Send reply back to Telegram
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat.id, text: agentReply }),
    });

    return new Response("OK");
  },
};

async function forwardToAgent(env, text, username) {
  // Option 1: Direct HTTP to Agentverse agent mailbox
  // Option 2: Call your own backend that speaks Chat Protocol
  // Option 3: Simple — call an external API your agent exposes
  //
  // Simplest: echo back + call your agent's logic via a sidecar API.
  // Replace this with your actual agent communication method.
  try {
    const res = await fetch(`https://agentverse.ai/v1/hosting/agents/${env.AGENT_ADDRESS}/endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sender: username }),
    });
    const data = await res.json();
    return data.response || `Received: ${text}`;
  } catch {
    return `Received: ${text} (agent relay pending setup)`;
  }
}
