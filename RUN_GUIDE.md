# GENYSIS — Supply-Demand Matching Platform

## Comprehensive Run Guide (v2.0)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start)
3. [Project Architecture](#project-architecture)
4. [Environment Variables](#environment-variables)
5. [Service Details](#service-details)
6. [Database Schema & Seeding](#database-schema--seeding)
7. [Test Accounts](#test-accounts)
8. [API Reference](#api-reference)
9. [Frontend Pages & Routes](#frontend-pages--routes)
10. [Latest Changes Workflow](#latest-changes-workflow)
11. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites <a name="prerequisites"></a>

| Tool           | Minimum Version | Notes                          |
| -------------- | --------------- | ------------------------------ |
| Docker         | 20+             | Docker Desktop recommended     |
| Docker Compose | 2.x             | Usually bundled with Docker    |
| Node.js        | 18+             | For local dev (optional)       |
| Python         | 3.9+            | For matching worker (optional) |
| Git            | 2.x+            | For version control            |

---

## 2. Quick Start (Docker) <a name="quick-start"></a>

### Step 1: Clone & Navigate

```bash
git clone <REPO_URL>
cd GENYSIS
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env and set:
#   - MYSQL_ROOT_PASSWORD (your MySQL root password)
#   - MYSQL_DATABASE (default: genesys)
#   - JWT_SECRET (any secure string)
#   - OPENAI_API_KEY (required for AI matching)
```

### Step 3: Build & Launch

```bash
docker compose up --build -d
```

This starts all 6 services:

| Service         | Container Name   | Port(s)              |
| --------------- | ---------------- | -------------------- |
| Nginx (Gateway) | genysis_nginx    | **80** (main entry)  |
| Backend API     | genysis_backend  | 3000 (internal)      |
| Frontend        | genysis_frontend | 8080 (direct access) |
| Matching Worker | genysis_worker   | 8000 (internal)      |
| MySQL 8.0       | genysis_mysql    | 3307→3306            |
| Redis 7         | genysis_redis    | 6379                 |

### Step 4: Wait for Auto-Initialization (≈30–60 seconds)

> **No manual database setup required!** The MySQL container automatically
> executes the SQL init scripts from `docker/init/` on first start:
>
> 1. `00_schema.sql` — Creates all 18 tables, indexes, and foreign keys
> 2. `01_seed_organisations.sql` — Seeds 20 test organisations
> 3. `02_seed_test_data.sql` — Seeds 24 categories, 38 supplies, 38 demands, and history records
>
> This happens only once when the MySQL data volume is empty. Subsequent
> `docker compose up` commands reuse the existing data.

Verify everything is ready:

```bash
# Check all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}"

# Verify database was seeded
docker exec genysis_mysql mysql -uroot -p<YOUR_PASSWORD> genesys \
  -e "SELECT COUNT(*) AS orgs FROM organisation; SELECT COUNT(*) AS cats FROM item_category; SELECT COUNT(*) AS supplies FROM org_supply; SELECT COUNT(*) AS demands FROM org_demand;"

# Expected output: orgs=20, cats=24, supplies=38, demands=38
```

### Step 5: Access the Application

| Access Method       | URL                              |
| ------------------- | -------------------------------- |
| **Via Nginx**       | http://localhost (port 80)       |
| **Frontend Direct** | http://localhost:8080            |
| **API Health**      | http://localhost:3000/api/health |
| **Worker Health**   | http://localhost:8000/health     |

### Step 6: Log In with a Test Account

Navigate to `/login` and use one of the pre-seeded accounts (see [Test Accounts](#test-accounts) below). The primary test account is:

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `codeblooded@test.com` |
| Password | `CodeBlooded@123`      |

---

## 3. Project Architecture <a name="project-architecture"></a>

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser │────▶│ Nginx (:80)  │────▶│ Frontend     │
└──────────┘     │              │     │ (React/Vite) │
                 │  /api/* ─────│──┐  └──────────────┘
                 └──────────────┘  │
                                   │  ┌──────────────┐
                                   └─▶│ Backend API  │
                                      │ (Express.js) │
                                      │   :3000      │
                                      └──────┬───────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                        ┌─────▼────┐   ┌─────▼────┐   ┌────▼─────┐
                        │ MySQL    │   │ Redis    │   │ Worker   │
                        │ (Data)   │   │ (Cache)  │   │ (Python) │
                        │ :3306    │   │ :6379    │   │ :8000    │
                        └──────────┘   └──────────┘   └──────────┘
```

### Docker Init Pipeline

```
docker/init/
├── 00_schema.sql              ← Full schema (18 tables + indexes + FKs)
├── 01_seed_organisations.sql  ← 20 test organisations
└── 02_seed_test_data.sql      ← 24 categories + 38 supplies + 38 demands + history
```

MySQL's `docker-entrypoint-initdb.d` mechanism executes these files **in alphabetical order** on first container start. The files are mounted read-only via the volume in `docker-compose.yml`:

```yaml
volumes:
  - mysql_data:/var/lib/mysql
  - ./docker/init:/docker-entrypoint-initdb.d:ro # ← Auto-init scripts
```

### AI Matching Flow

1. User clicks "Find Matches" on Supply/Demand page
2. Backend checks Redis cache → if hit, returns cached results
3. On cache miss → Backend queries candidate listings from MySQL
4. Sends candidates to Python Matching Worker (FastAPI)
5. Worker runs OpenAI semantic similarity scoring
6. Results cached in Redis (1hr TTL) → returned to frontend

---

## 4. Environment Variables <a name="environment-variables"></a>

| Variable              | Required | Default        | Description                |
| --------------------- | -------- | -------------- | -------------------------- |
| `MYSQL_ROOT_PASSWORD` | Yes      | rootpassword   | MySQL root password        |
| `MYSQL_DATABASE`      | Yes      | genesys        | Database name              |
| `JWT_SECRET`          | Yes      | (set your own) | Secret for JWT signing     |
| `OPENAI_API_KEY`      | Yes\*    | (none)         | OpenAI key for AI matching |
| `DB_HOST`             | Auto     | mysql          | Set by Docker Compose      |
| `DB_PORT`             | Auto     | 3306           | Set by Docker Compose      |
| `REDIS_HOST`          | Auto     | redis          | Set by Docker Compose      |
| `REDIS_PORT`          | Auto     | 6379           | Set by Docker Compose      |

\*Required for AI matching; basic CRUD works without it.

---

## 5. Service Details <a name="service-details"></a>

### Backend (Node.js + Express)

- **Location**: `/backend/`
- **Entry**: `server.js`
- **Routes**:
  - `/api/auth/*` — Registration, Login (public)
  - `/api/supply/*` — CRUD + AI search
  - `/api/demand/*` — CRUD + AI search
  - `/api/requests/*` — Request management
  - `/api/rooms/*` — Business room + messaging
  - `/api/deals/*` — Deal management + QR verification
  - `/api/notifications/*` — Notification CRUD
  - `/api/matches/*` — Save/dismiss matches
  - `/api/categories` — Item categories
  - `/api/activity-details` — Dashboard activity feed

### Frontend (React + Vite)

- **Location**: `/frontend/`
- **Build**: Vite → served by Nginx in Docker
- **Key Libraries**: `react-router-dom`, `qrcode.react`, `leaflet`
- **Design System**: CSS variables in `index.css`
  - Primary: `#2364AA`
  - Secondary: `#73BFB8`
  - Accent: `#EA7317`
  - Fonts: Merriweather (serif), Lato (sans)

### Matching Worker (Python + FastAPI)

- **Location**: `/backend/matching-algorithm/`
- **Entry**: `main.py`
- **Endpoints**: POST `/match` (supply-to-demands, demand-to-supplies)

---

## 6. Database Schema & Seeding <a name="database-schema--seeding"></a>

The database contains **18 tables** organized into four layers:

### Core Tables

| Table                | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `organisation`       | Registered organisations (20 seeded)      |
| `item_category`      | Hierarchical categories (24 seeded)       |
| `org_supply`         | Supply listings — soft-delete (38 seeded) |
| `org_supply_history` | Audit trail for supply changes            |
| `org_demand`         | Demand listings — soft-delete (38 seeded) |
| `org_demand_history` | Audit trail for demand changes            |

### Matching & Request Tables

| Table                    | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `match_result`           | AI match results with confidence scores   |
| `saved_match`            | User-saved or dismissed match preferences |
| `requests`               | Match requests between organisations      |
| `request_status_history` | Audit trail for request status changes    |

### Business Room & Messaging Tables

| Table                          | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `business_room`                | Negotiation rooms (auto-created on accept) |
| `business_room_status_history` | Audit trail for room status changes        |
| `room_message`                 | Chat messages within rooms                 |
| `room_attachment`              | File attachments on messages               |

### Deal & Verification Tables

| Table              | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `deal`             | Finalized deals with QR codes            |
| `deal_barcode`     | Cryptographic QR barcodes for deals      |
| `barcode_scan_log` | Scan verification audit trail            |
| `notification`     | System notifications for all event types |

### Seeded Item Categories (24 total)

**Parent categories** (10):

| ID  | Category                   |
| --- | -------------------------- |
| 1   | Food & Beverages           |
| 2   | Agriculture                |
| 3   | Pharmaceuticals & Medical  |
| 4   | Electronics & Technology   |
| 5   | Industrial & Manufacturing |
| 6   | Packaging                  |
| 7   | Logistics & Storage        |
| 8   | Textiles & Apparel         |
| 9   | Safety Equipment           |
| 10  | Water & Utilities          |

**Child categories** (14): Dairy Products, Grains & Flour, Packaged Foods, Fresh Produce, Fertilizers & Pesticides, Medicines & Drugs, Medical Equipment, Electronic Components, Consumer Electronics, Steel & Metals, Construction Materials, Eco Packaging, Cold Chain & Refrigeration, Warehousing & Storage.

---

## 7. Test Accounts <a name="test-accounts"></a>

### Primary Test Account

| Field    | Value                  |
| -------- | ---------------------- |
| Org Name | CODE BLOODED           |
| Email    | `codeblooded@test.com` |
| Password | `CodeBlooded@123`      |

### Other Test Organisations (all use password: `Test@1234`)

| #   | Org Name               | Email                    | Specialisation                 |
| --- | ---------------------- | ------------------------ | ------------------------------ |
| 2   | GreenHarvest Agri      | `greenharvest@test.com`  | Agricultural produce           |
| 3   | SwiftLogix             | `swiftlogix@test.com`    | Logistics & last-mile delivery |
| 4   | MediSource India       | `medisource@test.com`    | Medical equipment & pharma     |
| 5   | TechParts Hub          | `techparts@test.com`     | Electronic components          |
| 6   | FreshBowl Foods        | `freshbowl@test.com`     | FMCG & packaged foods          |
| 7   | BuildRight Supplies    | `buildright@test.com`    | Construction materials         |
| 8   | EcoWrap Packaging      | `ecowrap@test.com`       | Sustainable packaging          |
| 9   | PharmaLink India       | `pharmalink@test.com`    | Pharmaceutical distribution    |
| 10  | UrbanTextiles          | `urbantextiles@test.com` | Fabric & garment manufacturing |
| 11  | SteelForge Industries  | `steelforge@test.com`    | Heavy metal fabrication        |
| 12  | ColdChain Express      | `coldchain@test.com`     | Cold storage & transport       |
| 13  | Sunrise Dairy Co.      | `sunrisedairy@test.com`  | Fresh dairy products           |
| 14  | NexGen Electronics     | `nexgen@test.com`        | Consumer electronics & IoT     |
| 15  | PureGrain Mills        | `puregrain@test.com`     | Flour milling                  |
| 16  | AquaFlow Systems       | `aquaflow@test.com`      | Water treatment equipment      |
| 17  | SafetyFirst Equipment  | `safetyfirst@test.com`   | Industrial safety PPE          |
| 18  | BioGrow Fertilizers    | `biogrow@test.com`       | Organic fertilizers            |
| 19  | PrintWave Media        | `printwave@test.com`     | Commercial printing            |
| 20  | CloudStore Warehousing | `cloudstore@test.com`    | Warehousing & fulfilment       |

> **Note:** Each organisation (2–20) comes pre-loaded with **2 supplies** and **2 demands**, creating realistic cross-industry matching scenarios for AI testing.

---

## 8. API Reference <a name="api-reference"></a>

### Authentication

| Method | Endpoint             | Auth | Description       |
| ------ | -------------------- | ---- | ----------------- |
| POST   | `/api/auth/register` | No   | Register org      |
| POST   | `/api/auth/login`    | No   | Login → JWT token |

### Supply (FR-04 to FR-07)

| Method | Endpoint                 | Auth | Description             |
| ------ | ------------------------ | ---- | ----------------------- |
| POST   | `/api/supply`            | Yes  | Create supply           |
| GET    | `/api/supply`            | Yes  | List supplies           |
| PUT    | `/api/supply/:id`        | Yes  | Update supply (FR-05)   |
| DELETE | `/api/supply/:id`        | Yes  | Soft-delete (FR-06)     |
| GET    | `/api/supply/:id/search` | Yes  | AI match search (FR-07) |

### Demand (FR-08 to FR-11)

| Method | Endpoint                 | Auth | Description             |
| ------ | ------------------------ | ---- | ----------------------- |
| POST   | `/api/demand`            | Yes  | Create demand           |
| GET    | `/api/demand`            | Yes  | List demands            |
| PUT    | `/api/demand/:id`        | Yes  | Update demand (FR-09)   |
| DELETE | `/api/demand/:id`        | Yes  | Soft-delete (FR-10)     |
| GET    | `/api/demand/:id/search` | Yes  | AI match search (FR-11) |

### Requests (FR-17 to FR-21)

| Method | Endpoint                   | Auth | Description           |
| ------ | -------------------------- | ---- | --------------------- |
| POST   | `/api/requests`            | Yes  | Send request (FR-17)  |
| GET    | `/api/requests`            | Yes  | List sent/received    |
| PATCH  | `/api/requests/:id/accept` | Yes  | Accept → creates room |
| PATCH  | `/api/requests/:id/reject` | Yes  | Reject + reason       |

### Business Rooms (FR-22 to FR-27)

| Method | Endpoint                  | Auth | Description         |
| ------ | ------------------------- | ---- | ------------------- |
| GET    | `/api/rooms`              | Yes  | List rooms          |
| GET    | `/api/rooms/:id`          | Yes  | Room details        |
| GET    | `/api/rooms/:id/messages` | Yes  | Get messages        |
| POST   | `/api/rooms/:id/messages` | Yes  | Send message        |
| PATCH  | `/api/rooms/:id/status`   | Yes  | Mark success/failed |
| DELETE | `/api/rooms/:id`          | Yes  | Delete room         |

### Deals (FR-28 to FR-31)

| Method | Endpoint                   | Auth   | Description      |
| ------ | -------------------------- | ------ | ---------------- |
| GET    | `/api/deals`               | Yes    | List deals       |
| GET    | `/api/deals/:id`           | Yes    | Deal + QR data   |
| PATCH  | `/api/deals/:id`           | Yes    | Update deal      |
| GET    | `/api/deals/verify/:token` | **No** | Public QR verify |

### Notifications

| Method | Endpoint                      | Auth | Description         |
| ------ | ----------------------------- | ---- | ------------------- |
| GET    | `/api/notifications`          | Yes  | List notifications  |
| PATCH  | `/api/notifications/:id/read` | Yes  | Mark as read        |
| PATCH  | `/api/notifications/read-all` | Yes  | Mark all as read    |
| DELETE | `/api/notifications/:id`      | Yes  | Delete notification |

### Saved Matches (FR-15)

| Method | Endpoint                 | Auth | Description           |
| ------ | ------------------------ | ---- | --------------------- |
| POST   | `/api/matches/save`      | Yes  | Save or dismiss match |
| GET    | `/api/matches/saved`     | Yes  | List saved matches    |
| GET    | `/api/matches/dismissed` | Yes  | List dismissed IDs    |

---

## 9. Frontend Pages & Routes <a name="frontend-pages--routes"></a>

| Route                     | Component     | Description                 |
| ------------------------- | ------------- | --------------------------- |
| `/login`                  | Login         | Organisation login          |
| `/register`               | Register      | Organisation registration   |
| `/dashboard`              | Dashboard     | Home with activity feed     |
| `/organisation`           | OrgDashboard  | Organisation profile        |
| `/supply`                 | Supply        | Create/list/delete supplies |
| `/demand`                 | Demand        | Create/list/delete demands  |
| `/match-results?type=...` | MatchResults  | AI match results            |
| `/requests`               | Requests      | Sent/received requests      |
| `/rooms`                  | RoomList      | Business room list          |
| `/rooms/:id`              | BusinessRoom  | Room chat + deal controls   |
| `/deals`                  | Deals         | Deal list                   |
| `/deals/:id/barcode`      | DealBarcode   | QR code view                |
| `/verify/:token`          | Verify        | Public QR verification      |
| `/notifications`          | Notifications | Notification center         |
| `/map`                    | Map           | Geographic view             |

---

## 10. Latest Changes Workflow <a name="latest-changes-workflow"></a>

### After pulling latest code:

```bash
# 1. Rebuild containers (keeps existing data)
docker compose down
docker compose up --build -d

# 2. Check all services are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"

# 3. Check health endpoints
curl http://localhost:3000/api/health
curl http://localhost:8000/health

# 4. Check logs if needed
docker logs genysis_backend --tail 50
docker logs genysis_worker --tail 50
docker logs genysis_nginx --tail 20
```

### Full Reset (wipes all data & re-seeds):

```bash
# Removes all containers AND volumes (database is wiped clean)
docker compose down -v

# Rebuild — init scripts will re-run on the fresh MySQL volume
docker compose up --build -d

# Wait ~30–60s for MySQL to initialize and seed
# Then verify:
docker exec genysis_mysql mysql -uroot -p<YOUR_PASSWORD> genesys \
  -e "SELECT COUNT(*) FROM organisation;"
# Expected: 20
```

### Schema-only update (without full reset):

If you only changed `docker/init/00_schema.sql` and want to apply it to an
existing database without losing data, you can run the SQL manually:

```bash
docker exec -i genysis_mysql mysql -uroot -p<YOUR_PASSWORD> genesys \
  < docker/init/00_schema.sql
```

> **⚠️ Important**: The `CREATE TABLE IF NOT EXISTS` statements won't modify
> existing tables. To apply column changes to existing tables you'll need
> `ALTER TABLE` statements or a full reset (`docker compose down -v`).

### Implemented Functional Requirements

| FR    | Feature                     | Status  |
| ----- | --------------------------- | ------- |
| FR-01 | Org Registration            | ✅ Done |
| FR-02 | Org Login                   | ✅ Done |
| FR-03 | JWT Session Management      | ✅ Done |
| FR-04 | Create Supply               | ✅ Done |
| FR-05 | Update Supply               | ✅ Done |
| FR-06 | Delete Supply (soft)        | ✅ Done |
| FR-07 | AI Search (Supply→Demand)   | ✅ Done |
| FR-08 | Create Demand               | ✅ Done |
| FR-09 | Update Demand               | ✅ Done |
| FR-10 | Delete Demand (soft)        | ✅ Done |
| FR-11 | AI Search (Demand→Supply)   | ✅ Done |
| FR-12 | AI Ranked Match Results     | ✅ Done |
| FR-13 | Redis Cache (1hr TTL)       | ✅ Done |
| FR-14 | Auto Cache Invalidation     | ✅ Done |
| FR-15 | Save/Dismiss Matches        | ✅ Done |
| FR-16 | Match Results Display       | ✅ Done |
| FR-17 | Send Request                | ✅ Done |
| FR-18 | Request Status Tracking     | ✅ Done |
| FR-19 | Accept/Reject Request       | ✅ Done |
| FR-20 | Auto-Create Business Room   | ✅ Done |
| FR-21 | Rejection Notification      | ✅ Done |
| FR-22 | Business Room List          | ✅ Done |
| FR-23 | Room Messaging              | ✅ Done |
| FR-24 | Room Status Management      | ✅ Done |
| FR-25 | Mark Deal Success/Failed    | ✅ Done |
| FR-26 | Auto-Create Deal on Success | ✅ Done |
| FR-27 | Room Deletion               | ✅ Done |
| FR-28 | QR Code Generation          | ✅ Done |
| FR-29 | QR Code Display             | ✅ Done |
| FR-30 | Public QR Verification      | ✅ Done |
| FR-31 | Cryptographic Unique Tokens | ✅ Done |

---

## 11. Troubleshooting <a name="troubleshooting"></a>

### Common Issues

#### "Backend fails to start"

```bash
# Check if MySQL is ready
docker logs genysis_mysql --tail 20

# The backend waits for MySQL healthcheck.
# If MySQL is still initializing, wait ~30s and retry.
docker compose restart backend
```

#### "Database tables are missing or empty"

This usually means the init scripts didn't run. The most common causes:

1. **Volume already exists** — Init scripts only run on a fresh volume.

   ```bash
   # Full reset to re-run init scripts:
   docker compose down -v
   docker compose up --build -d
   ```

2. **SQL syntax error** — Check MySQL logs for errors during init:

   ```bash
   docker logs genysis_mysql 2>&1 | findstr /i "ERROR"
   ```

3. **Init directory not mounted** — Verify `docker-compose.yml` has:
   ```yaml
   volumes:
     - ./docker/init:/docker-entrypoint-initdb.d:ro
   ```

#### "Cannot connect to database"

```bash
# Verify environment variables
docker exec genysis_backend env | findstr DB_

# Test MySQL directly
docker exec genysis_mysql mysql -uroot -p<YOUR_PASSWORD> genesys -e "SHOW TABLES;"
```

#### "AI matching returns empty results"

- Ensure `OPENAI_API_KEY` is set in `.env`
- Check worker logs: `docker logs genysis_worker --tail 50`
- Verify worker health: `curl http://localhost:8000/health`

#### "Frontend shows blank page"

```bash
# Check frontend build
docker logs genysis_frontend --tail 20

# Try direct access (bypass Nginx)
# http://localhost:8080
```

#### "CORS errors in browser"

- Nginx handles CORS. Ensure you're accessing via `http://localhost` (port 80)
- If accessing frontend on port 8080, API calls go to `/api/...` relative path

#### "Redis connection refused"

```bash
docker logs genysis_redis --tail 10
docker compose restart redis
```

#### Full Reset (Nuclear Option)

```bash
# 1. Stop and remove everything including volumes
docker compose down -v

# 2. Rebuild and start fresh
docker compose up --build -d

# 3. Wait ~60s for MySQL init + seeding
# 4. Verify
docker exec genysis_mysql mysql -uroot -p<YOUR_PASSWORD> genesys \
  -e "SELECT COUNT(*) AS orgs FROM organisation;"
# Expected: 20
```

---

## Key Design Decisions

1. **Auto-Init Pipeline**: All schema and seed data lives in `docker/init/` and is applied automatically on first start via MySQL's `docker-entrypoint-initdb.d` mechanism. No manual database setup required.
2. **Compatibility Schema**: The `org_demand` table includes both `required_by` (backend) and `required_by_date` (planning) columns; `business_room` includes both `org_id_1`/`org_id_2` and `supply_org_id`/`demand_org_id` — ensuring full compatibility between the planning schema and backend code.
3. **Soft Deletes**: Supply/Demand listings use `deleted_at` field (never hard-deleted).
4. **Name Snapshots**: Requests, rooms, and deals store supply/demand names at creation time — prevents confusion if items are renamed later.
5. **Cryptographic QR Tokens**: Each deal's QR code contains a 256-bit random token (`crypto.randomBytes(32)`) ensuring uniqueness.
6. **Cache Invalidation**: Supply/demand updates and deletes automatically invalidate their cached search results.
7. **Public Verification**: The `/api/deals/verify/:token` endpoint requires no authentication — anyone scanning the QR can verify.
8. **Auto Room Creation**: Accepting a request automatically creates a business room for the two parties.
9. **20 Pre-Seeded Orgs**: The seed data includes 20 diverse organisations across industries (agriculture, pharma, electronics, textiles, etc.) with 38 supplies and 38 demands designed to produce meaningful AI matching results.

---

## File Structure Overview

```
GENYSIS/
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Template for .env
├── docker-compose.yml            # All 6 services orchestration
├── RUN_GUIDE.md                  # ← This file
├── README.md                     # Project overview
│
├── docker/
│   └── init/                     # MySQL auto-init scripts
│       ├── 00_schema.sql         # Full schema (18 tables)
│       ├── 01_seed_organisations.sql  # 20 test organisations
│       └── 02_seed_test_data.sql      # Categories + supplies + demands
│
├── nginx/
│   └── nginx.conf                # Reverse proxy config
│
├── backend/
│   ├── Dockerfile
│   ├── server.js                 # Express entry point
│   ├── connections/              # MySQL + Redis connections
│   ├── middleware/               # JWT auth middleware
│   ├── routes/                   # API route handlers
│   │   ├── auth.js               # Registration & login
│   │   ├── supply.js             # Supply CRUD + search
│   │   ├── demand.js             # Demand CRUD + search
│   │   ├── requests.js           # Request management
│   │   ├── rooms.js              # Business rooms + messaging
│   │   ├── deals.js              # Deal management + QR verify
│   │   ├── notifications.js      # Notifications
│   │   ├── matches.js            # Save/dismiss matches
│   │   └── categories.js         # Item categories
│   └── matching-algorithm/       # Python FastAPI worker
│       ├── Dockerfile
│       ├── main.py
│       └── requirements.txt
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/                # Route-based page components
│   │   ├── components/           # Shared UI components
│   │   ├── contexts/             # Auth + Activity providers
│   │   └── utils/                # API helper, constants
│   └── public/
│
└── planning/                     # Original planning documents
    ├── DataBase.sql              # Reference schema
    ├── seed_organisations.sql    # Reference seed data
    └── seed_test_data.sql        # Reference test data
```

---

_Generated by GENYSIS Agent — Feb 2026 (v2.0)_
