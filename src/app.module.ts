import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { PeriodosModule } from './periodos/periodos.module';
import { ConstanciasModule } from './constancias/constancias.module';
import { AsistenciasModule } from './asistencias/asistencias.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { CursosModule } from './cursos/cursos.module';
import { AcademiasModule } from './academias/academias.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    UsersModule,
    RolesModule,
    AuthModule,
    PeriodosModule,
    AcademiasModule,
    CursosModule,
    InscripcionesModule,
    AsistenciasModule,
    ConstanciasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}