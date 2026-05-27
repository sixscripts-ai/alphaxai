-- ============================================================
-- Inventory Intelligence SaaS — Demo Seed Data
-- Run: psql postgresql://postgres:postgres@localhost:5433/inventory_saas -f seed.sql
-- ============================================================

-- Runs once on first database init via docker-entrypoint-initdb.d.
-- To re-run: TRUNCATE all tables or drop/recreate the volume.

-- ── 1. Organization ──────────────────────────────────────────
WITH org AS (
  INSERT INTO organizations (id, name) VALUES (gen_random_uuid(), 'Acme Corporation') RETURNING id
)
SELECT * INTO TEMP TABLE t_org FROM org;

-- ── 2. User ──────────────────────────────────────────────────
WITH usr AS (
  INSERT INTO users (id, email, password_hash, first_name, last_name)
  VALUES (gen_random_uuid(), 'admin@alphaxai.com', '$2b$10$Ke8miErxtMzPWJ/Sp19dfeEn9ZpdxkYjEiicnTQLjXdG3kRFflS1G', 'Admin', 'User')
  RETURNING id
)
SELECT * INTO TEMP TABLE t_usr FROM usr;

-- ── 3. Role + OrgMember ──────────────────────────────────────
WITH role AS (
  INSERT INTO roles (id, org_id, name)
  SELECT gen_random_uuid(), id, 'admin' FROM t_org RETURNING id
)
SELECT * INTO TEMP TABLE t_role FROM role;

INSERT INTO org_members (org_id, user_id, role_id)
SELECT t_org.id, t_usr.id, t_role.id FROM t_org, t_usr, t_role;

-- ── 4. Locations ─────────────────────────────────────────────
WITH locs AS (
  INSERT INTO locations (id, org_id, name, code, timezone)
  SELECT gen_random_uuid(), t_org.id, name, code, timezone
  FROM t_org, (VALUES
    ('Main Warehouse',        'WH-MAIN',     'America/Los_Angeles'),
    ('East Coast Distribution','DIST-EAST',  'America/New_York'),
    ('West Coast Fulfillment', 'FULFILL-WEST','America/Los_Angeles')
  ) AS loc(name, code, timezone)
  RETURNING id, name
)
SELECT id, name INTO TEMP TABLE t_locs FROM locs;

-- ── 5. Suppliers ─────────────────────────────────────────────
WITH supps AS (
  INSERT INTO suppliers (id, org_id, name, email, phone)
  SELECT gen_random_uuid(), t_org.id, name, email, phone
  FROM t_org, (VALUES
    ('TechSupply Co.',        'tech@techsupply.com',        '555-0100'),
    ('GlobalParts Inc.',      'orders@globalparts.com',     '555-0101'),
    ('MedEquip Distributors', 'sales@medequip.com',         '555-0102'),
    ('Office Essentials',     'contact@officeessentials.com','555-0103')
  ) AS sup(name, email, phone)
  RETURNING id, name
)
SELECT id, name INTO TEMP TABLE t_supps FROM supps;

INSERT INTO supplier_categories (id, supplier_id, name)
SELECT gen_random_uuid(), t_supps.id, cat.name
FROM t_supps
JOIN (VALUES
  ('TechSupply Co.',        'Electronics'),
  ('TechSupply Co.',        'Accessories'),
  ('GlobalParts Inc.',      'Industrial'),
  ('MedEquip Distributors', 'Medical'),
  ('Office Essentials',     'Office')
) AS cat(sname, name) ON cat.sname = t_supps.name;

