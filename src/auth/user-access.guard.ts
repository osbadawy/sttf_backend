import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/user/models/user.model';
import { PlayerStats } from 'src/user/models/player_stats.model';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';

@Injectable()
export class UserAccessGuard implements CanActivate {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    // Ensure FirebaseAuthGuard has already run and set req.user
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException(
        'FirebaseAuthGuard must be applied before UserAccessGuard',
      );
    }

    const firebase_id = req.user.uid;

    try {
      // Fetch the full user from the database with common relations
      const user = await this.userModel.findOne({
        where: { firebase_id },
        include: [
          {
            model: PlayerStats,
            required: false,
          },
          {
            model: WhoopUser,
            as: 'whoop_user',
            required: false,
          },
        ],
      });

      if (!user) {
        throw new NotFoundException(
          `User not found for firebase_id: ${firebase_id}`,
        );
      }

      // Attach the complete database user to the request
      req.dbUser = user;

      return true;
    } catch (e: unknown) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to fetch user';
      throw new UnauthorizedException(errorMessage);
    }
  }
}
