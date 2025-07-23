import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodosService } from './periodos.service';
import { PeriodosController } from './periodos.controller';
import { Periodo } from './entities/periodo.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Periodo]),
    AuthModule,CommonModule
  ],
  controllers: [PeriodosController],
  providers: [PeriodosService],
  exports: [PeriodosService]
})
export class PeriodosModule {}