-- ── 6. Items ─────────────────────────────────────────────────
WITH items AS (
  INSERT INTO items (id, org_id, sku, name, description, unit, category)
  SELECT gen_random_uuid(), t_org.id, sku, name, description, unit, category
  FROM t_org, (VALUES
    ('ELE-001', 'Laptop Stand Pro',       'Adjustable aluminum laptop stand, 10-17 inch',            'each', 'Electronics'),
    ('ELE-002', 'USB-C Hub 7-in-1',      'Multi-port USB-C hub with HDMI, SD, USB 3.0',             'each', 'Electronics'),
    ('ELE-003', 'Wireless Mouse M1',      'Ergonomic wireless mouse, 2.4GHz + Bluetooth',            'each', 'Electronics'),
    ('MED-001', 'ECG Monitor HM100',      'Hospital-grade ECG monitor with 12-lead support',          'each', 'Medical'),
    ('MED-002', 'Surgical Gloves Box',    'Latex-free surgical gloves, box of 100',                   'box',  'Medical'),
    ('MED-003', 'Face Shield Pro',        'Anti-fog face shield with foam headband',                  'each', 'Medical'),
    ('FUR-001', 'Ergonomic Chair Pro',    'Mesh back ergonomic chair with lumbar support',            'each', 'Office'),
    ('FUR-002', 'Standing Desk Adjustable','Electric height-adjustable standing desk 60x30',          'each', 'Office'),
    ('FUR-003', 'Monitor Arm Dual',       'Heavy-duty dual monitor arm, VESA compatible',             'each', 'Office'),
    ('IND-001', 'Safety Goggles',         'ANSI Z87.1 rated safety goggles, anti-scratch',            'each', 'Industrial'),
    ('IND-002', 'Work Gloves Heavy',      'Cut-resistant work gloves, level 5',                       'pair', 'Industrial'),
    ('IND-003', 'Tool Kit 40pc',          '40-piece general purpose tool kit with case',              'each', 'Industrial')
  ) AS it(sku, name, description, unit, category)
  RETURNING id, sku, name
)
SELECT id, sku, name INTO TEMP TABLE t_items FROM items;

-- ── 7. Item Costs (per location) ─────────────────────────────
INSERT INTO item_costs (org_id, item_id, location_id, unit_cost, effective_at)
SELECT t_org.id, t_items.id, t_locs.id, cost.tbl, NOW()
FROM t_org, t_items, t_locs, (VALUES
  ('ELE-001', 45.50), ('ELE-002', 32.00), ('ELE-003', 28.00),
  ('MED-001', 250.00),('MED-002', 18.75), ('MED-003', 12.50),
  ('FUR-001', 450.00),('FUR-002', 680.00),('FUR-003', 85.00),
  ('IND-001', 8.50),  ('IND-002', 15.00), ('IND-003', 120.00)
) AS cost(sku, tbl)
WHERE cost.sku = t_items.sku;

-- ── 8. Inventory Movements — Receipts (stock-in) ──────────────
-- Main Warehouse — full inventory
INSERT INTO inventory_movements (org_id, location_id, item_id, movement, quantity, signed_quantity, unit_cost, occurred_at)
SELECT t_org.id, (SELECT id FROM t_locs WHERE name = 'Main Warehouse'), t_items.id, 'RECEIPT',
  stocks.qty, stocks.qty, stocks.cost, NOW() - INTERVAL '7 days'
FROM t_org, t_items, (VALUES
  ('ELE-001', 150, 45.50), ('ELE-002', 200, 32.00), ('ELE-003', 180, 28.00),
  ('MED-001', 25,  250.00),('MED-002', 500, 18.75), ('MED-003', 300, 12.50),
  ('FUR-001', 20,  450.00),('FUR-002', 15,  680.00),('FUR-003', 50,  85.00),
  ('IND-001', 400, 8.50),  ('IND-002', 250, 15.00), ('IND-003', 60,  120.00)
) AS stocks(sku, qty, cost)
WHERE stocks.sku = t_items.sku;

-- East Coast — subset
INSERT INTO inventory_movements (org_id, location_id, item_id, movement, quantity, signed_quantity, unit_cost, occurred_at)
SELECT t_org.id, (SELECT id FROM t_locs WHERE name = 'East Coast Distribution'), t_items.id, 'RECEIPT',
  stocks.qty, stocks.qty, stocks.cost, NOW() - INTERVAL '6 days'
FROM t_org, t_items, (VALUES
  ('ELE-001', 60, 45.50), ('ELE-002', 80, 32.00),
  ('MED-001', 10, 250.00),('MED-002', 200, 18.75), ('MED-003', 100, 12.50),
  ('FUR-001', 8,  450.00),
  ('IND-001', 100, 8.50), ('IND-002', 80, 15.00)
) AS stocks(sku, qty, cost)
WHERE stocks.sku = t_items.sku;

-- West Coast — subset
INSERT INTO inventory_movements (org_id, location_id, item_id, movement, quantity, signed_quantity, unit_cost, occurred_at)
SELECT t_org.id, (SELECT id FROM t_locs WHERE name = 'West Coast Fulfillment'), t_items.id, 'RECEIPT',
  stocks.qty, stocks.qty, stocks.cost, NOW() - INTERVAL '5 days'
