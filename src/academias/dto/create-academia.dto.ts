import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAcademiaDto {
  @ApiProperty({ description: 'Nombre de la academia', example: 'Ingeniería en Sistemas Computacionales' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ 
    description: 'Descripción de la academia', 
    example: 'Academia especializada en desarrollo de software y redes',
    required: false
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}