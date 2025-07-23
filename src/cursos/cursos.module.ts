import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursosService } from './cursos.service';
import { CursosController } from './cursos.controller';
import { Curso } from './entities/curso.entity';
import { AuthModule } from '../auth/auth.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { AcademiasModule } from '../academias/academias.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Curso]),
    AuthModule,
    PeriodosModule,
    AcademiasModule,
    CommonModule
  ],
  controllers: [CursosController],
  providers: [CursosService],
  exports: [CursosService]
})
export class CursosModule {}