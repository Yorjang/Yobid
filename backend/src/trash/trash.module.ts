import { Module } from '@nestjs/common';
import { TrashService } from './trash.service';
import { TrashController } from './trash.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TrashService],
  controllers: [TrashController],
})
export class TrashModule {}
