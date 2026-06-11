import { pool } from "./db.js"

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheRead: number
  cacheWrite: number
}

export type CostCalculator = (usage: TokenUsage) => number

interface ModelPricingEntry {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

type CalculatorRegistry = Record<string, Record<string, CostCalculator>>

const calculators: CalculatorRegistry = {}

function standardCalculator(pricing: ModelPricingEntry): CostCalculator {
  return (usage: TokenUsage) => {
    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output
    const cacheReadCost = (usage.cacheRead / 1_000_000) * pricing.cacheRead
    const cacheWriteCost = (usage.cacheWrite / 1_000_000) * pricing.cacheWrite
    return inputCost + outputCost + cacheReadCost + cacheWriteCost
  }
}

function qwenPlusCalculator(base: ModelPricingEntry, extended: ModelPricingEntry): CostCalculator {
  return (usage: TokenUsage) => {
    const totalInput = usage.inputTokens + usage.cacheWrite
    const pricing = totalInput > 256_000 ? extended : base
    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output
    const cacheReadCost = (usage.cacheRead / 1_000_000) * pricing.cacheRead
    const cacheWriteCost = (usage.cacheWrite / 1_000_000) * pricing.cacheWrite
    return inputCost + outputCost + cacheReadCost + cacheWriteCost
  }
}

export async function initPricing() {
  const { rows } = await pool.query(`
    SELECT model_id, provider_id, input_token_price, output_token_price,
           cache_read_token_price, cache_write_token_price, effective_to
    FROM model_pricing
    WHERE effective_from <= NOW()
      AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY model_id, provider_id, effective_from
  `)

  const byKey: Record<string, ModelPricingEntry[]> = {}

  for (const row of rows) {
    const key = `${row.provider_id}::${row.model_id}`
    if (!byKey[key]) byKey[key] = []
    byKey[key].push({
      input: Number(row.input_token_price),
      output: Number(row.output_token_price),
      cacheRead: Number(row.cache_read_token_price),
      cacheWrite: Number(row.cache_write_token_price),
    })
  }

  for (const [key, prices] of Object.entries(byKey)) {
    const [providerID, modelID] = key.split("::")
    calculators[providerID] ??= {}

    if (prices.length === 1) {
      calculators[providerID][modelID] = standardCalculator(prices[0])
    } else {
      const isQwenPlus = modelID === "qwen3.7-plus" || modelID === "qwen3.6-plus"
      if (isQwenPlus && prices.length === 2) {
        const [base, extended] = prices
        calculators[providerID][modelID] = qwenPlusCalculator(base, extended)
      } else {
        calculators[providerID][modelID] = standardCalculator(prices[0])
      }
    }
  }

  console.log(`pricing: loaded ${Object.keys(byKey).length} model price entries`)
}

export async function getPricingData(): Promise<Record<string, ModelPricingEntry>> {
  const { rows } = await pool.query(`
    SELECT model_id, provider_id, input_token_price, output_token_price,
           cache_read_token_price, cache_write_token_price, effective_to
    FROM model_pricing
    WHERE effective_from <= NOW()
      AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY model_id, provider_id, effective_from
  `)

  const result: Record<string, ModelPricingEntry> = {}

  for (const row of rows) {
    const key = row.effective_to ? `${row.model_id}-extended` : row.model_id
    if (!result[key]) {
      result[key] = {
        input: Number(row.input_token_price),
        output: Number(row.output_token_price),
        cacheRead: Number(row.cache_read_token_price),
        cacheWrite: Number(row.cache_write_token_price),
      }
    }
  }

  return result
}

export interface EstimateRequest {
  modelID: string
  providerID: string
  inputTokens: number
  outputTokens: number
  cacheRead: number
  cacheWrite: number
}

export function calculateCost(params: EstimateRequest): { cost: number | null; currency: string; note?: string } {
  const providerCalcs = calculators[params.providerID]
  if (!providerCalcs) return { cost: null, currency: "USD", note: `No calculator for provider "${params.providerID}"` }

  const calc = providerCalcs[params.modelID]
  if (!calc) return { cost: null, currency: "USD", note: `No calculator for model "${params.modelID}" under provider "${params.providerID}"` }

  const cost = calc({
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cacheRead: params.cacheRead,
    cacheWrite: params.cacheWrite,
  })

  return { cost, currency: "USD" }
}

export function getAllCalculators(): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [provider, calcs] of Object.entries(calculators)) {
    result[provider] = Object.keys(calcs)
  }
  return result
}
