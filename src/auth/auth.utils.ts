import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/user/models/user.model';

/**
 * Validates that players can only access their own data via users_assigned array
 * @param user - The authenticated user
 * @param users_assigned - Array of firebase_ids being accessed
 * @param errorMessage - Custom error message to throw
 * @throws ForbiddenException if player tries to access other users' data
 */
export function validatePlayerSelfAccess(
  user: User,
  users_assigned: string[],
  errorMessage: string,
): void {
  if (user.access === 'player') {
    if (users_assigned.length !== 1 || users_assigned[0] !== user.firebase_id) {
      throw new ForbiddenException(errorMessage);
    }
  }
}

/**
 * Validates that players can only access their own firebase_id
 * @param user - The authenticated user
 * @param firebase_id - The firebase_id being accessed
 * @param errorMessage - Custom error message to throw
 * @throws ForbiddenException if player tries to access other user's data
 */
export function validatePlayerFirebaseId(
  user: User,
  firebase_id: string,
  errorMessage: string,
): void {
  if (user.access === 'player' && firebase_id !== user.firebase_id) {
    throw new ForbiddenException(errorMessage);
  }
}
