-- =====================================================================
-- OPTIONAL sample data for the Invoice + Accounts & Finance modules
-- =====================================================================
-- Start the backend once first (so the tables exist), then:
--   psql -U postgres -d MainDatabase -f invoice-finance-sample-data.sql
-- Dates are relative to today, so the charts always show the last 6 months.
-- MONEY IN comes from the invoices below (a PAID invoice = money received on
-- its paid_date); the ledger table only holds MONEY OUT (expenses).
-- Safe to run twice: invoices are added only while you have fewer than 5, and
-- expenses / budgets / company settings only when their tables are empty.
-- Company details below are SAMPLE values - replace them in Settings.

-- ---------- company settings (id is always 1) ----------
INSERT INTO company_settings (id, name, tagline, address_line, phone, email, gstin,
    bank_account_name, bank_name, bank_account_number, bank_ifsc, bank_upi, terms,
    default_gst, due_days, opening_balance)
VALUES (1, 'Tirth Electrical & Services', 'Wiring, panels, lighting and maintenance',
    'Unit 12, Industrial Estate Road, Mumbai, Maharashtra 400001', '+91 98765 43210',
    'billing@tirthelectrical.example', '27ABCDE1234F1Z5',
    'Tirth Electrical & Services', 'State Bank of India', '0000 1234 5678', 'SBIN0000000',
    'tirthelectrical@sbi',
    E'Payment is due on or before the due date shown above.\nGoods once installed are covered by the manufacturer''s warranty only.\nSubject to Mumbai jurisdiction.',
    18, 14, 250000.00)
ON CONFLICT (id) DO NOTHING;

-- ---------- monthly budgets ----------
INSERT INTO finance_budget (category, monthly_limit) VALUES
    ('Materials', 60000), ('Labour & Salaries', 55000), ('Equipment', 20000),
    ('Transport', 15000), ('Rent & Utilities', 24000), ('Tax & Compliance', 18000), ('Other', 10000)
ON CONFLICT (category) DO NOTHING;

-- ---------- invoices (money in) ----------
-- Codes continue after your highest existing INV number.
DO $$
DECLARE
    base INTEGER;