FROM t_org, t_items, (VALUES
  ('ELE-002', 60, 32.00), ('ELE-003', 100, 28.00),
  ('MED-002', 150, 18.75),
  ('FUR-002', 5, 680.00), ('FUR-003', 20, 85.00),
  ('IND-003', 20, 120.00)
) AS stocks(sku, qty, cost)
WHERE stocks.sku = t_items.sku;

-- ── 9. Inventory Movements — Consumption (stock-out) ─────────
INSERT INTO inventory_movements (org_id, location_id, item_id, movement, quantity, signed_quantity, unit_cost, occurred_at)
SELECT t_org.id, t_locs.id, t_items.id, 'CONSUME', cons.qty, -cons.qty, costs.unit_cost,
  NOW() - (cons.day_offset || ' days')::INTERVAL
FROM t_org, t_items, t_locs, item_costs costs, (VALUES
  ('ELE-001','Main Warehouse',        5,  5),  ('ELE-002','Main Warehouse',        8,  3),
  ('ELE-003','Main Warehouse',        6,  4),  ('MED-002','Main Warehouse',        30, 2),
  ('MED-003','Main Warehouse',        20, 3),  ('FUR-001','Main Warehouse',        1,  10),
  ('IND-001','Main Warehouse',        25, 2),  ('IND-002','Main Warehouse',        10, 6),
  ('IND-003','Main Warehouse',        2,  8),
  ('ELE-001','East Coast Distribution',3,  7), ('ELE-002','East Coast Distribution',5,  4),
  ('MED-002','East Coast Distribution',15, 3), ('MED-003','East Coast Distribution',10, 5),
  ('IND-001','East Coast Distribution',10, 4),
  ('ELE-002','West Coast Fulfillment', 4,  6), ('ELE-003','West Coast Fulfillment', 8,  3),
  ('FUR-003','West Coast Fulfillment', 2,  9), ('IND-003','West Coast Fulfillment', 1,  12)
) AS cons(sku, loc_name, qty, day_offset)
WHERE cons.sku = t_items.sku AND cons.loc_name = t_locs.name
  AND costs.item_id = t_items.id AND costs.location_id = t_locs.id;

-- Heavy consumption to trigger low-stock alerts
INSERT INTO inventory_movements (org_id, location_id, item_id, movement, quantity, signed_quantity, unit_cost, occurred_at)
SELECT t_org.id, (SELECT id FROM t_locs WHERE name = 'Main Warehouse'), t_items.id, 'CONSUME',
  cons.qty, -cons.qty, item_costs.unit_cost, NOW() - INTERVAL '2 days'
FROM t_org, t_items, item_costs, (VALUES ('FUR-002', 12), ('MED-001', 18), ('ELE-001', 130))
  AS cons(sku, qty)
WHERE cons.sku = t_items.sku
  AND item_costs.item_id = t_items.id
  AND item_costs.location_id = (SELECT id FROM t_locs WHERE name = 'Main Warehouse');

-- ── 10. Daily Usage (last 30 days) ────────────────────────────
INSERT INTO usage_daily (org_id, location_id, item_id, day, used_qty, used_value)
SELECT t_org.id, t_locs.id, t_items.id, day::date,
  (random() * 3 + 1)::int,
  ((random() * 3 + 1)::int) * costs.unit_cost
FROM t_org, t_items, t_locs, item_costs costs,
  generate_series(CURRENT_DATE - 30, CURRENT_DATE - 1, '1 day') AS day,
  (VALUES
    ('ELE-001','Main Warehouse'),('ELE-001','East Coast Distribution'),
    ('ELE-002','Main Warehouse'),('ELE-002','East Coast Distribution'),('ELE-002','West Coast Fulfillment'),
    ('ELE-003','Main Warehouse'),('ELE-003','West Coast Fulfillment'),
    ('MED-002','Main Warehouse'),('MED-002','East Coast Distribution'),('MED-002','West Coast Fulfillment'),
    ('IND-001','Main Warehouse'),('IND-001','East Coast Distribution')
  ) AS filter(sku, loc_name)
WHERE filter.sku = t_items.sku AND filter.loc_name = t_locs.name
  AND costs.item_id = t_items.id AND costs.location_id = t_locs.id;

