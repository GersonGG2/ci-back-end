import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateInscripcionDto {
  @ApiProperty({ description: 'ID del curso al que se inscribe', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  cursoId: number;

  @ApiProperty({ 
    description: 'Estado de la inscripción', 
    example: 'inscrito',
    enum: ['inscrito', 'aprobado', 'reprobado', 'cancelado'],
    default: 'inscrito',
    required: false
  })
  @IsOptional()
  @IsEnum(['inscrito', 'aprobado', 'reprobado', 'cancelado'])
  estado?: string;
}