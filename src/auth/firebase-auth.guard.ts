import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from './firebase-admin.provider';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject(FIREBASE_ADMIN) private readonly fb: typeof admin) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (!token) throw new UnauthorizedException('Missing Bearer token');

    try {
      const decoded = await this.fb.auth().verifyIdToken(token, true); // true checks revocation
      req.user = { uid: decoded.uid, email: decoded.email, claims: decoded };
      return true;
    } catch (e: any) {
      throw new UnauthorizedException(e?.message || 'Invalid Firebase token');
    }
  }
}
