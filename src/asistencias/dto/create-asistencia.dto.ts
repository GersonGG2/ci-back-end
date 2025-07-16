import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class CreateAsistenciaDto {
  @ApiProperty({ description: 'ID de la inscripción', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  inscripcionId: number;

  @ApiProperty({ description: 'Fecha de la asistencia', example: '2024-06-17' })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Si el docente asistió o no', example: true })
  @IsNotEmpty()
  @IsBoolean()
  asistio: boolean;
}