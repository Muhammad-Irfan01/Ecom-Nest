import { Module } from '@nestjs/common';
import { AccessProgramService } from './access-program.service';
import { AccessProgramController } from './access-program.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AccessProgramController],
  providers: [AccessProgramService, PrismaService],
})
export class AccessProgramModule {}