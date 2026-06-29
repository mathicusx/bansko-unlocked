import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  // Admins defined purely via env vars (no DB row needed).
  // Slot 1: ADMIN_USERNAME + ADMIN_PASSWORD_HASH (bcrypt hash).
  // Slots 2-4: ADMIN_USERNAME_N + ADMIN_PASSWORD_N_HASH.
  private readonly envAdmins: { username: string; passwordHash: string }[] = [
    { username: process.env.ADMIN_USERNAME || '', passwordHash: process.env.ADMIN_PASSWORD_HASH || '' },
    ...[2, 3, 4].map((n) => ({
      username: process.env[`ADMIN_USERNAME_${n}`] || '',
      passwordHash: process.env[`ADMIN_PASSWORD_${n}_HASH`] || '',
    })),
  ].filter((a) => a.username && a.passwordHash);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const envAdmin = this.envAdmins.find((a) => a.username === username);
    if (envAdmin) {
      const isMatch = await bcrypt.compare(password, envAdmin.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = { sub: `env:${envAdmin.username}`, username: envAdmin.username };
      return { access_token: this.jwtService.sign(payload) };
    }

    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
