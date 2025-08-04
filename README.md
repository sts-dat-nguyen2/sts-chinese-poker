# Game Night Ledger

A web application to track wins, losses, and money for your Chinese Poker game nights. Create shareable sessions like when2meet.com - creators can manage games while guests view results.

## Features

- 🏆 **Session-based management** - Create shareable game sessions
- 👥 **Creator vs Guest access** - Creators manage, guests view
- 💰 **Financial tracking** - Buy-ins, wins, penalties, rollovers
- 📊 **Real-time ledger** - See who owes what instantly
- 🔗 **Shareable URLs** - Share sessions via simple links
- 🎮 **Game history** - Track all completed games

## Quick Start

### Using Docker (Recommended)

**Prerequisites:** Docker & Docker Compose

```bash
# Quick rebuild (fresh start)
./rebuild.sh

# Or manual steps:
docker-compose down
docker-compose build
docker-compose up -d
```

### Manual Setup

**Prerequisites:** Node.js, PostgreSQL

1. Start PostgreSQL and create database `chinese_poker`
2. Run schema: `psql -d chinese_poker -f api/db/schema.sql`
3. Install API dependencies: `cd api && npm install`
4. Install Client dependencies: `cd client && npm install`
5. Start API: `cd api && npm start`
6. Start Client: `cd client && npm run dev`

## Access

- 📱 **Frontend:** http://localhost:3005
- 🔧 **API:** http://localhost:3001
- 📊 **Database:** localhost:5432

## How to Use

1. **Create Session:** Enter session name, your name, and password
2. **Share URL:** Copy the generated link and share with friends
3. **Manage Games:** Creators can start games and record outcomes
4. **View Results:** Everyone can see the current ledger and history
