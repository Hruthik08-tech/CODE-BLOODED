# GENYSIS

A full-stack supply chain management platform built with React, Express, MySQL, and Redis.

## Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Frontend**       | React 19 · Vite · React Router · Leaflet (maps) |
| **Backend**        | Node.js · Express 5 · MySQL2 · Redis            |
| **Infrastructure** | Docker · Docker Compose · NGINX                 |

## Project Structure

```
GENYSIS/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components (Navbar, MapPopup, etc.)
│   │   ├── pages/        # Page-level components (Map, Supply, Dashboard)
│   │   └── utils/        # Utility functions
│   └── ...
├── backend/           # Express API server
│   ├── connections/      # MySQL & Redis connection setup
│   ├── routes/           # API route handlers
│   ├── middleware/        # Express middleware
│   └── server.js         # Entry point
├── planning/          # Requirements & planning docs
├── docker-compose.yml # Full-stack Docker orchestration
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/) 8.0+
- [Redis](https://redis.io/) 7+
- [Docker](https://www.docker.com/) (optional, for containerized setup)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/Hruthik08-tech/TEAM-CODE-BLOODED-GENESYS-HACKATHON.git
   cd TEAM-CODE-BLOODED-GENESYS-HACKATHON
   ```

2. **Backend setup**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

### Docker Setup

1. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your desired passwords
   ```

2. **Start all services**

   ```bash
   docker-compose up --build
   ```

   This starts:
   - **MySQL** on port `3307`
   - **Redis** on port `6379`
   - **Backend API** on port `3000`
   - **Frontend** on port `80`

## Environment Variables

### Root (`.env`) — Docker Compose

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| `MYSQL_ROOT_PASSWORD` | MySQL root password                |
| `MYSQL_DATABASE`      | Database name (default: `genesys`) |

### Backend (`backend/.env`)

| Variable      | Description                                            | Default |
| ------------- | ------------------------------------------------------ | ------- |
| `PORT`        | API server port                                        | `3000`  |
| `DB_HOST`     | MySQL host (`mysql` for Docker, `localhost` for local) | —       |
| `DB_USER`     | MySQL user                                             | —       |
| `DB_PASSWORD` | MySQL password                                         | —       |
| `DB_NAME`     | Database name                                          | —       |
| `REDIS_HOST`  | Redis host (`redis` for Docker, `localhost` for local) | —       |
| `REDIS_PORT`  | Redis port                                             | `6379`  |

### Frontend (`frontend/.env`)

| Variable            | Description     | Default                 |
| ------------------- | --------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000` |

## License

ISC
