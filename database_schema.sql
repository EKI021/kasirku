-- ============================================================
-- Real Database Schema for Toko Almas POS & Stok Opname
-- PostgreSQL schema designed to handle thousands of records
-- across all POS/inventory/finance features
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100)  NOT NULL,
    item_type       VARCHAR(50)   NOT NULL,        -- e.g. "Bahan Pokok Pangan", "Minuman Kemasan"
    description     TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_name ON categories(name);

-- ============================================================
-- 2. PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200)  NOT NULL,
    sku             VARCHAR(64)   NOT NULL UNIQUE,
    barcode         VARCHAR(64)   NOT NULL,
    category_id     UUID          REFERENCES categories(id) ON DELETE SET NULL,
    price           NUMERIC(10,2) NOT NULL,
    cost_price      NUMERIC(10,2) NOT NULL,
    stock           INTEGER       NOT NULL DEFAULT 0,
    min_stock       INTEGER       NOT NULL DEFAULT 0,
    unit            VARCHAR(30),
    image_url       VARCHAR(500),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);

-- ============================================================
-- 3. PRODUCT_CATEGORIES (many-to-many)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_categories (
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- ============================================================
-- 4. STOCK_OPNAMES
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_opnames (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_name_number          VARCHAR(64)   NOT NULL,
    operator                VARCHAR(100)  NOT NULL,
    total_items_checked     INTEGER       NOT NULL DEFAULT 0,
    total_discrepancy_qty   INTEGER,
    total_discrepancy_value NUMERIC(12,2),
    status                  VARCHAR(20)   NOT NULL DEFAULT 'completed', -- completed | draft
    notes                   TEXT,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_opnames_status ON stock_opnames(status);
CREATE INDEX idx_stock_opnames_date ON stock_opnames(created_at);

-- ============================================================
-- 5. TRANSACTIONS
-- ============================================================

CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'transfer');
CREATE TYPE customer_type AS ENUM ('regular', 'member', 'wholesale');

CREATE TABLE IF NOT EXISTS transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number          VARCHAR(64)   NOT NULL UNIQUE,
    items                   JSONB         NOT NULL, -- array of transaction items (flexible schema)
    subtotal                NUMERIC(12,2) NOT NULL,
    discount                NUMERIC(12,2) NOT NULL DEFAULT 0,
    total                   NUMERIC(12,2) NOT NULL,
    payment_method          payment_method NOT NULL,
    amount_paid             NUMERIC(12,2) NOT NULL,
    change                  NUMERIC(12,2),
    cashier_name            VARCHAR(100)  NOT NULL,
    customer_name           VARCHAR(200)  NOT NULL,
    customer_type           customer_type,
    notes                   TEXT,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_name);

-- ============================================================
-- 6. CASH_FLOWS
-- ============================================================

CREATE TYPE cash_flow_type AS ENUM ('income', 'expense');

CREATE TABLE IF NOT EXISTS cash_flows (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type                    cash_flow_type NOT NULL,
    category                VARCHAR(100),
    amount                  NUMERIC(12,2) NOT NULL,
    description             TEXT,
    cashier_name            VARCHAR(100)  NOT NULL,
    date                    DATE          NOT NULL,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_flows_type_date ON cash_flows(type, date);
CREATE INDEX idx_cash_flows_date ON cash_flows(date);

-- ============================================================
-- 7. ACTIVITY_LOGS (audit trail)
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'administrator', 'cashier', 'warehouse_admin', 'owner'
);

CREATE TYPE activity_action AS ENUM (
    'LOGIN', 'LOGOUT', 'TRANSACTION_CREATE', 'STOCK_OPNAME_SAVE', 'PRODUCT_CREATE',
    'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'STOCK_ADJUST', 'CASH_FLOW_CREATE',
    'CASH_FLOW_DELETE', 'CASH_FLOW_EXPENSES_CLEAR', 'TRANSACTION_DELETE',
    'TRANSACTIONS_CLEAR', 'DATABASE_RESET', 'USER_CREATE', 'USER_UPDATE',
    'USER_STATUS_CHANGE', 'USER_DELETE', 'CATEGORY_CREATE', 'CATEGORY_UPDATE',
    'CATEGORY_DELETE'
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp               TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id                 UUID NOT NULL,
    user_name               VARCHAR(100)  NOT NULL,
    user_role               user_role,
    action_type             activity_action NOT NULL,
    description             TEXT,
    target_id               UUID,
    evidence_data           TEXT
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_action ON activity_logs(action_type);

-- ============================================================
-- 8. STORE_USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS store_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100)  NOT NULL UNIQUE,
    password        VARCHAR(255)  NOT NULL,
    name            VARCHAR(200)  NOT NULL,
    role            user_role     NOT NULL,
    role_name       VARCHAR(100)  NOT NULL,
    email           VARCHAR(255),
    avatar          VARCHAR(500),
    status          VARCHAR(20)   NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMPTZ
);

