-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Direction enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_direction') THEN
    CREATE TYPE contract_direction AS ENUM ('IN', 'OUT');
  END IF;
END $$;

-- COMPANY
CREATE TABLE IF NOT EXISTS company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  stripe_id TEXT UNIQUE,
  credibility NUMERIC(5,2) CHECK (credibility IS NULL OR (credibility >= 0 AND credibility <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCT
CREATE TABLE IF NOT EXISTS product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  stripe_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONTRACT
CREATE TABLE IF NOT EXISTS contract (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction contract_direction NOT NULL,
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
  market_source TEXT NOT NULL, -- e.g. "London,UK" or "City:London;Country:UK"
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  currency CHAR(3) NOT NULL CHECK (char_length(currency) = 3),
  payment_due_date DATE,
  delivery_due_date DATE,
  delivery_price NUMERIC(12,2) CHECK (delivery_price IS NULL OR delivery_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contract_direction_product ON contract(direction, product_id);
CREATE INDEX IF NOT EXISTS idx_contract_company ON contract(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_payment_due ON contract(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_contract_delivery_due ON contract(delivery_due_date);

-- Auto-updated timestamps (simple trigger)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_updated_at') THEN
    CREATE TRIGGER trg_company_updated_at
    BEFORE UPDATE ON company
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_updated_at') THEN
    CREATE TRIGGER trg_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_updated_at') THEN
    CREATE TRIGGER trg_contract_updated_at
    BEFORE UPDATE ON contract
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  CREATE INDEX IF NOT EXISTS idx_contract_product_direction_market
  ON contract(product_id, direction, market_source);
END $$;