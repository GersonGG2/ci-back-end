import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateInscripcionDto } from './create-inscripcione.dto';

export class UpdateInscripcionDto extends PartialType(CreateInscripcionDto) {
  @ApiProperty({ 
    description: 'Estado de la inscripción', 
    example: 'aprobado',
    enum: ['inscrito', 'aprobado', 'reprobado', 'cancelado'],
    required: false
  })
  @IsOptional()
  @IsEnum(['inscrito', 'aprobado', 'reprobado', 'cancelado'])
  estado?: string;
}