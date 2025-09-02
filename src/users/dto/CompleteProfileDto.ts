import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({ description: 'Nombre(s) del usuario' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Apellidos del usuario' })
  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @ApiProperty({ description: 'ID del rol a asignar (opcional)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  rolId?: number;
}