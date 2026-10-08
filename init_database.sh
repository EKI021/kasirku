#!/bin/bash
# ============================================================
# Toko Almas POS & Stok Opname - Database Initialization Script
# ============================================================
# This script initializes the PostgreSQL database and populates it
# with the complete schema and seed data for the Toko Almas system.
# ============================================================

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-kasirku}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
SCHEMA_FILE="${SCHEMA_FILE:-database_schema.sql}"

echo "============================================================"
echo "Toko Almas Database Initialization"
echo "============================================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "============================================================"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql is not installed or not in PATH."
    echo "Please install PostgreSQL client first."
    exit 1
fi

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Error: Schema file '$SCHEMA_FILE' not found."
    echo "Please run this script from the project root directory."
    exit 1
fi

# Step 1: Create database if it doesn't exist
echo "Step 1: Creating database '$DB_NAME' if it doesn't exist..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo "Database '$DB_NAME' already exists."
else
    echo "Creating database '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    echo "Database '$DB_NAME' created successfully."
fi

# Step 2: Run schema file
echo "Step 2: Running schema file '$SCHEMA_FILE'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"

echo "============================================================"
echo "Database initialization completed successfully!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Update your application's database configuration to connect to:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "2. Run your application with:"
echo "   npm run dev"
echo ""
echo "============================================================"