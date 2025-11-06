# Authentication & Authorization System

This module provides a comprehensive authentication and authorization system with Firebase integration and role-based access control.

## Components

### Guards

1. **FirebaseAuthGuard** - Validates Firebase JWT tokens
2. **UserAccessGuard** - Fetches full user from database with relations
3. **RolesGuard** - Enforces role-based access control

### Decorators

- **@DbUser()** - Extract the database user in controller methods
- **@Roles(...roles)** - Specify which roles can access a route (allowlist)
- **@IgnoreRoles(...roles)** - Specify which roles CANNOT access a route (denylist)
- **@AllowSelfAccess(paramName)** - Allow players to access their own data

## Default Access Behavior

**By default, ALL roles (`admin`, `coach`, `nutritionist`, `player`) can access routes protected by `RolesGuard`.**

You can restrict access using:
- `@Roles()` to allow specific roles only
- `@IgnoreRoles()` to exclude specific roles

## Usage Examples

### Example 1: Default - All Roles Access

```typescript
// All authenticated roles can access (default behavior)
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Get('/dashboard')
async getDashboard(@DbUser() user: User) {
  return await this.dashboardService.getData(user);
}
```

### Example 2: Staff-Only Access (Exclude Players)

```typescript
// Only staff can access (exclude players)
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@IgnoreRoles('player')
@Get('/admin/players')
async getAllPlayers(@DbUser() user: User) {
  return await this.userService.getPlayers();
}
```

### Example 3: Admin-Only Access

```typescript
// Only admins can access
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('admin')
@Delete('/user/:id')
async deleteUser(@Param('id') id: string) {
  return await this.userService.deleteUser(id);
}
```

### Example 4: Staff Can View Anyone, Players Can View Their Own

```typescript
// Staff can view any player's stats
// Players can only view their own stats (when firebase_id matches)
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

### Example 5: Using Query Parameters

```typescript
// Works with query parameters too
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('coach', 'nutritionist', 'admin', 'player')
@AllowSelfAccess('firebase_id')
@Get('/meals')
async getMeals(
  @Query('firebase_id') firebase_id: string,
  @DbUser() user: User
) {
  return await this.mealService.getMeals(firebase_id);
}
```

### Example 6: Player-Only Route (Exclude Staff)

```typescript
// Only players can access (must explicitly specify)
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('player')
@Post('/self-assessment')
async submitSelfAssessment(
  @Body() data: SelfAssessmentDto,
  @DbUser() user: User
) {
  return await this.assessmentService.create(user.id, data);
}
```

### Example 7: Nutritionist-Specific Route

```typescript
// Only nutritionists and admins can access
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('nutritionist', 'admin')
@Post('/meal-plan')
async createMealPlan(@Body() data: MealPlanDto) {
  return await this.mealService.createPlan(data);
}
```

### Example 8: Coaches and Nutritionists Only

```typescript
// Exclude both admins and players
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@IgnoreRoles('admin', 'player')
@Get('/field-staff-tools')
async getFieldStaffTools(@DbUser() user: User) {
  return await this.toolsService.getTools();
}
```

## Guard Order

**Always use guards in this order:**

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
```

1. **FirebaseAuthGuard** validates the token and sets `req.user` with Firebase data
2. **UserAccessGuard** fetches full user from database and sets `req.dbUser`
3. **RolesGuard** checks authorization based on user role and access rules

## Access User Data

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

## AllowSelfAccess Parameters

The `@AllowSelfAccess()` decorator checks if a route parameter/query/body matches the user's `firebase_id` or `id`:

- **Route parameters:** `@Param('firebase_id')`
- **Query parameters:** `@Query('firebase_id')`
- **Body parameters:** `@Body() body` (checks body.firebase_id)

Default parameter name is `'firebase_id'`, but you can specify any parameter:

```typescript
@AllowSelfAccess('user_id')  // Check 'user_id' instead
```

## Common Patterns

### Pattern 1: All Authenticated Users (Default)

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Get('/public-data')
// No decorator needed - all roles allowed by default
```

### Pattern 2: Staff Only (Exclude Players)

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@IgnoreRoles('player')
@Get('/all-players')
```

### Pattern 3: View Specific + Self Access

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('coach', 'nutritionist', 'admin', 'player')
@AllowSelfAccess('firebase_id')
@Get('/player/:firebase_id/data')
```

### Pattern 4: Admin Only

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('admin')
@Delete('/sensitive-operation')
```

### Pattern 5: Specific Staff Roles

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@Roles('coach', 'admin')
@Post('/training-plan')
```

### Pattern 6: Player Only

```typescript
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
@IgnoreRoles('admin', 'coach', 'nutritionist')
@Get('/my-self-assessment')
```

## Testing

Test endpoints are available in `/auth/test.controller.ts`:

- `GET /auth/health` - No auth required
- `GET /auth/me` - Firebase token only
- `GET /auth/me/full` - Full user with relations
- `GET /auth/public/info` - All roles (default behavior)
- `GET /auth/staff/dashboard` - Staff only (excludes players)
- `GET /auth/admin/users` - Admin only
- `GET /auth/user/:firebase_id/profile` - Staff + self-access
- `GET /auth/player-only` - Players only (excludes staff)

