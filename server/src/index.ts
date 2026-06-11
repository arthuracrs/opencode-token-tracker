import express from "express"
import cors from "cors"
import { insertEntry, getStats, getRecent } from "./db.js"

const app = express()
app.use(cors())
app.use(express.json())

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

app.get("/api/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50
    const rows = await getRecent(limit)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`token-tracker server listening on http://localhost:${PORT}`)
})
