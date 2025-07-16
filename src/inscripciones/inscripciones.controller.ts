import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateInscripcionDto } from './dto/create-inscripcione.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcione.dto';

@ApiTags('inscripciones')
@Controller('inscripciones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Docente')
  @ApiOperation({ summary: 'Inscribir a un docente en un curso' })
  @ApiResponse({ status: 201, description: 'Inscripción realizada exitosamente' })
  create(@Body() createInscripcionDto: CreateInscripcionDto, @Req() req) {
    const userId = req.user.id;
    return this.inscripcionesService.create(createInscripcionDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las inscripciones' })
  @ApiResponse({ status: 200, description: 'Lista de inscripciones obtenida exitosamente' })
  @ApiQuery({ name: 'cursoId', required: false, type: Number, description: 'Filtrar por curso' })
  @ApiQuery({ name: 'docenteId', required: false, type: Number, description: 'Filtrar por docente' })
  findAll(
    @Query('cursoId') cursoId?: number,
    @Query('docenteId') docenteId?: number
  ) {
    if (cursoId) {
      return this.inscripcionesService.findByCurso(+cursoId);
    }
    
    if (docenteId) {
      return this.inscripcionesService.findByDocente(+docenteId);
    }
    
    return this.inscripcionesService.findAll();
  }

  @Get('mis-inscripciones')
  @ApiOperation({ summary: 'Obtener inscripciones del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de inscripciones obtenida exitosamente' })
  findMyInscripciones(@Req() req) {
    const userId = req.user.id;
    return this.inscripcionesService.findByDocente(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una inscripción por ID' })
  @ApiResponse({ status: 200, description: 'Inscripción obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.inscripcionesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Actualizar una inscripción' })
  @ApiResponse({ status: 200, description: 'Inscripción actualizada exitosamente' })
  update(@Param('id') id: string, @Body() updateInscripcionDto: UpdateInscripcionDto) {
    return this.inscripcionesService.update(+id, updateInscripcionDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar una inscripción' })
  @ApiResponse({ status: 200, description: 'Inscripción eliminada exitosamente' })
  remove(@Param('id') id: string) {
    return this.inscripcionesService.remove(+id);
  }

  @Patch(':id/aprobar')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Aprobar una inscripción' })
  @ApiResponse({ status: 200, description: 'Inscripción aprobada exitosamente' })
  aprobar(@Param('id') id: string) {
    return this.inscripcionesService.aprobarInscripcion(+id);
  }

  @Patch(':id/reprobar')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Reprobar una inscripción' })
  @ApiResponse({ status: 200, description: 'Inscripción reprobada exitosamente' })
  reprobar(@Param('id') id: string) {
    return this.inscripcionesService.reprobarInscripcion(+id);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una inscripción (solo el propio docente)' })
  @ApiResponse({ status: 200, description: 'Inscripción cancelada exitosamente' })
  cancelar(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.inscripcionesService.cancelarInscripcion(+id, userId);
  }
}