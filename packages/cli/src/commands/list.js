/**
 * CLI-003: list command
 *
 * agentlaunch list [--limit 10] [--sort trending|latest|market_cap] [--json]
 *
 * Fetches tokens from GET /api/agents/tokens and prints a table.
 */
import { apiGet } from "../http.js";
export function registerListCommand(program) {
    program
        .command("list")
        .description("List tokens on AgentLaunch with pagination")
        .option("--limit <n>", "Number of tokens to show (default: 10)", "10")
        .option("--sort <by>", "Sort order: trending, latest, market_cap (default: latest)", "latest")
        .option("--json", "Output raw JSON (machine-readable)")
        .action(async (options) => {
        const limit = parseInt(options.limit, 10);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            if (!options.json) {
                console.error("Error: --limit must be a number between 1 and 100");
            }
            else {
                console.log(JSON.stringify({ error: "--limit must be a number between 1 and 100" }));
            }
            process.exit(1);
        }
        const validSorts = ["trending", "latest", "market_cap"];
        const sort = options.sort;
        if (!validSorts.includes(sort)) {
            if (!options.json) {
                console.error(`Error: --sort must be one of: ${validSorts.join(", ")}`);
            }
            else {
                console.log(JSON.stringify({
                    error: `--sort must be one of: ${validSorts.join(", ")}`,
                }));
            }
            process.exit(1);
        }
        let response;
        try {
            const query = new URLSearchParams({
                limit: String(limit),
                sort,
                page: "1",
            });
            response = await apiGet(`/agents/tokens?${query}`);
        }
        catch (err) {
            if (options.json) {
                console.log(JSON.stringify({ error: err.message }));
            }
            else {
                console.error(`Error: ${err.message}`);
            }
            process.exit(1);
        }
        // Normalize different response shapes
        const tokens = response.data ?? response.tokens ?? response.items ?? [];
        if (options.json) {
            console.log(JSON.stringify({ tokens, total: response.total ?? tokens.length }));
            return;
        }
        if (tokens.length === 0) {
            console.log("No tokens found.");
            return;
        }
        // Pretty-print table
        const col = {
            name: 22,
            symbol: 8,
            price: 14,
            progress: 10,
            status: 10,
        };
        const hr = "─".repeat(col.name + col.symbol + col.price + col.progress + col.status + 14);
        console.log(`\nAgentLaunch Tokens  (sort: ${sort}, limit: ${limit})\n`);
        console.log(hr);
        console.log(pad("Name", col.name) +
            pad("Symbol", col.symbol) +
            pad("Price (FET)", col.price) +
            pad("Progress", col.progress) +
            "Status");
        console.log(hr);
        for (const t of tokens) {
            const name = truncate(t.name ?? "-", col.name - 2);
            const symbol = truncate(t.symbol ?? "-", col.symbol - 2);
            const priceRaw = t.price ?? 0;
            const price = formatPrice(priceRaw);
            const progressRaw = t.progress ?? 0;
            const progress = formatProgress(progressRaw);
            const status = t.listed === true || t.status === "listed"
                ? "Listed"
                : t.status ?? "Active";
            console.log(pad(name, col.name) +
                pad(symbol, col.symbol) +
                pad(price, col.price) +
                pad(progress, col.progress) +
                status);
        }
        console.log(hr);
        console.log(`\nShowing ${tokens.length} token(s). Use --limit to see more.\n`);
        console.log(`View on platform: https://agent-launch.ai`);
    });
}
// --- helpers ---
function pad(s, width) {
    return s.length >= width ? s.slice(0, width) : s + " ".repeat(width - s.length);
}
function truncate(s, maxLen) {
    return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
}
function formatPrice(raw) {
    const n = typeof raw === "string" ? parseFloat(raw) : raw;
    if (isNaN(n))
        return "-";
    if (n === 0)
        return "0 FET";
    if (n < 0.000001)
        return `${n.toExponential(2)} FET`;
    if (n < 1)
        return `${n.toFixed(6)} FET`;
    return `${n.toFixed(4)} FET`;
}
function formatProgress(raw) {
    const n = typeof raw === "string" ? parseFloat(raw) : raw;
    if (isNaN(n))
        return "-";
    return `${Math.min(100, Math.max(0, n)).toFixed(1)}%`;
}
//# sourceMappingURL=list.js.map