CREATE INDEX idx_store_users_username ON store_users(username);
CREATE INDEX idx_store_users_role ON store_users(role);
CREATE INDEX idx_store_users_status ON store_users(status);

-- ============================================================
-- 9. STORE_SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS store_settings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name              VARCHAR(200)  NOT NULL,
    tagline                 VARCHAR(300),
    address                 VARCHAR(500),
    phone                   VARCHAR(20),
    receipt_footer          VARCHAR(300),
    tax_rate                NUMERIC(5,2),
    monthly_sales_target    NUMERIC(12,2)
);

-- ============================================================
-- 10. STORE_BANK_QRIS_CONFIG
-- ============================================================

CREATE TABLE IF NOT EXISTS store_bank_qris_config (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qris_image_url  VARCHAR(500),
    bank_name       VARCHAR(100),
    account_number  VARCHAR(50),
    account_holder  VARCHAR(200),
    secondary_bank_name       VARCHAR(100),
    secondary_account_number  VARCHAR(50),
    secondary_account_holder  VARCHAR(200),
    qris_merchant_nmid        VARCHAR(50),
    use_official_bank_qris    BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_stock_check ON products(stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_transactions_total_date ON transactions(total, created_at);
CREATE INDEX IF NOT EXISTS idx_cash_flows_type_date ON cash_flows(type, date);

-- ============================================================
-- SEED DATA (Initial population)
-- ============================================================

-- Insert categories if they don't exist
INSERT INTO categories (name, item_type, description) VALUES
    ('Sembako', 'Bahan Pokok Pangan', 'Beras, Minyak Goreng, Gula Pasir, Tepung Terigu, Telur Ayam'),
    ('Minuman Ringan', 'Minuman Kemasan & Botol', 'Air mineral, Teh kemasan, Susu UHT, Kopi instan sachet'),
    ('Makanan & Snack', 'Makanan Kering & Biskuit', 'Mie instan, Biskuit kaleng, Keripik camilan, Roti'),
    ('Bumbu Dapur', 'Penyedap & Rempah', 'Garam beryodium, Penyedap rasa, Kecap manis, Saus sambal'),
    ('Sabun & Kebersihan', 'Perlengkapan Rumah Tangga', 'Deterjen pakaian, Sabun mandi, Sampo rambut, Pembersih lantai'),
    ('Lain-lain', 'Barang Umum Toko', 'Korek api, Baterai, Kantong kresek, Obat-obatan warung')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, sku, barcode, category, price, cost_price, stock, min_stock, unit, image_url, created_at, updated_at) VALUES
    ('prod-001', 'Beras Premium Ramos 5kg', 'BRS-RMS-05', '899123456001', (SELECT id FROM categories WHERE name = 'Sembako' LIMIT 1), 74000, 66000, 28, 10, 'Karung', 'https://example.com/prod-001.jpg', NOW(), NOW()),
    ('prod-002', 'Minyak Goreng Bimoli 2L', 'MYK-BML-02', '899123456002', (SELECT id FROM categories WHERE name = 'Sembako' LIMIT 1), 36500, 32000, 45, 15, 'Pouch', 'https://example.com/prod-002.jpg', NOW(), NOW()),
    ('prod-003', 'Gula Pasir Gulaku Putih 1kg', 'GLA-GLK-01', '899123456003', (SELECT id FROM categories WHERE name = 'Sembako' LIMIT 1), 17500, 15200, 52, 20, 'Bungkus', 'https://example.com/prod-003.jpg', NOW(), NOW()),
    ('prod-004', 'Indomie Goreng Spesial (Dus 40 Pcs)', 'MIE-IND-DUS', '899123456005', (SELECT id FROM categories WHERE name = 'Makanan & Snack' LIMIT 1), 122000, 108000, 14, 5, 'Dus', 'https://example.com/prod-004.jpg', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    barcode = EXCLUDED.barcode,
    category_id = EXCLUDED.category_id,
    price = EXCLUDED.price,
    cost_price = EXCLUDED.cost_price,
    stock = EXCLUDED.stock,
    min_stock = EXCLUDED.min_stock,
    unit = EXCLUDED.unit,
    image_url = EXCLUDED.image_url,
    updated_at = EXCLUDED.updated_at;

-- ============================================================
-- STORE USERS & SETTINGS
-- ============================================================

-- Insert sample store users (with hashed passwords)
INSERT INTO store_users (id, username, password, name, role, role_name, email, avatar, status, created_at, last_login) VALUES
    ('user-admin', 'admin', '$2a$10$fXyK0F5eZvZ6u6G9JvM9Z.vDXK7Z6r6G9vZ6u6G9JvM9Z.vDXK7Z6r', 'Saiful Almas (Administrator)', 'administrator', 'Administrator (Full Akses & Log Evidence)', 'admin@tokoalmas.id', 'https://example.com/avatars/admin.jpg', 'active', NOW(), NOW()),
    ('user-owner', 'owner', '$2a$10$fXyK0F5eZvZ6u6G9JvM9Z.vDXK7Z6r6G9vZ6u6G9JvM9Z.vDXK7Z6r', 'H. Almas (Pemilik Toko)', 'owner', 'Owner (Pemilik Toko - Akses Terpadu)', 'owner@tokoalmas.id', 'https://example.com/avatars/owner.jpg', 'active', NOW(), NOW()),
    ('user-cashier', 'kasir', '$2a$10$fXyK0F5eZvZ6u6G9JvM9Z.vDXK7Z6r6G9vZ6u6G9JvM9Z.vDXK7Z6r', 'Ahmad Fauzi (Kasir)', 'cashier', 'Kasir (Transaksi Penjualan)', 'kasir@tokoalmas.id', 'https://example.com/avatars/cashier.jpg', 'active', NOW(), NOW()),
    ('user-warehouse', 'gudang', '$2a$10$fXyK0F5eZvZ6u6G9JvM9Z.vDXK7Z6r6G9vZ6u6G9JvM9Z.vDXK7Z6r', 'Budi Santoso (Admin Gudang)', 'warehouse_admin', 'Admin Gudang (Stok Opname & Inventaris)', 'budi@tokoalmas.id', 'https://example.com/avatars/gudang.jpg', 'active', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert default store settings
INSERT INTO store_settings (store_name, tagline, address, phone, receipt_footer, tax_rate, monthly_sales_target) VALUES
    ('Toko Almas - POS & Stok Opname', 'Sistem Point of Sale modern Toko Almas terintegrasi dengan stok opname barcode/manual', 'Jakarta, Jawa Timur', '021-1234-5678', 'Toko Almas Receipt Footer', 0.075, 3500000)
ON CONFLICT DO NOTHING;

-- Insert sample bank QRIS config
INSERT INTO store_bank_qris_config (qris_image_url, bank_name, account_number, account_holder, secondary_bank_name, secondary_account_number, secondary_account_holder, qris_merchant_nmid, use_official_bank_qris) VALUES
    ('https://qrisk.bank.go.id/qris-image', 'Bank Central Asia', '123456789012', 'Toko Almas', NULL, NULL, NULL, '12345678901234567890', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VALIDATION & CHECKS
-- ============================================================

-- Summary of records inserted/updated
DO $$
BEGIN
    RAISE NOTICE '=== Database Initialization Complete ===';
    RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM products);
    RAISE NOTICE 'Store Users: %', (SELECT COUNT(*) FROM store_users);
    RAISE NOTICE 'Store Settings: %', (SELECT COUNT(*) FROM store_settings);
    RAISE NOTICE 'Bank QRIS Config: %', (SELECT COUNT(*) FROM store_bank_qris_config);
END $$;