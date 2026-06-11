--liquibase formatted sql
--changeset token-tracker:003-seed-go-pricing

INSERT INTO model_pricing (model_id, provider_id, input_token_price, output_token_price, cache_read_token_price, cache_write_token_price, effective_from, currency) VALUES
  ('glm-5.1',         'opencode-go', 1.40,        4.40,        0.26,              0,       NOW(), 'USD'),
  ('glm-5',           'opencode-go', 1.00,        3.20,        0.20,              0,       NOW(), 'USD'),
  ('kimi-k2.6',       'opencode-go', 0.95,        4.00,        0.16,              0,       NOW(), 'USD'),
  ('kimi-k2.5',       'opencode-go', 0.60,        3.00,        0.10,              0,       NOW(), 'USD'),
  ('mimo-v2.5',       'opencode-go', 0.14,        0.28,        0.0028,            0,       NOW(), 'USD'),
  ('mimo-v2.5-pro',   'opencode-go', 1.74,        3.48,        0.0145,            0,       NOW(), 'USD'),
  ('minimax-m3',      'opencode-go', 0.30,        1.20,        0.06,              0,       NOW(), 'USD'),
  ('minimax-m2.7',    'opencode-go', 0.30,        1.20,        0.06,              0.375,   NOW(), 'USD'),
  ('minimax-m2.5',    'opencode-go', 0.30,        1.20,        0.06,              0.375,   NOW(), 'USD'),
  ('qwen3.7-max',     'opencode-go', 2.50,        7.50,        0.50,              3.125,   NOW(), 'USD'),
  ('deepseek-v4-pro',   'opencode-go', 1.74,      3.48,        0.0145,            0,       NOW(), 'USD'),
  ('deepseek-v4-flash', 'opencode-go', 0.14,      0.28,        0.0028,            0,       NOW(), 'USD');

-- Qwen Plus models have two pricing tiers: standard (≤ 256K) and extended (> 256K)
-- Standard tier (≤ 256K)
INSERT INTO model_pricing (model_id, provider_id, input_token_price, output_token_price, cache_read_token_price, cache_write_token_price, effective_from, currency) VALUES
  ('qwen3.7-plus', 'opencode-go', 0.40, 1.60, 0.04, 0.50, NOW(), 'USD'),
  ('qwen3.6-plus', 'opencode-go', 0.50, 3.00, 0.05, 0.625, NOW(), 'USD');

-- Extended tier (> 256K) — distinguished by a non-null effective_to
INSERT INTO model_pricing (model_id, provider_id, input_token_price, output_token_price, cache_read_token_price, cache_write_token_price, effective_from, effective_to, currency) VALUES
  ('qwen3.7-plus', 'opencode-go', 1.20, 4.80, 0.12, 1.50, NOW(), '2099-12-31T23:59:59Z', 'USD'),
  ('qwen3.6-plus', 'opencode-go', 2.00, 6.00, 0.20, 2.50, NOW(), '2099-12-31T23:59:59Z', 'USD');

--rollback DELETE FROM model_pricing WHERE provider_id = 'opencode-go';
