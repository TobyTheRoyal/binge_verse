import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { username, email, password } = registerDto;
    try {
      this.logger.log(`Registering user: ${JSON.stringify({ username, email })}`);
      const existingUserByEmail = await this.usersService.findByEmail(email);
      if (existingUserByEmail) throw new ConflictException('Email already exists');
      const existingUserByUsername = await this.usersService.findByUsername(username);
      if (existingUserByUsername) throw new ConflictException('Username already exists');
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.usersService.create({ username, email, password: hashedPassword });
      if (!user || !user.id) throw new Error('Failed to create user');
      this.logger.log(`User created: ${JSON.stringify({ id: user.id, email: user.email })}`);
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);
      this.logger.log(`Generated token for user ID: ${user.id}`);
      return { access_token };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;
    try {
      this.logger.log(`Login attempt: ${JSON.stringify({ email })}`);
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.log(`User not found: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.log(`Password invalid for: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);
      this.logger.log(`Login successful for user ID: ${user.id}`);
      return { access_token };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw error;
    }
  }
}