-- ── 11. Daily Inventory Snapshots (last 30 days) ─────────────
INSERT INTO inventory_snapshot_daily (org_id, location_id, item_id, day, on_hand, inventory_value)
SELECT t_org.id, t_locs.id, t_items.id, day::date,
  GREATEST(0, base.base_qty - ((row_number() OVER (PARTITION BY t_items.id, t_locs.id ORDER BY day) - 1) * base.daily_use)),
  GREATEST(0, base.base_qty - ((row_number() OVER (PARTITION BY t_items.id, t_locs.id ORDER BY day) - 1) * base.daily_use)) * costs.unit_cost
FROM t_org, t_items, t_locs, item_costs costs,
  generate_series(CURRENT_DATE - 30, CURRENT_DATE - 1, '1 day') AS day,
  (VALUES
    ('ELE-001','Main Warehouse',      145, 0),  ('ELE-001','East Coast Distribution',57, 0),
    ('ELE-002','Main Warehouse',      192, 0),  ('ELE-002','East Coast Distribution',75, 0),
    ('ELE-002','West Coast Fulfillment',56, 0), ('ELE-003','Main Warehouse',        174, 0),
    ('ELE-003','West Coast Fulfillment',92, 0), ('MED-001','Main Warehouse',        7,   1),
    ('MED-002','Main Warehouse',      470, 0),  ('MED-002','East Coast Distribution',185, 0),
    ('MED-002','West Coast Fulfillment',150, 0), ('MED-003','Main Warehouse',       280, 0),
    ('MED-003','East Coast Distribution',90, 0), ('FUR-001','Main Warehouse',       19,  0),
    ('FUR-002','Main Warehouse',      3,   0),  ('FUR-003','Main Warehouse',       48,  0),
    ('FUR-003','West Coast Fulfillment',18, 0), ('IND-001','Main Warehouse',       375, 0),
    ('IND-001','East Coast Distribution',90, 0), ('IND-002','Main Warehouse',       240, 0),
    ('IND-003','Main Warehouse',      58,  0),  ('IND-003','West Coast Fulfillment',19,  0)
  ) AS base(sku, loc_name, base_qty, daily_use)
WHERE base.sku = t_items.sku AND base.loc_name = t_locs.name
  AND costs.item_id = t_items.id AND costs.location_id = t_locs.id;

-- ── 12. Lead Time Stats ───────────────────────────────────────
INSERT INTO lead_time_stats (org_id, supplier_id, item_id, location_id, avg_lead_time_days, stddev_lead_time_days, sample_count)
SELECT t_org.id, t_supps.id, t_items.id, t_locs.id,
  lead.avg_lead, lead.stddev, 20
FROM t_org, t_items, t_locs, t_supps, (VALUES
  ('ELE-001','TechSupply Co.', 7,  2),   ('ELE-002','TechSupply Co.', 5,  1.5),
  ('ELE-003','TechSupply Co.', 6,  2),   ('MED-001','MedEquip Distributors', 14, 4),
  ('MED-002','MedEquip Distributors', 4, 1), ('MED-003','MedEquip Distributors', 8, 2.5),
  ('FUR-001','Office Essentials', 10, 3),    ('FUR-002','Office Essentials', 12, 4),
  ('FUR-003','Office Essentials', 7,  2),    ('IND-001','GlobalParts Inc.', 4,   1),
  ('IND-002','GlobalParts Inc.', 5,  1.5),   ('IND-003','GlobalParts Inc.', 6,   2)
) AS lead(sku, sname, avg_lead, stddev)
WHERE lead.sku = t_items.sku AND lead.sname = t_supps.name;

-- ── 13. Shipments ─────────────────────────────────────────────
WITH ships AS (
  INSERT INTO shipments (id, org_id, tracking_number, carrier, status, origin, destination,
    estimated_delivery, actual_delivery, weight, cost, created_at)
  SELECT gen_random_uuid(), t_org.id, tracking, carrier, status, origin, dest,
    NOW() + INTERVAL '3 days',
    CASE WHEN status = 'DELIVERED' THEN NOW() - INTERVAL '1 day' ELSE NULL END,
    weight, cost, NOW() - INTERVAL '5 days'
  FROM t_org, (VALUES
    ('1Z999AA10123456784','UPS','IN_TRANSIT','Main Warehouse','East Coast Distribution', 45.5,  120.00),
    ('1Z999AA10123456785','UPS','DELIVERED','Main Warehouse','West Coast Fulfillment',   120.0, 250.00),
    ('940011189922345678','USPS','PICKED_UP','Main Warehouse','East Coast Distribution',  12.0,  35.00),
    ('1Z999AA10123456786','UPS','DELIVERED','Main Warehouse','West Coast Fulfillment',   80.0,  180.00),
    ('7890123456','FEDEX','IN_TRANSIT','East Coast Distribution','Main Warehouse',        30.0,  95.00)
  ) AS sh(tracking, carrier, status, origin, dest, weight, cost)
  RETURNING id, tracking_number
)
SELECT id, tracking_number INTO TEMP TABLE t_ships FROM ships;

