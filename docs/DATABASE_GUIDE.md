# Toko Almas Database Guide

## Overview

This guide documents the PostgreSQL database schema used by the Toko Almas POS & Stok Opname system. The schema is designed to handle thousands of records across all features.

## Architecture

The database consists of modules: Product Management, Point of Sale, Stock Reconciliation, Financial Tracking, Audit & Security, and Configuration.

## Tables (Quick Reference)

| Table | Key Purpose |
|-------|-------------|
| `categories` | Product categories (Sembako, Minuman, etc.) |
| `products` | Product inventory with stock levels |
| `stock_opnames` | Stock reconciliation sessions |
| `transactions` | POS sales invoices |
| `cash_flows` | Financial income/expense tracking |
| `activity_logs` | Complete audit trail |
| `store_users` | System user accounts with roles |
| `store_settings` | Store configuration |
| `store_bank_qris_config` | QRIS bank payment config |

## Quick Start

1. Install PostgreSQL
2. Run: `./init_database.sh`
3. Or use Docker: `docker-compose up -d`
4. Access Adminer at http://localhost:8080

See `database_schema.sql` for full schema details.