# Affi-Marketing Database Schema Documentation

**Version**: 1.0.0
**Last Updated**: 2026-03-03
**Database**: business_hub (PostgreSQL 15+)
**Author**: 03-数据库工程师

---

## Table of Contents

1. [Overview](#overview)
2. [Database Connection](#database-connection)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Core Tables](#core-tables)
5. [Plugin Tables](#plugin-tables)
6. [Indexes](#indexes)
7. [Query Examples](#query-examples)
8. [Backup and Restore](#backup-and-restore)

---

## Overview

The `business_hub` database is designed for the Affi-Marketing platform, supporting multiple e-commerce monetization models:

- **Programmatic SEO + Affiliate Marketing**
- **GEO (Generated Engine Optimization)**
- **AI Agent E-commerce**
- **Self-hosted Affiliate SaaS**

### Database Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 13 |
| Total Indexes | 40+ |
| Extensions | uuid-ossp, pg_trgm |

---

## Database Connection

```
Host: 139.224.42.111
Port: 5432
Database: business_hub
User: postgres
Password: changeme-postgres-password-123
```

### Connect via psql

```bash
# From local machine
docker exec -it postgres psql -U postgres -d business_hub

# From remote
psql -h 139.224.42.111 -p 5432 -U postgres -d business_hub
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   experiments   │
├─────────────────┤
│ id (PK)         │◄───────────┐
│ name            │             │
│ plugin_id       │             │
│ status          │             │
│ config (JSONB)  │             │
└─────────────────┘             │
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ tracking_events │    │  conversions    │    │settlement_records│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ experiment_id   │    │ experiment_id   │    │ experiment_id   │
│ tracking_id     │    │ tracking_id     │    │ period_start    │
│ event_type      │    │ commission      │    │ total_revenue   │
│ metadata (JSONB)│    │ status          │    │ status          │
└─────────────────┘    └─────────────────┘    └─────────────────┘

         ▲                       │
         │                       │
┌─────────────────┐              │
│ affiliate_links │──────────────┘
├─────────────────┤
│ id (PK)         │
│ experiment_id   │
│ tracking_id     │
│ network         │
└─────────────────┘

┌──────────────────┐
│   seo_keywords   │
├──────────────────┤
│ id (PK)          │◄───────┐
│ experiment_id    │        │
│ keyword          │        │
│ search_volume    │        │
│ status           │        │
└──────────────────┘        │
                            │
                  ┌─────────┴──────────┐
                  ▼                    ▼
         ┌───────────────┐    ┌──────────────┐
         │content_tasks  │    │  seo_metrics │
         ├───────────────┤    ├──────────────┤
         │keyword_id (FK)│    │keyword_id(FK)│
         │status         │    │measurement   │
         │content_html   │    │rank_position │
         └───────────────┘    └──────────────┘

┌──────────────────┐
│    geo_pages     │
├──────────────────┤
│ id (PK)          │◄───────┐
│ experiment_id    │        │
│ url_template     │        │
│ template_config  │        │
└──────────────────┘        │
                            │
                  ┌─────────┴──────────┐
                  ▼                    ▼
         ┌───────────────┐    ┌──────────────┐
         │ geo_variants  │    │ geo_metrics  │
         ├───────────────┤    ├──────────────┤
         │geo_page_id(FK)│    │variant_id(FK)│
         │generated_url  │    │page_views    │
         │variant_data   │    │conversions   │
         └───────────────┘    └──────────────┘
```

---

## Core Tables

### experiments

Stores A/B test configurations and experiment settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | NO | AUTO | Primary key |
| name | VARCHAR(255) | NO | - | Experiment name |
| description | TEXT | YES | - | Description |
| plugin_id | VARCHAR(100) | NO | - | Plugin identifier |
| status | VARCHAR(50) | NO | DRAFT | DRAFT/ACTIVE/PAUSED/COMPLETED |
| config | JSONB | NO | {} | Experiment configuration |
| start_time | TIMESTAMP | YES | - | Start time |
| end_time | TIMESTAMP | YES | - | End time |
| created_at | TIMESTAMP | NO | NOW() | Created timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Updated timestamp |

### tracking_events

Stores all tracking events (clicks, impressions, etc.).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | NO | AUTO | Primary key |
| experiment_id | BIGINT | NO | FK | Reference to experiments |
| plugin_id | VARCHAR(100) | NO | - | Plugin identifier |
| event_type | VARCHAR(100) | NO | - | Event type |
| tracking_id | VARCHAR(255) | YES | - | Tracking ID |
| source_url | TEXT | YES | - | Source URL |
| target_url | TEXT | YES | - | Target URL |
| referrer | TEXT | YES | - | Referrer |
| user_agent | TEXT | YES | - | User agent |
| ip_address | INET | YES | - | IP address |
| metadata | JSONB | NO | {} | Event metadata |
| created_at | TIMESTAMP | NO | NOW() | Created timestamp |

### conversions

Stores conversion/commission events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | NO | AUTO | Primary key |
| experiment_id | BIGINT | NO | FK | Reference to experiments |
| plugin_id | VARCHAR(100) | NO | - | Plugin identifier |
| tracking_id | VARCHAR(255) | YES | - | Tracking ID |
| conversion_type | VARCHAR(100) | YES | - | Conversion type |
| amount | DECIMAL(10,2) | YES | - | Amount |
| commission_rate | DECIMAL(5,2) | YES | - | Commission rate |
| commission | DECIMAL(10,2) | YES | - | Commission amount |
| status | VARCHAR(50) | NO | PENDING | PENDING/CONFIRMED/REJECTED |
| raw_data | JSONB | NO | {} | Raw conversion data |
| created_at | TIMESTAMP | NO | NOW() | Created timestamp |
| confirmed_at | TIMESTAMP | YES | - | Confirmed timestamp |

### settlement_records

Stores periodic settlement summaries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | NO | AUTO | Primary key |
| experiment_id | BIGINT | NO | FK | Reference to experiments |
| period_start | DATE | NO | - | Period start |
| period_end | DATE | NO | - | Period end |
| total_conversions | INTEGER | NO | 0 | Total conversions |
| total_revenue | DECIMAL(10,2) | NO | 0 | Total revenue |
| total_commission | DECIMAL(10,2) | NO | 0 | Total commission |
| status | VARCHAR(50) | NO | PENDING | PENDING/PROCESSING/COMPLETED |
| created_at | TIMESTAMP | NO | NOW() | Created timestamp |

---

## Plugin Tables

### SEO Plugin Tables

#### seo_keywords

Store SEO keywords for tracking and optimization.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| experiment_id | BIGINT | Reference to experiments |
| keyword | VARCHAR(500) | Keyword text |
| search_volume | INTEGER | Monthly search volume |
| competition_level | VARCHAR(50) | LOW/MEDIUM/HIGH |
| target_url | TEXT | Target URL |
| status | VARCHAR(50) | PENDING/RESEARCHING/TARGETING/OPTIMIZING/RANKING |
| current_rank | INTEGER | Current ranking |
| best_rank | INTEGER | Best ranking |

#### content_generation_tasks

Store AI content generation tasks.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| experiment_id | BIGINT | Reference to experiments |
| keyword_id | BIGINT | Reference to seo_keywords |
| title | VARCHAR(500) | Content title |
| target_url | TEXT | Target URL |
| status | VARCHAR(50) | PENDING/GENERATING/GENERATED/PUBLISHED/FAILED |
| content_html | TEXT | Generated content |
| generation_metadata | JSONB | Generation metadata |

### Affiliate Plugin Tables

#### affiliate_links

Store affiliate links with cloaking.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| experiment_id | BIGINT | Reference to experiments |
| link_name | VARCHAR(255) | Link name |
| original_url | TEXT | Original URL |
| cloaked_url | TEXT | Cloaked URL |
| network | VARCHAR(100) | Affiliate network |
| tracking_id | VARCHAR(255) | Unique tracking ID |
| clicks | INTEGER | Click count |
| conversions | INTEGER | Conversion count |
| revenue | DECIMAL(10,2) | Total revenue |

#### affiliate_clicks

Detailed click tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| affiliate_link_id | BIGINT | Reference to affiliate_links |
| experiment_id | BIGINT | Reference to experiments |
| tracking_id | VARCHAR(255) | Tracking ID |
| click_id | VARCHAR(255) | Unique click ID |
| converted | BOOLEAN | Conversion flag |

### GEO Plugin Tables

#### geo_pages

Store GEO page templates.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| experiment_id | BIGINT | Reference to experiments |
| page_name | VARCHAR(255) | Page name |
| url_template | TEXT | URL template with placeholders |
| page_type | VARCHAR(100) | category/comparison/review/listing |
| total_variants | INTEGER | Total variants |
| published_variants | INTEGER | Published variants |

#### geo_variants

Store individual generated page variants.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| geo_page_id | BIGINT | Reference to geo_pages |
| experiment_id | BIGINT | Reference to experiments |
| generated_url | TEXT | Generated URL |
| variant_data | JSONB | Variable substitutions |
| content_html | TEXT | Generated content |
| status | VARCHAR(50) | PENDING/GENERATING/GENERATED/PUBLISHED/INDEXED/ERROR |

---

## Indexes

### Core Table Indexes

| Table | Index | Columns | Type |
|-------|-------|---------|------|
| experiments | idx_experiments_plugin_id | plugin_id | B-tree |
| experiments | idx_experiments_status | status | B-tree |
| tracking_events | idx_tracking_events_tracking_id | tracking_id | B-tree |
| tracking_events | idx_tracking_events_metadata | metadata | GIN |
| conversions | idx_conversions_tracking_id | tracking_id | B-tree |
| conversions | idx_conversions_status | status | B-tree |

### Plugin Table Indexes

| Table | Index | Columns | Type |
|-------|-------|---------|------|
| seo_keywords | idx_seo_keywords_keyword | keyword | GIN (trigram) |
| affiliate_links | idx_affiliate_links_tracking_id | tracking_id | B-tree (unique) |
| geo_variants | idx_geo_variants_generated_url | generated_url | B-tree (unique) |
| geo_variants | idx_geo_variants_variant_data | variant_data | GIN |

---

## Query Examples

### Experiment Analytics

```sql
-- Get experiment summary
SELECT
    e.name,
    e.plugin_id,
    e.status,
    COUNT(DISTINCT te.id) as tracking_events,
    COUNT(DISTINCT te.tracking_id) as unique_visitors,
    COUNT(c.id) as conversions,
    COALESCE(SUM(c.commission), 0) as total_commission
FROM experiments e
LEFT JOIN tracking_events te ON e.id = te.experiment_id
LEFT JOIN conversions c ON e.id = c.experiment_id AND c.status = 'CONFIRMED'
GROUP BY e.id, e.name, e.plugin_id, e.status;
```

### SEO Performance

```sql
-- Get keyword rankings by experiment
SELECT
    sk.keyword,
    sk.search_volume,
    sk.current_rank,
    sk.status,
    COUNT(cgt.id) as content_tasks
FROM seo_keywords sk
LEFT JOIN content_generation_tasks cgt ON sk.id = cgt.keyword_id
WHERE sk.experiment_id = 1
ORDER BY sk.search_volume DESC;
```

### Affiliate Link Performance

```sql
-- Get top performing affiliate links
SELECT
    al.link_name,
    al.network,
    al.clicks,
    al.conversions,
    ROUND(al.conversions * 100.0 / NULLIF(al.clicks, 0), 2) as conversion_rate,
    al.revenue,
    al.commission
FROM affiliate_links al
WHERE al.experiment_id = 1
ORDER BY al.revenue DESC
LIMIT 10;
```

### GEO Page Generation Status

```sql
-- Get GEO page generation progress
SELECT
    gp.page_name,
    gp.page_type,
    gp.total_variants,
    gp.published_variants,
    ROUND(gp.published_variants * 100.0 / NULLIF(gp.total_variants, 0), 2) as publish_progress,
    COUNT(gv.id) FILTER (WHERE gv.status = 'ERROR') as error_count
FROM geo_pages gp
LEFT JOIN geo_variants gv ON gp.id = gv.geo_page_id
WHERE gp.experiment_id = 1
GROUP BY gp.id, gp.page_name, gp.page_type, gp.total_variants, gp.published_variants
ORDER BY gp.total_variants DESC;
```

---

## Backup and Restore

### Backup

```bash
# Full database backup
docker exec postgres pg_dump -U postgres business_hub > backup-$(date +%Y%m%d).sql

# Schema-only backup
docker exec postgres pg_dump -U postgres --schema-only business_hub > schema-$(date +%Y%m%d).sql

# Data-only backup
docker exec postgres pg_dump -U postgres --data-only business_hub > data-$(date +%Y%m%d).sql
```

### Restore

```bash
# Restore from backup
docker exec -i postgres psql -U postgres business_hub < backup-20260303.sql

# Create new database from backup
createdb business_hub_new
docker exec -i postgres psql -U postgres business_hub_new < backup-20260303.sql
```

### Automated Backup

```bash
# Backup script location: /opt/backups/business-hub-backup.sh
# Runs daily at 2:00 AM via cron
```

---

## Maintenance

### Regular Maintenance Queries

```sql
-- Vacuum analyze all tables
VACUUM ANALYZE;

-- Reindex specific table
REINDEX TABLE tracking_events;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Find long-running queries
SELECT pid, query, state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < now() - interval '5 minutes';
```

---

**Document Version**: 1.0.0
**Last Modified**: 2026-03-03
