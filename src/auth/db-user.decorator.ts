import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/user/models/user.model';
import type { UserAccessRequest } from './auth.types';

/**
 * Custom decorator to extract the database user from the request.
 * This should be used in conjunction with both FirebaseAuthGuard and UserAccessGuard.
 *
 * @example
 * ```typescript
 * @Controller('example')
 * @UseGuards(FirebaseAuthGuard, UserAccessGuard)
 * export class ExampleController {
 *   @Get()
 *   async getExample(@DbUser() user: User) {
 *     // user is the full database user with relations
 *     return { userId: user.id, email: user.email };
 *   }
 * }
 * ```
 */
export const DbUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<UserAccessRequest>();
    return request.dbUser;
  },
);
