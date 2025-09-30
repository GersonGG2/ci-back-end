import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class CambiarEstatusCursosDto {
  @ApiProperty({
    description: 'IDs de los cursos a cambiar estado',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  cursosIds: number[];

  @ApiProperty({
    description: 'Nuevo estado para los cursos',
    example: 'aprobado',
    enum: ['nuevo', 'propuesto', 'aprobado', 'rechazado', 'finalizado'],
  })
  @IsNotEmpty()
  @IsEnum(['nuevo', 'propuesto', 'aprobado', 'rechazado', 'finalizado'])
  nuevoEstado: string;
}
