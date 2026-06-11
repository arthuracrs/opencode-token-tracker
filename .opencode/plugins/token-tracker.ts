import { appendFile } from "node:fs/promises"
import { join } from "node:path"
import type { Plugin } from "@opencode-ai/plugin"

const LOG_FILE = "token-usage.jsonl"
const CENTRAL_URL = process.env.TOKEN_TRACKER_URL || "http://localhost:3838"

export const TokenTrackerPlugin: Plugin = async ({ directory }) => {
  const loggedMessages = new Set<string>()
  const projectDir = directory

  function postEntry(entry: Record<string, unknown>) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 3000)
    fetch(`${CENTRAL_URL}/api/usage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...entry, projectDir }),
      signal: ac.signal,
    }).catch(() => {
      /* fire-and-forget */
    }).finally(() => clearTimeout(timer))
  }

  return {
    event: async ({ event }) => {
      if (event.type === "message.updated") {
        const msg = event.properties.info
        if (msg.role !== "assistant" || !msg.id) return

        if (loggedMessages.has(msg.id)) return

        if (msg.tokens.input === 0 && msg.tokens.output === 0) return

        loggedMessages.add(msg.id)

        const entry = {
          timestamp: new Date().toISOString(),
          modelID: msg.modelID,
          providerID: msg.providerID,
          inputTokens: msg.tokens.input,
          outputTokens: msg.tokens.output,
          reasoningTokens: msg.tokens.reasoning,
          totalTokens: msg.tokens.input + msg.tokens.output,
          cacheRead: msg.tokens.cache.read,
          cacheWrite: msg.tokens.cache.write,
        }

        postEntry(entry)
        await appendFile(join(directory, LOG_FILE), JSON.stringify(entry) + "\n")
      }
    },
  }
}
