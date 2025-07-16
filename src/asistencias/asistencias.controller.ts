import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('asistencias')
@Controller('asistencias')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Registrar una asistencia' })
  @ApiResponse({ status: 201, description: 'Asistencia registrada exitosamente' })
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciasService.create(createAsistenciaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las asistencias' })
  @ApiResponse({ status: 200, description: 'Lista de asistencias obtenida exitosamente' })
  @ApiQuery({ name: 'inscripcionId', required: false, type: Number, description: 'Filtrar por inscripción' })
  @ApiQuery({ name: 'cursoId', required: false, type: Number, description: 'Filtrar por curso' })
  findAll(
    @Query('inscripcionId') inscripcionId?: number,
    @Query('cursoId') cursoId?: number,
  ) {
    if (inscripcionId) {
      return this.asistenciasService.findByInscripcion(+inscripcionId);
    }

    if (cursoId) {
      return this.asistenciasService.findByCurso(+cursoId);
    }

    return this.asistenciasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asistencia por ID' })
  @ApiResponse({ status: 200, description: 'Asistencia obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada' })
  findOne(@Param('id') id: string) {
    return this.asistenciasService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Actualizar una asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia actualizada exitosamente' })
  update(@Param('id') id: string, @Body() updateAsistenciaDto: UpdateAsistenciaDto) {
    return this.asistenciasService.update(+id, updateAsistenciaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar una asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia eliminada exitosamente' })
  remove(@Param('id') id: string) {
    return this.asistenciasService.remove(+id);
  }

  @Post('registrar')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Registrar o actualizar una asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia registrada exitosamente' })
  registrarAsistencia(
    @Body() body: { inscripcionId: number; fecha: string; asistio: boolean },
  ) {
    return this.asistenciasService.registrarAsistencia(
      body.inscripcionId,
      body.fecha,
      body.asistio,
    );
  }
}