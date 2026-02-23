/**
 * CF-049: comments command
 *
 * agentlaunch comments <address> [--post <message>] [--json]
 *
 * Default action: list comments for a token.
 * With --post: post a new comment (requires API key).
 *
 * Endpoints:
 *   GET  /comments/{address}             List comments
 *   POST /comments/{address}  { message } Post a comment
 */

import { Command } from "commander";
import { apiGet, apiPost } from "../http.js";

interface Comment {
  id?: number;
  message?: string;
  userId?: number;
  user_id?: number;
  created_at?: string;
  createdAt?: string;
  user?: {
    address?: string;
    username?: string;
  };
}

interface CommentPostResponse {
  id?: number;
  message?: string;
  created_at?: string;
  createdAt?: string;
}

export function registerCommentsCommand(program: Command): void {
  program
    .command("comments <address>")
    .description("List or post comments for a token by its contract address")
    .option("--post <message>", "Post a new comment (requires API key)")
    .option("--json", "Output raw JSON (machine-readable)")
    .action(
      async (
        address: string,
        options: { post?: string; json?: boolean },
      ) => {
        const isJson = options.json === true;

        if (!address || address.trim().length < 10) {
          if (isJson) {
            console.log(JSON.stringify({ error: "Invalid token address" }));
          } else {
            console.error("Error: Please provide a valid token contract address.");
          }
          process.exit(1);
        }

        const addr = address.trim();

        // --- POST a new comment ---
        if (options.post !== undefined) {
          const message = options.post.trim();
          if (!message) {
            if (isJson) {
              console.log(JSON.stringify({ error: "--post message cannot be empty" }));
            } else {
              console.error("Error: --post message cannot be empty");
            }
            process.exit(1);
          }

          if (message.length > 500) {
            if (isJson) {
              console.log(JSON.stringify({ error: "--post message must be 500 characters or fewer" }));
            } else {
              console.error("Error: --post message must be 500 characters or fewer");
            }
            process.exit(1);
          }

          let result: CommentPostResponse;
          try {
            result = await apiPost<CommentPostResponse>(`/comments/${addr}`, { message });
          } catch (err) {
            if (isJson) {
              console.log(JSON.stringify({ error: (err as Error).message }));
            } else {
              console.error(`Error: ${(err as Error).message}`);
            }
            process.exit(1);
          }

          if (isJson) {
            console.log(JSON.stringify({ success: true, comment: result }));
            return;
          }

          console.log("Comment posted successfully.");
          if (result.id !== undefined) {
            console.log(`  ID:      ${result.id}`);
          }
          console.log(`  Message: ${result.message ?? message}`);
          const ts = result.createdAt ?? result.created_at;
          if (ts) {
            console.log(`  Posted:  ${new Date(ts).toUTCString()}`);
          }
          return;
        }

        // --- LIST comments ---
        let comments: Comment[];
        try {
          const response = await apiGet<Comment[] | { data?: Comment[]; comments?: Comment[] }>(
            `/comments/${addr}`,
          );
          // Handle both array responses and wrapped responses
          if (Array.isArray(response)) {
            comments = response;
          } else {
            comments = (response as { data?: Comment[]; comments?: Comment[] }).data ??
              (response as { data?: Comment[]; comments?: Comment[] }).comments ??
              [];
          }
        } catch (err) {
          if (isJson) {
            console.log(JSON.stringify({ error: (err as Error).message }));
          } else {
            console.error(`Error: ${(err as Error).message}`);
          }
          process.exit(1);
        }

        if (isJson) {
          console.log(JSON.stringify({ comments, total: comments.length }));
          return;
        }

        if (comments.length === 0) {
          console.log(`No comments found for ${addr}`);
          return;
        }

        console.log(`\nComments for ${addr}\n`);
        console.log("─".repeat(60));

        for (const c of comments) {
          const author =
            c.user?.username ??
            c.user?.address?.slice(0, 10) ??
            `user#${c.userId ?? c.user_id ?? "?"}`;
          const ts = c.createdAt ?? c.created_at;
          const dateStr = ts ? new Date(ts).toUTCString() : "";

          console.log(`[${c.id ?? "?"}] ${author}${dateStr ? "  " + dateStr : ""}`);
          console.log(`  ${c.message ?? ""}`);
          console.log();
        }

        console.log("─".repeat(60));
        console.log(`${comments.length} comment(s). Use --post "<message>" to add one.\n`);
      },
    );
}
