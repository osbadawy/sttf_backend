# STTF Backend

A NestJS-based backend API for the **Saudi Table Tennis Federation (STTF)** sports training and fitness tracking platform. Built by the **Covelant** team, this system provides comprehensive athlete management with Whoop integration, Firebase authentication, and role-based access control.

## Database Schema

![Database ERD](./erd.png)

> **Note:** This ERD diagram was generated using PgAdmin 4.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Firebase project with service account credentials
- Whoop Developer Account (for OAuth integration)

## Project Setup

### 1. Environment Configuration

Create a `.env` file in the project root with the following variables:

```bash
# Application
NODE_ENV=development
APP_PORT=5000

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
SESSION_SECRET=your-session-secret

# Database (PostgreSQL)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=sttf_db
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password

# Firebase Authentication
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_API_KEY=your-firebase-api-key

# Whoop OAuth (Default values for development)
WHOOP_AUTHORIZE_URL=https://api.prod.whoop.com/oauth/oauth2/auth
WHOOP_TOKEN_URL=https://api.prod.whoop.com/oauth/oauth2/token
WHOOP_CLIENT_ID=placeholder
WHOOP_CLIENT_SECRET=placeholder

# Error Tracking
SENTRY_DSN=your-sentry-dsn-optional

# Initial Setup Flag (set to true for first run to create database tables)
INITIAL_SETUP=false
```

**Note:** Check your team's Notion or secure documentation for the actual environment values.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Application with Docker

The application uses Docker Compose to run both the NestJS app and PostgreSQL database.

```bash
# Start services
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Rebuild and start (useful after dependency changes)
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v
```

Convenient npm scripts are also available:

```bash
# Build and start with Docker
npm run dbuild

# Reset database and rebuild (removes all data)
npm run dreset
```

### 4. Database Initialization

The application uses Sequelize ORM with automatic model synchronization:

- **Development Mode:** Database tables are automatically created/synchronized on every startup
- **Production Mode:** Set `INITIAL_SETUP=true` for the first deployment to create tables, then set it back to `false` for subsequent deployments

**For Production First Deployment:**

```bash
INITIAL_SETUP=true
```

After the first successful startup, set it back to `false`:

```bash
INITIAL_SETUP=false
```

### 5. Configure Whoop Integration

**Important:** After the application is running, you need to add Whoop OAuth credentials to the database.

#### Prerequisites

You must have an admin account to add Whoop credentials. Create a user with the `admin` role in your `users` table (either manually in the database or through your user management system).

#### Add Whoop Access Credentials

Make a POST request to add your Whoop OAuth credentials:

**Endpoint:** `POST /whoop/auth/add-access`

**Authentication Required:** Admin role only

**Headers:**
```
Authorization: Bearer <firebase-jwt-token-from-admin-account>
Content-Type: application/json
```

**Body:**
```json
{
  "client_id": "your-whoop-client-id",
  "client_secret": "your-whoop-client-secret"
}
```

**Response:**
```json
{
  "ok": true,
  "id": 1
}
```

**Note:** The credentials are encrypted in the database using the `ENCRYPTION_KEY` from your environment variables.

### 6. Access the Application

Once running, the application is available at:

- **API:** `http://localhost:5000`
- **Swagger Documentation (Development only):** `http://localhost:5000/api`
- **PostgreSQL:** `localhost:5432`

## Development

### Running Without Docker

```bash
# Development mode with hot-reload
npm run start:dev

# Debug mode (with debugger attached on port 9229)
npm run start:debug

# Production mode
npm run start:prod
```

**Note:** When running without Docker, ensure PostgreSQL is running separately and update `POSTGRES_HOST=localhost` in your `.env` file.

### Available Scripts

```bash
# Build the application
npm run build

# Format code
npm run format
npm run format:check

# Lint code
npm run lint

# Run tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## API Documentation

In development mode, full API documentation is available via Swagger UI at `http://localhost:5000/api`. This includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Role-based access control information
- Try-it-out functionality

## Authentication & Authorization

The application uses Firebase JWT tokens for authentication and role-based access control.

### User Roles

- `admin` - Full system access
- `coach` - Access to coaching features and player data
- `nutritionist` - Access to nutrition features and player data
- `player` - Limited access to own data only

### Making Authenticated Requests

Include the Firebase JWT token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

### Authentication Components

**Guards:**
1. `FirebaseAuthGuard` - Validates Firebase JWT tokens
2. `UserAccessGuard` - Fetches full user from database with relations
3. `RolesGuard` - Enforces role-based access control

