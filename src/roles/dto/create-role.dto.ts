import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Admin'
  })
  @IsNotEmpty()
  @IsString()
  name: string;
  
  // Elimina la propiedad description ya que no existe en la BD
}