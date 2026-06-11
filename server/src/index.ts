import express from "express"
import cors from "cors"
import { insertEntry, getStats, getModelStats } from "./db.js"
import { initPricing, calculateCost, getPricingData, getAllCalculators } from "./pricing.js"

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

const PORT = Number(process.env.PORT) || 3838

app.post("/api/usage", async (req, res) => {
  try {
    const id = await insertEntry(req.body)
    res.json({ ok: true, id })
  } catch (err) {
    console.error("insert error:", err)
    res.status(500).json({ ok: false, error: String(err) })
  }
})

app.get("/api/stats", async (_req, res) => {
  try {
    const stats = await getStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.get("/api/pricing", async (_req, res) => {
  try {
    const prices = await getPricingData()
    res.json({
      providers: getAllCalculators(),
      prices,
      currency: "USD",
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.post("/api/estimate-cost", (req, res) => {
  try {
    const { modelID, providerID, inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheWrite = 0 } = req.body
    const result = calculateCost({ modelID, providerID, inputTokens, outputTokens, cacheRead, cacheWrite })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.get("/api/costs", async (_req, res) => {
  try {
    const modelStats = await getModelStats()
    const perModel = modelStats.map(row => {
      const result = calculateCost({
        modelID: row.model_id,
        providerID: row.provider_id,
        inputTokens: Number(row.input_tokens),
        outputTokens: Number(row.output_tokens),
        cacheRead: Number(row.cache_read),
        cacheWrite: Number(row.cache_write),
      })
      return {
        project_dir: row.project_dir,
        model_id: row.model_id,
        provider_id: row.provider_id,
        requests: Number(row.requests),
        input_tokens: Number(row.input_tokens),
        output_tokens: Number(row.output_tokens),
        cache_read: Number(row.cache_read),
        cache_write: Number(row.cache_write),
        total_tokens: Number(row.total_tokens),
        cost: result.cost,
        currency: result.currency,
      }
    })

    const perProject: Record<string, { requests: number; total_tokens: number; total_cost: number; currency: string }> = {}
    for (const m of perModel) {
      if (!perProject[m.project_dir]) {
        perProject[m.project_dir] = { requests: 0, total_tokens: 0, total_cost: 0, currency: "USD" }
      }
      perProject[m.project_dir].requests += m.requests
      perProject[m.project_dir].total_tokens += m.total_tokens
      if (m.cost !== null) perProject[m.project_dir].total_cost += m.cost
    }

    res.json({ perModel, perProject })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

async function start() {
  try {
    await initPricing()
  } catch (err) {
    console.warn("pricing DB not available, using in-memory defaults:", err)
  }

  app.listen(PORT, () => {
    console.log(`token-tracker server listening on http://localhost:${PORT}`)
  })
}

start()
