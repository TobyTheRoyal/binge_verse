import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  async create(userData: { username: string; email: string; password: string }): Promise<User> {
    const user = this.userRepository.create(userData);
    try {
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User saved: ${JSON.stringify({ id: savedUser.id, email: savedUser.email })}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error saving user: ${error.message}`, error.stack);
      throw new ConflictException('Could not create user: ' + error.message);
    }
  }
}