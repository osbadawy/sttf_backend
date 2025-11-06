import { User } from 'src/user/models/user.model';

/**
 * Request object after FirebaseAuthGuard has authenticated the user
 */
export interface FirebaseAuthenticatedRequest {
  user: {
    uid: string;
    email?: string;
    claims: any;
  };
}

/**
 * Request object after UserAccessGuard has fetched the database user
 */
export interface UserAccessRequest extends FirebaseAuthenticatedRequest {
  dbUser: User;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, any>;
}
