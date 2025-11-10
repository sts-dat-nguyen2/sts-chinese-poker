# Game Night Ledger - Overall Documentation

## 📊 Current Status

**Version**: Session-based Vietnamese Poker Game Ledger
**Last Updated**: January 2025
**Status**: ✅ **Production Ready**

### ✅ Completed Features

- [x] **Session-based Management** - Create shareable game sessions like when2meet.com
- [x] **Creator vs Guest Access** - Password-protected creator access, read-only guest access
- [x] **Vietnamese Currency (₫)** - Full conversion from USD to Vietnamese Dong with thousands formatting
- [x] **Financial Tracking** - Buy-ins, wins, penalties, pot rollovers
- [x] **Real-time Ledger** - Live calculation of who owes what
- [x] **Shareable URLs** - `/session/abc123` style URLs for easy sharing
- [x] **Game History** - Detailed verbal history with penalty breakdowns and individual losses
- [x] **Docker Deployment** - Full containerized stack (PostgreSQL + API + Frontend)
- [x] **Responsive UI** - Works on mobile and desktop
- [x] **Auto-redirect Logic** - Smart navigation based on session state

### 🔧 Recent Major Fixes

- [x] **Currency Parsing Bug** - Fixed "2000 ₫ becomes 40,000 ₫" issue (PostgreSQL string→number conversion)
- [x] **Initial View Logic** - Creators now go to "New Game" when no games exist (instead of empty ledger)
- [x] **Enhanced History** - Added detailed verbal descriptions, penalty breakdowns, individual player outcomes
- [x] **Number Validation** - All `.toFixed()` calls protected against undefined/null values

---

## 🏗️ Architecture Overview

**Stack**: React (Frontend) + Node.js/Express (API) + PostgreSQL (Database) + Docker

```
chinese-poker/
├── api/                    # Backend API (Node.js/Express)
├── client/                 # Frontend (React/TypeScript)
├── docker-compose.yml      # Container orchestration
├── rebuild.sh             # Deployment script
└── README.md              # Setup instructions
```

---

## 📁 File Structure & Responsibilities

### 🔧 **Backend API** (`api/`)

#### **Core Server**
- **`server.js`** - Express server entry point, middleware setup, route mounting
- **`package.json`** - Dependencies, scripts (NOTE: No `"type": "module"` - uses CommonJS)

#### **Database**
- **`db/schema.sql`** - **PostgreSQL schema definition** (sessions, players, games, ledger_entries)
- **`db/connection.js`** - Database connection configuration

#### **Controllers** (Business Logic)
- **`controllers/sessionController.js`** - **Session management logic**
  - `createSession()` - Create new game session with password hashing
  - `getSession()` - Retrieve session by code
  - `authenticateSessionCreator()` - Password verification with bcrypt
  - `resetSessionData()` - Delete all session games/data

- **`controllers/gameController.js`** - **Game management logic**
  - `createGame()` - Create new game, add players, record buy-in ledger entries
  - `finalizeGame()` - Update game status, calculate winnings, handle penalties
  - `getSessionState()` - Get current game + player ledger + pot rollover
  - `getGameHistory()` - Fetch completed games with aggregated data

#### **Routes** (API Endpoints)
- **`routes/sessions.js`** - Session-related endpoints (`/api/sessions/*`)
- **`routes/games.js`** - Game-related endpoints (`/api/games/:sessionCode/*`)

### 🎨 **Frontend** (`client/`)

#### **Core App**
- **`App.tsx`** - **Main application orchestrator**
  - View state management (`SESSION_SETUP`, `SESSION_LOGIN`, `GAME_SETUP`, `FINALIZE`, `LEDGER`, `HISTORY`)
  - Session authentication flow
  - **Initial view logic**: Creators → New Game (if no games), Others → Ledger
  - Auto-redirect after game finalization

#### **Components** (UI Logic)

**Session Management:**
- **`components/SessionSetup.tsx`** - Create new session or join existing (name/password input)
- **`components/SessionLogin.tsx`** - Creator login or guest viewing, shareable URL display with copy button

**Game Flow:**
- **`components/GameSetup.tsx`** - **Player input & buy-in amount** (Vietnamese Dong, min 1000₫, step 1000₫)
- **`components/GameFinalization.tsx`** - **Declare game outcome** (Winner/Penalty/Draw), pot calculations
- **`components/PlayerLedger.tsx`** - **Real-time financial standings** (who owes what, formatted in ₫)
- **`components/GameHistory.tsx`** - **Detailed game history** with verbal descriptions, penalty breakdowns, individual outcomes

**Layout:**
- **`components/Header.tsx`** - **Navigation & session info** (session name, creator badge, share button, logout)

#### **State Management** (Custom Hooks)
- **`hooks/useSession.ts`** - **Session authentication state**
  - Session loading from URL
  - Creator authentication
  - Guest viewing mode
  - Session creation/joining

- **`hooks/useGameState.ts`** - **Game data management**
  - Current game state fetching
  - Player ledger calculations (with number conversion protection)
  - Game history loading
  - Game creation/finalization
  - **Critical**: Converts PostgreSQL NUMERIC strings to numbers

#### **Utilities & Services**
- **`services/apiService.ts`** - **API communication layer**
  - Environment-aware base URL (`localhost` for dev, `window.location.hostname` for production)
  - Session API calls
  - Game API calls
  - Error handling

- **`utils/currency.ts`** - **Vietnamese Dong formatting**
  - `formatCurrency()` - Formats numbers as "2,000 ₫"
  - Used consistently across all components

- **`types.ts`** - **TypeScript definitions** (Session, Game, PlayerLedger, GameOutcome, etc.)

