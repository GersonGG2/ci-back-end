import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsDefined, IsNumber } from 'class-validator';

export class CambiarEstatusCursosDto {
  @ApiProperty({
    description: 'IDs de los cursos a cambiar estado',
    example: [1, 2, 3],
    type: [Number],
    required: true,
  })
  @IsDefined()
  @IsArray()
  @IsNumber({}, { each: true })
  cursosIds: number[];

  @ApiProperty({
    description: 'Nuevo estado para los cursos',
    example: 'aprobado',
    enum: ['nuevo', 'propuesto', 'aprobado', 'rechazado', 'finalizado'],
    required: true,
  })
  @IsDefined()
  @IsEnum(['nuevo', 'propuesto', 'aprobado', 'rechazado', 'finalizado'])
  nuevoEstado: string;
}