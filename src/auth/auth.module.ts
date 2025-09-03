import { Global, Module } from '@nestjs/common';
import {
  FirebaseAdminProvider,
  FIREBASE_ADMIN,
} from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { TestAuthController } from './test.controller';

@Global()
@Module({
  providers: [FirebaseAdminProvider, FirebaseAuthGuard],
  exports: [FirebaseAuthGuard, FIREBASE_ADMIN],
  controllers: [TestAuthController],
})
export class AuthModule {}
