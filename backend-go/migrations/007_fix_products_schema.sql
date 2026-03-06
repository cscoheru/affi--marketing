-- Fix products table schema to match Product model
-- This fixes the schema after renaming contents -> products

-- Drop columns that shouldn't be in the Product model
ALTER TABLE products DROP COLUMN IF EXISTS asin;
ALTER TABLE products DROP COLUMN IF EXISTS human_reviewed;

-- Add missing column
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Update checked constraint to remove old status if needed
ALTER TABLE products DROP CONSTRAINT IF EXISTS contents_status_check;

-- Ensure the correct check constraint exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_status;
ALTER TABLE products ADD CONSTRAINT chk_product_status
CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived'));
