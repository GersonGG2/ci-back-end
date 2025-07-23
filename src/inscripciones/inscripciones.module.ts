import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesService } from './inscripciones.service';
import { InscripcionesController } from './inscripciones.controller';
import { CursosModule } from '../cursos/cursos.module';
import { AuthModule } from '../auth/auth.module';
import { Inscripcion } from './entities/inscripcione.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inscripcion]),
    CursosModule,
    AuthModule,
    CommonModule
  ],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
  exports: [InscripcionesService]
})
export class InscripcionesModule {}