-- ============================================================
-- Migration 001: Initial Schema
-- ============================================================
-- Creates the core tables for the Toko Almas POS system
-- ============================================================

BEGIN;

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Core Entities
-- ============================================================

-- Product catalog
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    item_type       VARCHAR(50) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products (inventory)
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(200) NOT NULL,
    sku              VARCHAR(64)  NOT NULL UNIQUE,
    barcode          VARCHAR(64) NOT NULL,
    category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
    price            NUMERIC(10,2) NOT NULL,
    cost_price       NUMERIC(10,2) NOT NULL,
    stock            INTEGER NOT NULL DEFAULT 0,
    min_stock        INTEGER NOT NULL DEFAULT 0,
    unit             VARCHAR(30),
    image_url        VARCHAR(500),
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock reconciliation sessions
CREATE TABLE stock_opnames (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_name_number  VARCHAR(64) NOT NULL,
    operator        VARCHAR(100) NOT NULL,
    total_items_checked INTEGER NOT NULL DEFAULT 0,
    total_discrepancy_qty INTEGER,
    total_discrepancy_value NUMERIC(12,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'completed',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Financial transactions
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number  VARCHAR(64)  NOT NULL UNIQUE,
    items           JSONB NOT NULL,
    subtotal        NUMERIC(12,2) NOT NULL,
    discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
    total           NUMERIC(12,2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL,
    amount_paid     NUMERIC(12,2) NOT NULL,
    change          NUMERIC(12,2),
    cashier_name    VARCHAR(100) NOT NULL,
    customer_name   VARCHAR(200) NOT NULL,
    customer_type   VARCHAR(20) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cash flow tracking
CREATE TABLE cash_flows (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            VARCHAR(20) NOT NULL,
    category        VARCHAR(100),
    amount          NUMERIC(12,2) NOT NULL,
    description     TEXT,
    cashier_name    VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activity logging (audit trail)
CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id         UUID NOT NULL,
    user_name       VARCHAR(100) NOT NULL,
    user_role       VARCHAR(30) NOT NULL,
    action_type     VARCHAR(50) NOT NULL,
    description     TEXT,
    target_id       UUID,
    evidence_data   TEXT
);

-- Store users & roles
CREATE TABLE store_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    role            VARCHAR(20) NOT NULL,
    role_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    avatar          VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMPTZ
);

-- Store settings
CREATE TABLE store_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name      VARCHAR(200) NOT NULL,
    tagline         VARCHAR(300),
    address         VARCHAR(500),
    phone           VARCHAR(20),
    receipt_footer  VARCHAR(300),
    tax_rate        NUMERIC(5,2),
    monthly_sales_target NUMERIC(12,2)
);

-- Bank QRIS configuration
CREATE TABLE store_bank_qris_config (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qris_image_url  VARCHAR(500),
    bank_name       VARCHAR(100),
    account_number  VARCHAR(50),
    account_holder  VARCHAR(200),
    secondary_bank_name VARCHAR(100),
    secondary_account_number VARCHAR(50),
    secondary_account_holder VARCHAR(200),
    qris_merchant_nmid VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_stock_opnames_status ON stock_opnames(status);
CREATE INDEX idx_stock_opnames_date ON stock_opnames(created_at);
CREATE INDEX idx_transactions_subtype ON transactions(type, created_at);
CREATE INDEX idx_transactions_total ON transactions(subtotal, total);
CREATE INDEX idx_cash_flows_type_date ON cash_flows(type, date);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action_type);

COMMIT;
