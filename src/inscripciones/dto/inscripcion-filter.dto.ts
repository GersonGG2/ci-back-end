import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InscripcionFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, description: 'Filtrar por curso' })
  cursoId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filtrar por docente' })
  docenteId?: number;
}