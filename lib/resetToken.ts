import { createHash } from 'crypto';

// Password reset tokens are stored hashed; the plain token only exists in the emailed link.
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