INSERT INTO shipment_items (shipment_id, item_id, quantity)
SELECT t_ships.id, t_items.id, si.qty
FROM t_ships, t_items, (VALUES
  ('1Z999AA10123456784', 'ELE-002', 20),
  ('1Z999AA10123456784', 'MED-002', 50),
  ('1Z999AA10123456784', 'IND-001', 30),
  ('1Z999AA10123456785', 'FUR-002', 3),
  ('1Z999AA10123456785', 'FUR-003', 5),
  ('1Z999AA10123456786', 'ELE-001', 15),
  ('1Z999AA10123456786', 'ELE-003', 10),
  ('7890123456',         'MED-001', 2),
  ('7890123456',         'MED-003', 25)
) AS si(tracking, sku, qty)
WHERE si.tracking = t_ships.tracking_number AND si.sku = t_items.sku;

-- ── 14. Alerts ────────────────────────────────────────────────
INSERT INTO alerts (org_id, location_id, item_id, type, severity, title, message, status)
SELECT t_org.id, t_locs.id, t_items.id, 'LOW_STOCK', 2,
  'Low Stock: ' || t_items.name,
  t_items.name || ' (' || t_items.sku || ') is running low at Main Warehouse. Current stock is below reorder threshold.',
  'OPEN'
FROM t_org, t_items, t_locs
WHERE t_locs.name = 'Main Warehouse' AND t_items.sku IN ('MED-001', 'FUR-002');

INSERT INTO alerts (org_id, location_id, item_id, type, severity, title, message, status)
SELECT t_org.id, t_locs.id, t_items.id, 'OVERSTOCK', 1,
  'Overstock: ' || t_items.name,
  t_items.name || ' (' || t_items.sku || ') has excess inventory at Main Warehouse. Consider reducing order quantity.',
  'OPEN'
FROM t_org, t_items, t_locs
WHERE t_locs.name = 'Main Warehouse' AND t_items.sku IN ('IND-001');

-- ── 15. Invoices ──────────────────────────────────────────────
WITH invs AS (
  INSERT INTO invoices (id, org_id, location_id, external_source, external_invoice_id, invoice_number, customer_name, status, issued_at)
  SELECT gen_random_uuid(), t_org.id, t_locs.id, 'manual', inv_num, inv_num, customer, status, NOW() - INTERVAL '10 days'
  FROM t_org, t_locs, (VALUES
    ('INV-001', 'Acme Corp Internal', 'POSTED',  'Main Warehouse'),
    ('INV-002', 'Acme Corp Internal', 'POSTED',  'East Coast Distribution'),
    ('INV-003', 'Acme Corp Internal', 'PENDING', 'West Coast Fulfillment')
  ) AS i(inv_num, customer, status, loc_name)
  WHERE i.loc_name = t_locs.name
  RETURNING id, invoice_number
)
SELECT id, invoice_number INTO TEMP TABLE t_invs FROM invs;

INSERT INTO invoice_line_items (org_id, invoice_id, item_id, quantity, unit_price)
SELECT t_org.id, t_invs.id, t_items.id, li.qty, li.price
FROM t_org, t_invs, t_items, (VALUES
  ('INV-001', 'ELE-002', 20, 32.00),
  ('INV-001', 'MED-002', 50, 18.75),
  ('INV-002', 'IND-001', 30, 8.50),
  ('INV-003', 'FUR-003', 5,  85.00),
  ('INV-003', 'ELE-001', 10, 45.50)
) AS li(inv_num, sku, qty, price)
WHERE li.inv_num = t_invs.invoice_number AND li.sku = t_items.sku;

