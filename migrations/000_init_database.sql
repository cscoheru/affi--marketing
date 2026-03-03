-- ============================================================================
-- Affi-Marketing Database Initialization
-- ============================================================================
-- Purpose: Create the business_hub database and install required extensions
-- Author: 03-数据库工程师
-- Date: 2026-03-03
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Notes:
-- 1. This script should be run in the 'postgres' database to create business_hub
-- 2. After creating the database, connect to it before running extensions
-- 3. Extensions are installed for the entire database, not per-schema
-- ----------------------------------------------------------------------------

-- ============================================================================
-- SECTION 1: Database Creation
-- ============================================================================

-- Create the business_hub database
-- Note: Run this in the postgres database first
DROP DATABASE IF EXISTS business_hub;
CREATE DATABASE business_hub
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = -1;

-- Connect to the new database
\c business_hub

-- ============================================================================
-- SECTION 2: Install PostgreSQL Extensions
-- ============================================================================

-- UUID extension: Generate UUID values for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm: Trigram matching for text search and similarity
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SECTION 3: Verify Installation
-- ============================================================================

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- Expected output:
--  extname    | extversion
-- ------------+------------
--  pg_trgm    | 1.6
--  plpgsql    | 1.0
--  uuid-ossp  | 1.1

-- ============================================================================
-- SECTION 4: Grant Permissions
-- ============================================================================

-- Grant all privileges on database to postgres user
GRANT ALL PRIVILEGES ON DATABASE business_hub TO postgres;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant create on schema
GRANT CREATE ON SCHEMA public TO postgres;

-- ============================================================================
-- SECTION 5: Create Custom Functions
-- ============================================================================

-- Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTES FOR NEXT MIGRATIONS
-- ============================================================================
-- After running this script, proceed with:
-- 1. migrations/001_core_tables.sql - Core tables
-- 2. migrations/002_seo_tables.sql - SEO plugin tables
-- 3. migrations/003_affiliate_tables.sql - Affiliate plugin tables
-- 4. migrations/004_geo_tables.sql - GEO plugin tables
-- ============================================================================
