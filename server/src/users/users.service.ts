import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  create(username: string, hashedPassword: string) {
    const user = this.usersRepo.create({ username, password: hashedPassword });
    return this.usersRepo.save(user);
  }
}
