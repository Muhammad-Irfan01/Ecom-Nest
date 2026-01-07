import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, AuthService],
})
export class OrdersModule {}
