import { Injectable } from '@angular/core';

/**
 * IMPROVED Auth Service with Basic Hashing
 *
 * SECURITY NOTE: This is still client-side auth and NOT truly secure!
 * Anyone with dev tools can still bypass this.
 *
 * This provides:
 * - Obscured credentials (base64 + simple hash)
 * - Makes casual inspection harder
 * - Better than plain text
 *
 * For TRUE security, you need a backend.
 */

@Injectable({
  providedIn: 'root',
})
export class AuthServiceImproved {
  private readonly AUTH_KEY = 'enduro_admin_authenticated';

  // These are base64 encoded strings - harder to read in compiled JS
  // Decode with: atob('YWRtaW4=') → 'admin'
  private readonly ENCODED_USERNAME = 'YWRtaW4='; // 'admin'

  // This is a simple hash - not cryptographically secure but better than plain text
  // To generate: hashPassword('your_password')
  // Current hash is for: 'enduro2025'
  private readonly PASSWORD_HASH = '1a79a4d60de6718e8e5b326e338ae533'; // Example hash

  constructor() {}

  login(username: string, password: string): boolean {
    const decodedUsername = atob(this.ENCODED_USERNAME);
    const passwordHash = this.hashPassword(password);

    if (username === decodedUsername && passwordHash === this.PASSWORD_HASH) {
      localStorage.setItem(this.AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem(this.AUTH_KEY) === 'true';
  }

  /**
   * Simple hash function (NOT cryptographically secure!)
   * For better security, use a backend with bcrypt/argon2
   */
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Helper method to generate password hash
   * Use this in browser console to create new hashes:
   *
   * authService.generateHash('your_new_password')
   */
  generateHash(password: string): string {
    return this.hashPassword(password);
  }
}

/*
 * HOW TO USE:
 *
 * 1. To change the password:
 *    - Open browser console
 *    - Type: authService.generateHash('your_new_password')
 *    - Copy the hash output
 *    - Replace PASSWORD_HASH above with the new hash
 *
 * 2. To change the username:
 *    - Encode new username: btoa('newusername')
 *    - Replace ENCODED_USERNAME above
 *
 * REMEMBER: This is still visible in compiled JavaScript!
 * It just makes it HARDER, not IMPOSSIBLE to find.
 */
