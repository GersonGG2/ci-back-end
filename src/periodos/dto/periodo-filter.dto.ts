import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PeriodoFilterDto {
  @ApiPropertyOptional({ enum: ['activo', 'inactivo', 'cerrado'] })
  estado?: string;

  @ApiPropertyOptional({ type: String })
  fecha_inicio_desde?: string;

  @ApiPropertyOptional({ type: String })
  fecha_inicio_hasta?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ type: String })
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  order?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ type: String })
  searchValue?: string;
}