-- ── 16. Forecasts (last 7 days history + next 14 days) ────────
INSERT INTO forecasts_daily (org_id, location_id, item_id, model, day, yhat, yhat_lower, yhat_upper)
SELECT t_org.id, t_locs.id, t_items.id, 'ML', day::date,
  base.base_qty + row_number() OVER (PARTITION BY t_items.id, t_locs.id ORDER BY day) * base.trend,
  base.base_qty + row_number() OVER (PARTITION BY t_items.id, t_locs.id ORDER BY day) * base.trend - 5,
  base.base_qty + row_number() OVER (PARTITION BY t_items.id, t_locs.id ORDER BY day) * base.trend + 5
FROM t_org, t_items, t_locs, generate_series(CURRENT_DATE - 7, CURRENT_DATE + 14, '1 day') AS day,
  (VALUES
    ('ELE-001','Main Warehouse',  5,  0.1),
    ('ELE-002','Main Warehouse',  8,  0.2),
    ('MED-002','Main Warehouse',  30, 0.5),
    ('FUR-001','Main Warehouse',  1,  0.0)
  ) AS base(sku, loc_name, base_qty, trend)
WHERE base.sku = t_items.sku AND base.loc_name = t_locs.name;

-- ── 17. Item Metrics Daily ────────────────────────────────────
INSERT INTO item_metrics_daily (org_id, location_id, item_id, day, avg_daily_usage_30, stddev_daily_usage_30, reorder_point, safety_stock, days_on_hand, risk_score)
SELECT t_org.id, t_locs.id, t_items.id, CURRENT_DATE,
  metrics.avg_usage, metrics.stddev, metrics.reorder_pt, metrics.safety, metrics.days_oh, metrics.risk
FROM t_org, t_items, t_locs, (VALUES
  ('ELE-001','Main Warehouse', 5,  2,  20, 15, 30, 1),
  ('ELE-002','Main Warehouse', 8,  3,  30, 24, 24, 2),
  ('ELE-003','Main Warehouse', 6,  2,  25, 18, 29, 2),
  ('MED-001','Main Warehouse', 1,  1,  5,  5,  7,  4),
  ('MED-002','Main Warehouse', 30, 8,  100,50, 16, 3),
  ('MED-003','Main Warehouse', 20, 5,  200,60, 14, 3),
  ('FUR-001','Main Warehouse', 1,  0,  3,  3,  19, 1),
  ('FUR-002','Main Warehouse', 0,  0,  2,  1,  4,  5),
  ('FUR-003','Main Warehouse', 2,  1,  10, 6,  24, 2),
  ('IND-001','Main Warehouse', 25, 10, 150,75, 15, 2),
  ('IND-002','Main Warehouse', 10, 4,  100,30, 24, 1),
  ('IND-003','Main Warehouse', 2,  1,  15, 6,  29, 1)
) AS metrics(sku, loc_name, avg_usage, stddev, reorder_pt, safety, days_oh, risk)
WHERE metrics.sku = t_items.sku AND metrics.loc_name = t_locs.name;

-- ── 18. Replenishment Policies ─────────────────────────────────
INSERT INTO replenishment_policies (org_id, item_id, location_id, service_level, review_period_days, target_days_of_supply, min_order_qty, order_multiple)
SELECT t_org.id, t_items.id, t_locs.id, 0.95, 1, 14,
  CASE WHEN t_items.sku IN ('MED-002','MED-003','IND-001','IND-002') THEN 50 ELSE 5 END,
  CASE WHEN t_items.sku IN ('MED-002','MED-003','IND-001','IND-002') THEN 25 ELSE 1 END
FROM t_org, t_items, t_locs
WHERE t_locs.name = 'Main Warehouse';

-- ═══════════════════════════════════════════════════════════════
-- Summary
-- ═══════════════════════════════════════════════════════════════
SELECT '✅ Seed complete!' AS result,
  (SELECT count(*)::text || ' organizations' FROM organizations),
  (SELECT count(*)::text || ' users' FROM users),
  (SELECT count(*)::text || ' locations' FROM locations),
  (SELECT count(*)::text || ' suppliers' FROM suppliers),
  (SELECT count(*)::text || ' items' FROM items),
  (SELECT count(*)::text || ' movements' FROM inventory_movements),
  (SELECT count(*)::text || ' shipments' FROM shipments),
  (SELECT count(*)::text || ' alerts' FROM alerts);

-- Cleanup temp tables (not strictly needed — session ends)
DROP TABLE IF EXISTS t_org, t_usr, t_role, t_locs, t_supps, t_items, t_ships, t_invs;
