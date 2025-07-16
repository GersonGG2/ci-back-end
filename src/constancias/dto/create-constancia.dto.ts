import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateConstanciaDto {
  @ApiProperty({ description: 'ID de la inscripción aprobada', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  inscripcionId: number;

  @ApiProperty({ description: 'Folio único de la constancia', example: 'ITZCURSO-2024-001' })
  @IsOptional()
  @IsString()
  folio?: string;
}