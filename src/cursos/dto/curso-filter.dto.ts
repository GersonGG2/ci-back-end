import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CursoFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, description: 'Filtrar por periodo' })
  periodoId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filtrar por academia' })
  academiaId?: number;
}