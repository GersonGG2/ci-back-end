import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // AGREGAR ESTA LÍNEA

export class CreateUserDto {
  @ApiProperty({ 
    description: 'ID de autenticación de Auth0', 
    example: 'auth0|12345678901234567890' 
  }) // AGREGAR ESTA LÍNEA
  @IsNotEmpty()
  @IsString()
  auth0_id: string;

  @ApiProperty({ 
    description: 'Correo electrónico del usuario', 
    example: 'usuario@example.com' 
  }) // AGREGAR ESTA LÍNEA
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Nombre(s) del usuario', 
    example: 'Juan Carlos' 
  }) // AGREGAR ESTA LÍNEA
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ 
    description: 'Apellidos del usuario', 
    example: 'García Pérez' 
  }) // AGREGAR ESTA LÍNEA
  @IsNotEmpty()
  @IsString()
  apellidos: string;
}