import pg from "pg"

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "tokentracker",
  password: process.env.DB_PASSWORD || "tokentracker",
  database: process.env.DB_NAME || "tokentracker",
})

export interface TokenEntry {
  timestamp: string
  modelID: string
  providerID: string
  projectDir: string
  inputTokens?: number
  outputTokens?: number
  reasoningTokens?: number
  totalTokens?: number
  cacheRead?: number
  cacheWrite?: number
}

export async function insertEntry(entry: TokenEntry) {
  const { rows } = await pool.query(
    `INSERT INTO token_usage
      (timestamp, model_id, provider_id, project_dir,
       input_tokens, output_tokens, reasoning_tokens, total_tokens,
       cache_read, cache_write)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      entry.timestamp,
      entry.modelID,
      entry.providerID,
      entry.projectDir,
      entry.inputTokens ?? null,
      entry.outputTokens ?? null,
      entry.reasoningTokens ?? null,
      entry.totalTokens ?? null,
      entry.cacheRead ?? null,
      entry.cacheWrite ?? null,
    ],
  )
  return rows[0].id as number
}

export async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      project_dir,
      COUNT(*)           AS requests,
      SUM(total_tokens)  AS total_tokens,
      SUM(input_tokens)  AS input_tokens,
      SUM(output_tokens) AS output_tokens,
      SUM(reasoning_tokens) AS reasoning_tokens,
      MIN(timestamp)     AS first_usage,
      MAX(timestamp)     AS last_usage
    FROM token_usage
    GROUP BY project_dir
    ORDER BY requests DESC
  `)
  return rows
}

export async function getRecent(limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM token_usage ORDER BY timestamp DESC LIMIT $1`,
    [limit],
  )
  return rows
}
