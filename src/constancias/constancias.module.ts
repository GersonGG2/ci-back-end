import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstanciasService } from './constancias.service';
import { ConstanciasController } from './constancias.controller';
import { Constancia } from './entities/constancia.entity';
import { InscripcionesModule } from '../inscripciones/inscripciones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Constancia]),
    InscripcionesModule,
    AuthModule
  ],
  controllers: [ConstanciasController],
  providers: [ConstanciasService],
  exports: [ConstanciasService]
})
export class ConstanciasModule {}