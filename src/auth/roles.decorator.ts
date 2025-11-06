import { SetMetadata } from '@nestjs/common';
import { UserAccess } from 'src/user/models/user.model';

export const ROLES_KEY = 'roles';
export const IGNORE_ROLES_KEY = 'ignoreRoles';
export const ALLOW_SELF_ACCESS_KEY = 'allowSelfAccess';

/**
 * Decorator to specify which user roles can access a route.
 *
 * **Default Behavior:** If RolesGuard is used without @Roles() or @IgnoreRoles(),
 * ALL roles are allowed by default.
 *
 * @param roles - Array of allowed user access types
 *
 * @example
 * // Default: All roles can access
 * @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
 * @Get('/public-data')
 * async getPublicData() { ... }
 *
 * @example
 * // Only admins and coaches can access
 * @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
 * @Roles('admin', 'coach')
 * @Post('/create-plan')
 * async createPlan() { ... }
 */
export const Roles = (...roles: UserAccess[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to specify which user roles CANNOT access a route.
 * All other roles will be allowed.
 *
 * **Note:** This takes precedence over @Roles(). If both are specified,
 * @IgnoreRoles() will be used.
 *
 * @param roles - Array of user access types to exclude
 *
 * @example
 * // All roles except players can access
 * @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
 * @IgnoreRoles('player')
 * @Get('/staff-dashboard')
 * async getStaffDashboard() { ... }
 *
 * @example
 * // Only players can access (exclude all staff)
 * @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
 * @IgnoreRoles('admin', 'coach', 'nutritionist')
 * @Get('/player-only-route')
 * async getPlayerData() { ... }
 */
export const IgnoreRoles = (...roles: UserAccess[]) =>
  SetMetadata(IGNORE_ROLES_KEY, roles);

/**
 * Decorator to allow players to access their own data.
 * Must be used with @Roles() decorator.
 * The route must have a parameter that matches the user's firebase_id or user id.
 *
 * @param paramName - The name of the route parameter/query param to check (default: 'firebase_id')
 *
 * @example
 * // Coaches/admins can see anyone's data, players can only see their own
 * @Roles('coach', 'admin', 'player')
 * @AllowSelfAccess('firebase_id')
 * @Get('/user/:firebase_id/stats')
 * async getUserStats(@Param('firebase_id') firebase_id: string) { ... }
 *
 * @example
 * // Using query parameter
 * @Roles('coach', 'nutritionist', 'player')
 * @AllowSelfAccess('firebase_id')
 * @Get('/meals')
 * async getMeals(@Query('firebase_id') firebase_id: string) { ... }
 */
export const AllowSelfAccess = (paramName: string = 'firebase_id') =>
  SetMetadata(ALLOW_SELF_ACCESS_KEY, paramName);
