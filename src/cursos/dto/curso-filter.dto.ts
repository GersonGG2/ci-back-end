import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CursoFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, description: 'Filtrar por periodo' })
  periodoId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filtrar por academia' })
  academiaId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filtrar por usuario creador',
  })
  userId?: number;

  @IsOptional()
  @IsEnum(['nuevo', 'propuesto', 'aprobado', 'rechazado', 'finalizado'], {
    message:
      'Estado debe ser uno de: nuevo, propuesto, aprobado, rechazado, finalizado',
  })
  @ApiPropertyOptional({
    enum: ['nuevo', 'propuesto', 'aprobado', 'rechazado', 'finalizado'],
    description: 'Filtrar por estado del curso',
  })
  estado?: string;

  @ApiPropertyOptional({ type: Number, description: 'Filtrar por instructor' })
  @IsOptional()
  @IsNumber({}, { message: 'El instructorId debe ser un número válido' })
  instructorId?: number;

  @ApiPropertyOptional({ type: String, description: 'Filtrar por tipo (AD, AP, etc.)' })
  tipo?: string;
}
