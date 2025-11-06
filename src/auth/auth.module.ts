import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  FirebaseAdminProvider,
  FIREBASE_ADMIN,
} from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UserAccessGuard } from './user-access.guard';
import { RolesGuard } from './roles.guard';
import { User } from 'src/user/models/user.model';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [
    FirebaseAdminProvider,
    FirebaseAuthGuard,
    UserAccessGuard,
    RolesGuard,
  ],
  exports: [FirebaseAuthGuard, UserAccessGuard, RolesGuard, FIREBASE_ADMIN],
})
export class AuthModule {}
