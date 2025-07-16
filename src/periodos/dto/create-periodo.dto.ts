import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsEnum } from 'class-validator';

export class CreatePeriodoDto {
  @ApiProperty({ description: 'Nombre del periodo', example: 'Intersemestral Verano 2024' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Fecha de inicio del periodo', example: '2024-06-01' })
  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ description: 'Fecha de fin del periodo', example: '2024-08-31' })
  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ 
    description: 'Estado del periodo', 
    example: 'inactivo',
    enum: ['activo', 'inactivo', 'cerrado'],
    default: 'inactivo'
  })
  @IsEnum(['activo', 'inactivo', 'cerrado'])
  estado: string;
}