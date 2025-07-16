import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademiasService } from './academias.service';
import { AcademiasController } from './academias.controller';
import { Academia } from './entities/academia.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Academia]),
    AuthModule
  ],
  controllers: [AcademiasController],
  providers: [AcademiasService],
  exports: [AcademiasService]
})
export class AcademiasModule {}