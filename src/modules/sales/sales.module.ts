import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService, PrismaService, AuthService],
})
export class SalesModule {}
