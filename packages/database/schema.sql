-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Core: Org, Users, RBAC
-- =========================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL, -- Changed citext to text as citext extension might not be enabled
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE (org_id, name)
);

CREATE TABLE org_members (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- =========================
-- Locations, Suppliers, Items
-- =========================
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name),
  UNIQUE (org_id, code)
);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'each', -- each, quart, tube, etc
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, sku)
);

-- Cost can vary per location or over time. Keep a current cost table plus optional history later.
CREATE TABLE item_costs (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  unit_cost numeric(12,4) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  effective_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, item_id, location_id, effective_at)
);

-- =========================
-- Ledger: Inventory Movements (source of truth)
-- =========================
CREATE TYPE movement_type AS ENUM (
  'RECEIPT',        -- PO received
  'CONSUME',        -- used on job/invoice
  'ADJUSTMENT',     -- manual correction
  'TRANSFER_OUT',   -- move to another location
  'TRANSFER_IN',    -- received from another location
  'RETURN'          -- returned to stock
);

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  movement movement_type NOT NULL,
  quantity numeric(18,4) NOT NULL CHECK (quantity >= 0),
  signed_quantity numeric(18,4) NOT NULL, -- positive or negative based on movement
  unit_cost numeric(12,4), -- optional for valuation at movement time
  reference_type text, -- invoice, po, transfer, adjustment
  reference_id uuid,
  reason_code text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_org_loc_item_time
  ON inventory_movements (org_id, location_id, item_id, occurred_at DESC);

CREATE INDEX idx_movements_org_time
  ON inventory_movements (org_id, occurred_at DESC);

-- =========================
-- Invoices (usage source)
-- =========================
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  external_source text, -- quickbooks, shopify, manual
  external_invoice_id text,
  invoice_number text,
  customer_name text,
  status text NOT NULL DEFAULT 'POSTED',
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, external_source, external_invoice_id)
);

CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity numeric(18,4) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,4),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_lines_org_item
  ON invoice_line_items (org_id, item_id);

-- =========================
-- Daily Snapshots and Usage Facts
-- =========================
CREATE TABLE inventory_snapshot_daily (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  day date NOT NULL,
  on_hand numeric(18,4) NOT NULL,
  inventory_value numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, location_id, item_id, day)
);

CREATE INDEX idx_snapshot_org_day
  ON inventory_snapshot_daily (org_id, day DESC);

CREATE TABLE usage_daily (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  day date NOT NULL,
  used_qty numeric(18,4) NOT NULL DEFAULT 0,
  used_value numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, location_id, item_id, day)
);

-- =========================
-- Lead Time and Replenishment Policy
-- =========================
CREATE TABLE lead_time_stats (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  avg_lead_time_days numeric(10,4) NOT NULL,
  stddev_lead_time_days numeric(10,4) NOT NULL DEFAULT 0,
  sample_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, item_id, location_id)
);

CREATE TABLE replenishment_policies (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_level numeric(5,4) NOT NULL DEFAULT 0.95, -- 0.90/0.95/0.99
  review_period_days int NOT NULL DEFAULT 1, -- daily review by default
  target_days_of_supply int NOT NULL DEFAULT 14,
  min_order_qty numeric(18,4) NOT NULL DEFAULT 0,
  order_multiple numeric(18,4) NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, item_id, location_id)
);

-- Materialized daily metrics (optional, can be a view if you want)
CREATE TABLE item_metrics_daily (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  day date NOT NULL,
  avg_daily_usage_30 numeric(18,6) NOT NULL DEFAULT 0,
  stddev_daily_usage_30 numeric(18,6) NOT NULL DEFAULT 0,
  reorder_point numeric(18,4) NOT NULL DEFAULT 0,
  safety_stock numeric(18,4) NOT NULL DEFAULT 0,
  days_on_hand numeric(18,6) NOT NULL DEFAULT 0,
  risk_score numeric(6,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, location_id, item_id, day)
);

-- =========================
-- Forecasting
-- =========================
CREATE TYPE forecast_model AS ENUM ('MA', 'EWMA', 'ARIMA', 'PROPHET', 'ML');

CREATE TABLE forecasts_daily (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  model forecast_model NOT NULL,
  day date NOT NULL,
  yhat numeric(18,6) NOT NULL,
  yhat_lower numeric(18,6),
  yhat_upper numeric(18,6),
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, location_id, item_id, model, day)
);

CREATE TABLE forecast_accuracy (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  model forecast_model NOT NULL,
  window_days int NOT NULL, -- 7/14/30
  as_of_day date NOT NULL,
  mae numeric(18,6) NOT NULL DEFAULT 0,
  rmse numeric(18,6) NOT NULL DEFAULT 0,
  mape numeric(18,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, location_id, item_id, model, window_days, as_of_day)
);

-- =========================
-- Alerts
-- =========================
CREATE TYPE alert_type AS ENUM ('LOW_STOCK', 'OVERSTOCK', 'DEAD_STOCK', 'LEAD_TIME_SPIKE');

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  severity int NOT NULL DEFAULT 2, -- 1 low, 2 med, 3 high
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN', -- OPEN, SNOOZED, RESOLVED
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_org_status
  ON alerts (org_id, status, opened_at DESC);

-- =========================
-- Reports (PDF/exports metadata)
-- =========================
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL, -- audit, valuation, aging, reorder_list
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  period_start date,
  period_end date,
  s3_key text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- Billing (Stripe sync)
-- =========================
CREATE TABLE subscriptions (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
