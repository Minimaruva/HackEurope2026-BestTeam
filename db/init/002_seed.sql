-- =========================
-- Seed: Companies (10)
-- =========================
INSERT INTO company (name, stripe_id, credibility) VALUES
  ('Arctic Harbor Logistics (Norway)',        NULL, 78.0),
  ('Sahara Commodities Group (Morocco)',      NULL, 61.5),
  ('Pacific Rim Trading (Singapore)',         NULL, 74.2),
  ('Andes Industrial Supply (Chile)',         NULL, 69.0),
  ('Gulf Meridian Energy (UAE)',              NULL, 66.8),
  ('Baltic Steelworks (Poland)',              NULL, 72.1),
  ('Nile Agro Exports (Egypt)',               NULL, 63.4),
  ('Great Lakes Manufacturing (USA)',         NULL, 70.7),
  ('Kanto Materials Co. (Japan)',             NULL, 76.3),
  ('Cape Coast Shipping (South Africa)',      NULL, 65.9)
ON CONFLICT (name) DO NOTHING;

-- =========================
-- Seed: Products (7)
-- =========================
INSERT INTO product (name, stripe_id) VALUES
  ('Crude Oil',         NULL),
  ('Steel',             NULL),
  ('Wheat',             NULL),
  ('Copper',            NULL),
  ('Lithium Carbonate', NULL),
  ('Timber',            NULL),
  ('Cement',            NULL)
ON CONFLICT (name) DO NOTHING;