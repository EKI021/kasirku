<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Toko Almas - POS & Stok Opname System

This repository contains a modern Point of Sale (POS) system with integrated stock opname, inventory management, and financial analytics.

## Database Setup for Real Production Use

The application currently uses Firebase Firestore as its backend, but for production environments that need to handle thousands of records across all features, we recommend migrating to a relational PostgreSQL database.

### Database Schema

The following files contain the complete PostgreSQL schema and migration scripts:

1. **database_schema.sql** - Complete database schema with all tables and indexes
2. **init_database.sh** - Script to initialize and populate the database
3. **database_migrations/** - Migration folder for incremental updates

### Quick Setup Instructions

1. Install PostgreSQL
   ```bash
   # On macOS (with Homebrew)
   brew install postgresql
   
   # On Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # On Windows (official installer)
   # https://www.postgresql.org/download/windows/
   ```

2. Start PostgreSQL service
   ```bash
   # macOS with Homebrew
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo systemctl start postgresql
   
   # Windows (if installed via MSI)
   # Use the PostgreSQL Server Manager or Services
   ```

3. Create the database and run migrations
   ```bash
   # Log in as postgres user
   psql -U postgres
   
   -- Create database
   CREATE DATABASE kasirku;
   
   -- Exit psql
   \q
   
   # Run initialization script
   psql -U postgres -d kasirku -f database_schema.sql
   ```

4. Application Configuration

For the application to use this PostgreSQL database instead of Firebase, you need to:

- Update the database configuration in the Node.js server
- Replace Firebase authentication and Firestore calls with PostgreSQL queries
- Update any environment variables to point to your PostgreSQL instance

### Schema Overview

The relational schema includes the following tables:

- **categories**: Product categories (Sembako, Minuman, Makanan, etc.)
- **products**: Product inventory with barcode, price, stock levels
- **product_categories**: Many-to-many relationship between products and categories
- **transactions**: POS sales transactions with JSONB items for flexibility
- **stock_opnames**: Stock reconciliation sessions with detailed item comparisons
- **cash_flows**: Financial transactions (income/expense) tracking
- **activity_logs**: Audit trail with detailed operation tracking
- **store_users**: System users with roles and permissions
- **store_settings**: Store configuration and preferences
- **store_bank_qris_config**: Bank QRIS payment configuration

### Advantages of This Schema

- **Scalability**: Handles thousands of products, transactions, and operations
- **Flexibility**: JSONB field for transaction items allows for item customization
- **Performance**: Proper indexing for fast lookups on frequently accessed fields
- **Data Integrity**: Foreign keys and constraints ensure data consistency
- **Backup & Recovery**: Traditional relational database backup/restore capabilities

### Migration Path

For existing applications using Firebase, consider this migration approach:

1. **Phase 1**: Set up PostgreSQL alongside Firebase (dual-write approach)
2. **Phase 2**: Gradually migrate data from Firestore to PostgreSQL
3. **Phase 3**: Switch application to use PostgreSQL exclusively
4. **Phase 4**: Decommission Firebase resources

### Additional Resources

- **database_migrations/**: Contains incremental migration files for schema evolution
- **docs/**: Additional documentation and best practices
- **docker-compose.yml**: Docker configuration for local development with PostgreSQL

### Troubleshooting

Common issues and solutions:

1. **Connection refused**: Ensure PostgreSQL is running and port 5432 is accessible
2. **Permission denied**: Check PostgreSQL user permissions
3. **UUID extension**: The schema uses uuid_generate_v4() function, ensure uuid-ossp is installed
4. **JSONB column**: PostgreSQL version 9.4+ required for JSONB support

For more information, see the individual documentation files or contact the development team.
