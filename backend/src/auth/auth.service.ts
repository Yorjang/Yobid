import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(
    email: string,
    pass: string,
    name?: string,
    role: Role = Role.MEMBER,
  ): Promise<any> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists in the system');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Find or create a user from an OAuth provider.
   * If an account with the same email already exists (local), we link the OAuth
   * provider to that account automatically.
   */
  async validateOAuthUser(
    email: string,
    name: string,
    provider: string,
    providerId: string,
  ): Promise<any> {
    // 1. Check if a user with this providerId already exists
    let user = await this.prisma.user.findFirst({
      where: { provider, providerId },
    });

    if (user) {
      const { password, ...result } = user;
      return result;
    }

    // 2. Check if a local account with the same email exists → link it
    user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link the OAuth provider to the existing account
      user = await this.prisma.user.update({
        where: { email },
        data: { provider, providerId },
      });
      const { password, ...result } = user;
      return result;
    }

    // 3. Create a brand-new OAuth user (no password), default role = MEMBER
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        provider,
        providerId,
        password: null,
        role: Role.MEMBER,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(
    userId: number,
    data: { name?: string; email?: string; password?: string; avatar?: string },
  ) {
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }
    if (data.email !== undefined) {
      if (data.email) {
        const existing = await this.prisma.user.findFirst({
          where: {
            email: data.email,
            NOT: { id: userId },
          },
        });
        if (existing) {
          throw new ConflictException('Email already in use');
        }
        updateData.email = data.email;
      }
    }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...result } = updated;
    return result;
  }
}