BEGIN
    IF (SELECT COUNT(*) FROM invoice) >= 5 THEN
        RAISE NOTICE 'Skipping demo invoices: you already have 5 or more invoices.';
        RETURN;
    END IF;

    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '[0-9]+$') AS INTEGER)), 0) INTO base FROM invoice;

    WITH src(n, client, title, status, months_ago, day, issue_off, due_off, gst_rate, discount, amount,
             client_address, client_phone, client_email, client_gstin, notes) AS (VALUES
    (1, 'Sunrise Towers', 'Wiring and panel installation, Tower A', 'PAID', 5, 3, 0, 0, 18, 0, 118000.00, '12, Link Road, Andheri West, Mumbai 400053', '+91 98200 10001', 'accounts@sunrisetowers.example', NULL::varchar, NULL::varchar),
    (2, 'City Mall', 'Annual maintenance visit', 'PAID', 5, 20, 0, 0, 18, 0, 56640.00, 'City Mall, MG Road, Pune 411001', '+91 91234 56780', 'facilities@citymall.example', NULL::varchar, NULL::varchar),
    (3, 'Green Park Society', 'Common-area lighting upgrade', 'PAID', 4, 6, 0, 0, 18, 0, 141600.00, 'B-14, Green Park Society, Thane West 400601', '+91 98200 11223', NULL::varchar, NULL::varchar, NULL::varchar),
    (4, 'Kumar Enterprises', 'Showroom power distribution', 'PAID', 4, 22, 0, 0, 18, 0, 63720.00, 'Shop 7, Market Complex, Navi Mumbai 400703', '+91 97700 55881', 'kumar.ent@example.com', '27AAKFK4321C1Z8', NULL::varchar),
    (5, 'Sunrise Towers', 'Wiring and panel installation, Tower B', 'PAID', 3, 5, 0, 0, 18, 0, 106200.00, '12, Link Road, Andheri West, Mumbai 400053', '+91 98200 10001', 'accounts@sunrisetowers.example', NULL::varchar, NULL::varchar),
    (6, 'Orion Mall', 'Quarterly maintenance contract', 'PAID', 3, 24, 0, 0, 18, 0, 43660.00, 'Orion Mall, Phase 2, Panvel 410206', '+91 90000 20002', 'accounts@orionmall.example', NULL::varchar, NULL::varchar),
    (7, 'Metro Heights', 'Electrical works, phase 1', 'PAID', 2, 4, 0, 0, 18, 0, 177000.00, 'Metro Heights, Station Road, Mumbai 400070', '+91 98765 30003', 'billing@metroheights.example', '27AABCM5678D1Z2', NULL::varchar),
    (8, 'Orion Mall', 'Emergency repairs and servicing', 'PAID', 2, 26, 0, 0, 18, 0, 57820.00, 'Orion Mall, Phase 2, Panvel 410206', '+91 90000 20002', 'accounts@orionmall.example', NULL::varchar, NULL::varchar),
    (9, 'Metro Heights', 'Electrical works, phase 2 advance', 'PAID', 1, 5, 0, 0, 18, 0, 177000.00, 'Metro Heights, Station Road, Mumbai 400070', '+91 98765 30003', 'billing@metroheights.example', '27AABCM5678D1Z2', NULL::varchar),
    (10, 'Tirth Builders', 'Electrical fit-out', 'PAID', 1, 23, 0, 0, 18, 0, 66080.00, '402, Sunrise Towers, Link Road, Andheri West, Mumbai 400053', '+91 99887 76655', 'accounts@tirthbuilders.example', NULL::varchar, NULL::varchar),
    (11, 'Metro Heights', 'Electrical works, phase 2 completion', 'PAID', 0, 2, 0, 0, 18, 0, 94400.00, 'Metro Heights, Station Road, Mumbai 400070', '+91 98765 30003', 'billing@metroheights.example', '27AABCM5678D1Z2', NULL::varchar),
    (12, 'Sharma Residence', 'Emergency callout and repairs', 'PAID', 0, 3, 0, 0, 18, 0, 15340.00, 'B-14, Green Park Society, Thane West 400601', '+91 98200 11223', NULL::varchar, NULL::varchar, NULL::varchar),
    (13, 'City Mall', 'Panel upgrade', 'UNPAID', 0, 1, -62, -48, 18, 0, 22744.50, 'City Mall, MG Road, Pune 411001', '+91 91234 56780', 'facilities@citymall.example', NULL::varchar, NULL::varchar),
    (14, 'Kumar Enterprises', 'Lighting installation', 'UNPAID', 0, 1, -28, -14, 18, 500, 18667.60, 'Shop 7, Market Complex, Navi Mumbai 400703', '+91 97700 55881', 'kumar.ent@example.com', '27AAKFK4321C1Z8', NULL::varchar),
    (15, 'Sharma Residence', 'Residential rewiring', 'UNPAID', 0, 1, -5, 9, 0, 0, 9450.00, 'B-14, Green Park Society, Thane West 400601', '+91 98200 11223', NULL::varchar, NULL::varchar, NULL::varchar),
    (16, 'Orion Mall', 'Retrofit advance', 'UNPAID', 0, 1, -2, 12, 18, 0, 64900.00, 'Orion Mall, Phase 2, Panvel 410206', '+91 90000 20002', 'accounts@orionmall.example', NULL::varchar, NULL::varchar)
    ),
    dated AS (
        SELECT s.*,
               CASE WHEN s.status = 'PAID' THEN
                   LEAST(m.start_date + (s.day - 1),
                         (m.start_date + INTERVAL '1 month' - INTERVAL '1 day')::date,
                         CURRENT_DATE)
               END AS paid_date
        FROM src s
        CROSS JOIN LATERAL (
            SELECT (date_trunc('month', CURRENT_DATE) - make_interval(months => s.months_ago))::date AS start_date
        ) m
    ),
    ins AS (
        INSERT INTO invoice (code, title, client, client_address, client_phone, client_email, client_gstin,
                             issue_date, due_date, paid_date, status, gst_rate, discount, amount, notes, created_at)
        SELECT 'INV-' || lpad((base + d.n)::text, 4, '0'), d.title, d.client, d.client_address, d.client_phone,
               d.client_email, d.client_gstin,
               CASE WHEN d.status = 'PAID' THEN d.paid_date - 10 ELSE CURRENT_DATE + d.issue_off END,
               CASE WHEN d.status = 'PAID' THEN d.paid_date + 4  ELSE CURRENT_DATE + d.due_off  END,
               d.paid_date, d.status, d.gst_rate, d.discount, d.amount, d.notes, now()
        FROM dated d
        RETURNING id, code
    )
    INSERT INTO invoice_item (invoice_id, line_no, description, qty, rate)
    SELECT ins.id, it.line_no, it.description, it.qty, it.rate
    FROM (VALUES
    (1, 1, 'Concealed copper wiring with FRLS cables', 1, 70000),
    (1, 2, 'Distribution panel and switchgear installation', 1, 30000),
    (2, 1, 'AMC service visit and testing', 4, 12000),
    (3, 1, 'LED street and corridor lights, supply and fitting', 60, 1200),
    (3, 2, 'Cabling and junction boxes', 1, 48000),
    (4, 1, 'DB panel with MCBs, supply and fitting', 2, 27000),
    (5, 1, 'Concealed copper wiring with FRLS cables', 1, 60000),
    (5, 2, 'Distribution panel installation', 1, 30000),
    (6, 1, 'Maintenance contract, quarterly', 1, 37000),
    (7, 1, 'Main LT panel and cabling', 1, 110000),
    (7, 2, 'Earthing and testing', 1, 40000),
    (8, 1, 'Fault repairs and servicing, labour and material', 1, 49000),
    (9, 1, 'Phase 2 advance, wiring and cabling', 1, 130000),
    (9, 2, 'Site supervision', 1, 20000),
    (10, 1, 'Modular switches and sockets, supply and fitting', 120, 300),
    (10, 2, 'Concealed wiring, first floor', 1, 20000),
    (11, 1, 'Phase 2 completion, panels and testing', 1, 80000),
    (12, 1, 'Emergency callout and repairs', 1, 13000),
    (13, 1, 'Main LT panel upgrade with 400A MCCB', 1, 15500),
    (13, 2, 'Earthing pit and testing', 1, 3775),
    (14, 1, 'LED panel light 2x2 ft, supply and fitting', 24, 520),
    (14, 2, 'Track lights for display area', 6, 640),
    (15, 1, 'Complete rewiring, 2 BHK flat (labour and material)', 1, 8200),
    (15, 2, 'MCB distribution box, 8-way', 1, 1250),
    (16, 1, 'Retrofit advance, lighting and controls', 1, 55000)
    ) AS it(n, line_no, description, qty, rate)
    JOIN ins ON ins.code = 'INV-' || lpad((base + it.n)::text, 4, '0');
