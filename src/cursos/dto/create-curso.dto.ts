import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class CreateCursoDto {
  @ApiProperty({ description: 'Nombre del curso', example: 'Diplomado DREAVA Módulo 4' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ 
    description: 'Objetivo del curso', 
    example: 'Capacitar al personal docente en el uso de herramientas tecnológicas para el desarrollo'
  })
  @IsNotEmpty()
  @IsString()
  objetivo: string;

  @ApiProperty({ description: 'ID del periodo al que pertenece el curso', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  periodoId: number;

  @ApiProperty({ description: 'ID de la academia que propone el curso', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  academiaId: number;

  @ApiProperty({ description: 'ID del usuario que será instructor', example: 5 })
  @IsNotEmpty()
  @IsNumber()
  instructorId: number;

  @ApiProperty({ description: 'Lugar donde se impartirá el curso', example: 'Instituto Tecnológico de Zacatepec' })
  @IsNotEmpty()
  @IsString()
  lugar: string;

  @ApiProperty({ description: 'Aula o espacio donde se impartirá', example: 'Aula 2-2' })
  @IsNotEmpty()
  @IsString()
  aula: string;

  @ApiProperty({ description: 'Cantidad de horas del curso', example: 30 })
  @IsNotEmpty()
  @IsNumber()
  horas: number;

  @ApiProperty({ description: 'Fecha de inicio del curso', example: '2024-06-17' })
  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ description: 'Fecha de finalización del curso', example: '2024-06-21' })
  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ description: 'Hora de inicio de las sesiones', example: '08:00' })
  @IsNotEmpty()
  @IsString()
  hora_inicio: string;

  @ApiProperty({ description: 'Hora de finalización de las sesiones', example: '14:00' })
  @IsNotEmpty()
  @IsString()
  hora_fin: string;

  @ApiProperty({ 
    description: 'A quién está dirigido el curso', 
    example: 'DOCENTES DE CIENCIAS BÁSICAS Y ÁREAS AFINES' 
  })
  @IsNotEmpty()
  @IsString()
  dirigido_a: string;

  @ApiProperty({ 
    description: 'Prerequisitos para tomar el curso', 
    example: 'Conocimientos básicos de álgebra',
    required: false 
  })
  @IsOptional()
  @IsString()
  prerequisitos?: string;

  @ApiProperty({ 
    description: 'Estado inicial del curso', 
    example: 'propuesto',
    enum: ['propuesto', 'aprobado', 'rechazado', 'finalizado'],
    default: 'propuesto',
    required: false
  })
  @IsOptional()
  @IsEnum(['propuesto', 'aprobado', 'rechazado', 'finalizado'])
  estado?: string;
}