**Decorators:**
- `@DbUser()` - Extract the database user in controller methods
- `@Roles(...roles)` - Specify which roles can access a route (allowlist)
- `@IgnoreRoles(...roles)` - Specify which roles CANNOT access a route (denylist)
- `@AllowSelfAccess(paramName)` - Allow players to access their own data

### Default Access Behavior

**By default, ALL roles can access routes protected by `RolesGuard`.** Use `@Roles()` or `@IgnoreRoles()` to restrict access.

### Guard Order

Always use guards in this order:

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
```

1. `FirebaseAuthGuard` validates the token and sets `req.user` with Firebase data
2. `UserAccessGuard` fetches full user from database and sets `req.dbUser`
3. `RolesGuard` checks authorization based on user role and access rules

### Code Examples

**All Roles (Default):**

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Get('/dashboard')
async getDashboard(@DbUser() user: User) {
  return await this.dashboardService.getData(user);
}
```

**Admin Only:**

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('admin')
@Delete('/user/:id')
async deleteUser(@Param('id') id: string) {
  return await this.userService.deleteUser(id);
}
```

**Staff Only (Exclude Players):**

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@IgnoreRoles('player')
@Get('/admin/players')
async getAllPlayers(@DbUser() user: User) {
  return await this.userService.getPlayers();
}
```

**Staff + Player Self-Access:**

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('coach', 'nutritionist', 'admin', 'player')
@AllowSelfAccess('firebase_id')
@Get('/user/:firebase_id/stats')
async getUserStats(
  @Param('firebase_id') firebase_id: string,
  @DbUser() user: User
) {
  return await this.statsService.getStats(firebase_id);
}
```

### Accessing User Data

Use the `@DbUser()` decorator to access the authenticated user:

```typescript
async myMethod(@DbUser() user: User) {
  console.log(user.id);              // Database user ID
  console.log(user.firebase_id);      // Firebase UID
  console.log(user.email);            // User email
  console.log(user.access);           // Role: 'player' | 'coach' | 'nutritionist' | 'admin'
  console.log(user.player_stats);     // Related PlayerStats (if exists)
  console.log(user.whoop_user);       // Related WhoopUser (if exists)
}
```

## Key Features

- 🔐 **Firebase Authentication** - Secure JWT-based authentication
- 👥 **Role-Based Access Control** - Admin, Coach, Nutritionist, and Player roles
- 📊 **Whoop Integration** - OAuth flow, workouts, recovery, sleep, and cycle data
- 🍽️ **Meal Planning** - Meal creation and assignment with recurring patterns
- 📅 **Activity Planning** - Planned activity management with assignments
- 💪 **User Management** - Comprehensive user profiles, stats, and assessments
- 📈 **Daily Points System** - Track and calculate player progress
- 🔄 **Webhook Support** - Real-time updates from Whoop API
- 📝 **API Documentation** - Auto-generated Swagger documentation

## Project Structure

```
src/
├── auth/           # Firebase authentication & guards
├── user/           # User management, profiles, stats
├── whoop/          # Whoop API integration
├── meal/           # Meal planning and management
├── planned_activity/ # Activity planning
└── utils/          # Shared utilities
```

## Troubleshooting

**Database Connection Issues:**
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check database credentials in `.env` match docker-compose.yml
- Verify `POSTGRES_HOST=postgres` when using Docker

**Whoop OAuth Not Working:**
- Verify Whoop credentials are added to database via `/whoop/auth/add-access` endpoint
- Check that Whoop OAuth URLs are correct in `.env`
- Ensure your Whoop app's redirect URI matches your callback endpoint

**Authentication Failures:**
- Verify Firebase credentials are correctly formatted in `.env`
- Ensure `FIREBASE_PRIVATE_KEY` includes `\n` for line breaks
- Check that Firebase JWT tokens are valid and not expired

**Port Conflicts:**
- If port 5000 is in use, change `APP_PORT` in `.env`
- If port 5432 is in use, change `POSTGRES_PORT` in `.env`

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Configure SSL certificates (placed in `/app/ssl/`)
3. Update `POSTGRES_HOST` to your production database
4. Enable SSL for PostgreSQL connection (configured automatically in production)
5. Set up proper `SENTRY_DSN` for error tracking
6. Use `Dockerfile.deploy` for optimized production builds

## Support

### Documentation
For environment configuration values, check your team's internal documentation or Notion workspace.

### Contact

**Covelant Team:**
- Development Support: dev@covelant.com
- General Support: support@covelant.com

---

**Built by Covelant for the Saudi Table Tennis Federation**