#### **Deployment**
- **`nginx.conf`** - **SPA routing configuration** (redirects all routes to `index.html`)
- **`Dockerfile`** - Multi-stage build (Node build → Nginx serve)

### 🗄️ **Database Schema** (`api/db/schema.sql`)

#### **Tables & Relationships**

**`sessions`** - Game sessions (like when2meet rooms)
- `session_code` (UNIQUE) - Used in shareable URLs
- `creator_name`, `creator_password_hash` - Authentication
- `session_name` - Display name

**`players`** - Unique players per session
- `session_id` (FK) - Links to sessions
- `UNIQUE(session_id, name)` - Same name allowed across different sessions

**`games`** - Individual games within sessions
- `session_id` (FK) - Links to sessions
- `buy_in_amount`, `pot_rollover`, `status` - Game state
- `status`: `'in_progress'`, `'completed'`, `'draw'`

**`ledger_entries`** - **Financial transaction log**
- `game_id` (FK), `player_id` (FK)
- `amount` (NUMERIC) - Positive for gains, negative for losses
- `entry_type`: `'buy_in'`, `'win'`, `'penalty_paid'`, `'penalty_received'`

#### **Key Indexes**
- `idx_sessions_code` - Fast URL lookups
- `idx_players_session`, `idx_games_session` - Session data queries
- `idx_ledger_entries_game`, `idx_ledger_entries_player` - Financial calculations

---

## 🔗 API Endpoints

### Session Management (`/api/sessions`)
- `POST /` - Create new session
- `GET /:sessionCode` - Get session info
- `POST /:sessionCode/authenticate` - Creator login
- `DELETE /:sessionCode/data` - Reset session data

### Game Management (`/api/games/:sessionCode`)
- `GET /history` - Get completed games history
- `GET /state` - Get current game + ledger + rollover
- `POST /` - Create new game
- `PUT /:gameId/finalize` - Finalize game outcome

---

## 💰 Financial Logic

### **Game Flow**
1. **Buy-in**: All players pay `buy_in_amount` (negative ledger entries)
2. **Pot Calculation**: `(players.length × buy_in_amount) + pot_rollover`
3. **Penalties**: Penalized players pay extra `buy_in_amount × 0.5` to winner
4. **Winner Payout**: Winner receives total pot + penalties (positive ledger entry)
5. **Draw**: Pot rolls over to next game

### **Player Outcome Calculations** (in GameHistory.tsx)
- **Clean Winner**: `+pot - buy_in`
- **Penalized Winner**: `+pot - buy_in - penalty`
- **Regular Loser**: `-buy_in`
- **Penalized Loser**: `-buy_in - penalty`

---

## 🌐 Deployment & Environment

### **Docker Setup**
- **`db`**: PostgreSQL with persistent volume, schema auto-applied
- **`api`**: Node.js Express server on port 3001
- **`client`**: Nginx serving React SPA on port 3005

### **Environment Variables**
- **Frontend**: `API_BASE_URL` adapts to development vs production
- **Backend**: `DATABASE_URL` for PostgreSQL connection

### **Quick Deployment**
```bash
./rebuild.sh  # Stops, rebuilds, restarts everything with fresh schema
```

---

## 🎯 Key Implementation Details

### **Currency Handling**
- **All displays**: Vietnamese Dong (₫) with thousands separators
- **Input validation**: Minimum 1,000₫, step 1,000₫
- **Database storage**: NUMERIC type (returned as strings from PostgreSQL)
- **Frontend conversion**: `Number(value) || 0` in `useGameState.ts` prevents string concatenation bugs

### **Session Sharing**
- **URL format**: `/session/abc123def456` (UUID-based codes)
- **SPA routing**: Nginx redirects all routes to `index.html`
- **Access control**: Creators can manage, guests can only view

### **State Synchronization**
- **Auto-refresh**: Game state updates after actions
- **View management**: Smart routing based on authentication and game state
- **Error handling**: Graceful degradation with user-friendly messages

---

## 🔮 Future Enhancement Areas

### **Potential Improvements**
- [ ] Real-time updates (WebSocket/SSE)
- [ ] Player avatars/profiles
- [ ] Game statistics/analytics
- [ ] Export game history (PDF/CSV)
- [ ] Multiple currency support
- [ ] Tournament mode
- [ ] Mobile app (React Native)

### **Technical Debt**
- [ ] Add comprehensive tests (Jest/Cypress)
- [ ] Implement proper logging (Winston)
- [ ] Add API rate limiting
- [ ] Database migrations system (vs current schema.sql)
- [ ] Environment configuration management

---

## 🚀 Development Workflow

### **Making Changes**

1. **UI/Logic Changes**: Edit components in `client/components/`
2. **API Changes**: Edit controllers in `api/controllers/`
3. **Database Changes**: Update `api/db/schema.sql` + run `./rebuild.sh`
4. **Deployment**: `docker-compose build client && docker-compose restart client`

### **Key Files for Common Changes**

| Change Type | Primary Files |
|-------------|---------------|
| **Game Rules/Logic** | `api/controllers/gameController.js`, `client/components/GameFinalization.tsx` |
| **Currency/Formatting** | `client/utils/currency.ts`, search for `formatCurrency` |
| **UI Layout** | `client/components/*.tsx`, `client/App.tsx` |
| **Database Schema** | `api/db/schema.sql` |
| **Authentication** | `api/controllers/sessionController.js`, `client/hooks/useSession.ts` |
| **Navigation/Routing** | `client/App.tsx` (view management) |
| **API Endpoints** | `api/routes/*.js`, `api/controllers/*.js` |

---

*This documentation reflects the current state as of January 2025. Update this file when making significant architectural changes.*