END $$;

-- ---------- ledger: money OUT only (money in is the invoices above) ----------
-- months_ago 0 = this month. Rows dated later than today are pulled back to today.
INSERT INTO finance_transaction (txn_date, description, type, category, party, payment_method,
                                 reference_no, amount, status, created_at)
SELECT LEAST(m.start_date + (v.day - 1),
             (m.start_date + INTERVAL '1 month' - INTERVAL '1 day')::date,
             CURRENT_DATE),
       v.description, v.type, v.category, v.party, v.payment_method, v.reference_no, v.amount, v.status, now()
FROM (VALUES
    (5, 9, 'Copper wire purchase', 'EXPENSE', 'Materials', 'Shree Cables', 'Bank Transfer', NULL, 38500, 'COMPLETED'),
    (5, 12, 'Site labour wages', 'EXPENSE', 'Labour & Salaries', 'Site crew', 'Cash', NULL, 46000, 'COMPLETED'),
    (5, 18, 'Diesel and site transport', 'EXPENSE', 'Transport', 'Local vendors', 'Cash', NULL, 9200, 'COMPLETED'),
    (5, 22, 'Office rent', 'EXPENSE', 'Rent & Utilities', 'Landlord', 'Bank Transfer', NULL, 22000, 'COMPLETED'),
    (5, 28, 'MCB and switchgear stock', 'EXPENSE', 'Materials', 'Havells Distributor', 'Bank Transfer', NULL, 26300, 'COMPLETED'),
    (4, 6, 'Cable trays and conduits', 'EXPENSE', 'Materials', 'Shree Cables', 'Bank Transfer', NULL, 52000, 'COMPLETED'),
    (4, 10, 'Site labour wages', 'EXPENSE', 'Labour & Salaries', 'Site crew', 'Cash', NULL, 54000, 'COMPLETED'),
    (4, 17, 'Tools and drilling machine', 'EXPENSE', 'Equipment', 'Bosch Dealer', 'Card', NULL, 18500, 'COMPLETED'),
    (4, 20, 'Rent and electricity', 'EXPENSE', 'Rent & Utilities', 'Landlord', 'Bank Transfer', NULL, 26500, 'COMPLETED'),
    (4, 27, 'GST payment', 'EXPENSE', 'Tax & Compliance', 'GST Department', 'Bank Transfer', NULL, 17000, 'COMPLETED'),
    (3, 7, 'LED lights bulk purchase', 'EXPENSE', 'Materials', 'Bright Lighting Co.', 'Bank Transfer', NULL, 61000, 'COMPLETED'),
    (3, 11, 'Site labour wages', 'EXPENSE', 'Labour & Salaries', 'Site crew', 'Cash', NULL, 52000, 'COMPLETED'),
    (3, 19, 'Vehicle repair', 'EXPENSE', 'Transport', 'Raj Auto Works', 'Cash', NULL, 14500, 'COMPLETED'),
    (3, 23, 'Office rent', 'EXPENSE', 'Rent & Utilities', 'Landlord', 'Bank Transfer', NULL, 22000, 'COMPLETED'),
    (3, 29, 'GST payment', 'EXPENSE', 'Tax & Compliance', 'GST Department', 'Bank Transfer', NULL, 21500, 'COMPLETED'),
    (2, 6, 'Transformer and panel material', 'EXPENSE', 'Materials', 'Siemens Distributor', 'Bank Transfer', NULL, 58000, 'COMPLETED'),
    (2, 10, 'Site labour wages', 'EXPENSE', 'Labour & Salaries', 'Site crew', 'Cash', NULL, 55000, 'COMPLETED'),
    (2, 18, 'Testing and measuring equipment', 'EXPENSE', 'Equipment', 'Meco Instruments', 'Card', NULL, 24000, 'COMPLETED'),
    (2, 21, 'Rent and electricity', 'EXPENSE', 'Rent & Utilities', 'Landlord', 'Bank Transfer', NULL, 24000, 'COMPLETED'),
    (2, 29, 'Fuel and transport', 'EXPENSE', 'Transport', 'Local vendors', 'Cash', NULL, 15000, 'COMPLETED'),
    (1, 5, 'Cable and wiring material', 'EXPENSE', 'Materials', 'Shree Cables', 'Bank Transfer', NULL, 64000, 'COMPLETED'),
    (1, 9, 'Site labour wages', 'EXPENSE', 'Labour & Salaries', 'Site crew', 'Cash', NULL, 58000, 'COMPLETED'),
    (1, 15, 'Scaffolding and lift rental', 'EXPENSE', 'Equipment', 'Apex Rentals', 'Bank Transfer', NULL, 21000, 'COMPLETED'),
    (1, 20, 'Rent and electricity', 'EXPENSE', 'Rent & Utilities', 'Landlord', 'Bank Transfer', NULL, 24000, 'COMPLETED'),
    (1, 24, 'Site transport', 'EXPENSE', 'Transport', 'Local vendors', 'Cash', NULL, 12000, 'COMPLETED'),
    (1, 28, 'GST payment', 'EXPENSE', 'Tax & Compliance', 'GST Department', 'Bank Transfer', NULL, 10000, 'COMPLETED'),
    (0, 4, 'Switchgear and MCB stock', 'EXPENSE', 'Materials', 'Havells Distributor', 'Bank Transfer', NULL, 36000, 'COMPLETED'),
    (0, 7, 'Site labour wages', 'EXPENSE', 'Labour & Salaries', 'Site crew', 'Cash', NULL, 32000, 'COMPLETED'),
    (0, 10, 'Office rent', 'EXPENSE', 'Rent & Utilities', 'Landlord', 'Bank Transfer', NULL, 14000, 'COMPLETED'),
    (0, 12, 'Generator servicing', 'EXPENSE', 'Equipment', 'PowerGen Services', 'Bank Transfer', NULL, 8500, 'PENDING'),
    (0, 14, 'Cable order - balance payment', 'EXPENSE', 'Materials', 'Shree Cables', 'Bank Transfer', NULL, 27000, 'PENDING')
) AS v(months_ago, day, description, type, category, party, payment_method, reference_no, amount, status)
CROSS JOIN LATERAL (
    SELECT (date_trunc('month', CURRENT_DATE) - make_interval(months => v.months_ago))::date AS start_date
) AS m
WHERE NOT EXISTS (SELECT 1 FROM finance_transaction WHERE type = 'EXPENSE');
