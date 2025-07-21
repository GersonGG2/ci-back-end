import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('cursos')
@Controller('cursos')
// // @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Jefe de academia')
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  @ApiResponse({ status: 201, description: 'Curso creado exitosamente' })
  create(@Body() createCursoDto: CreateCursoDto, @Req() req) {
    const userId = req.user.id;
    return this.cursosService.create(createCursoDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cursos' })
  @ApiResponse({ status: 200, description: 'Lista de cursos obtenida exitosamente' })
  @ApiQuery({ name: 'periodoId', required: false, type: Number, description: 'Filtrar por periodo' })
  @ApiQuery({ name: 'academiaId', required: false, type: Number, description: 'Filtrar por academia' })
  findAll(
    @Query('periodoId') periodoId?: number,
    @Query('academiaId') academiaId?: number
  ) {
    if (periodoId) {
      return this.cursosService.findByPeriodo(+periodoId);
    }
    
    if (academiaId) {
      return this.cursosService.findByAcademia(+academiaId);
    }
    
    return this.cursosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  @ApiResponse({ status: 200, description: 'Curso obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  findOne(@Param('id') id: string) {
    return this.cursosService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Jefe de academia')
  @ApiOperation({ summary: 'Actualizar un curso' })
  @ApiResponse({ status: 200, description: 'Curso actualizado exitosamente' })
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto, @Req() req) {
    const userId = req.user.id;
    return this.cursosService.update(+id, updateCursoDto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Jefe de academia')
  @ApiOperation({ summary: 'Eliminar un curso' })
  @ApiResponse({ status: 200, description: 'Curso eliminado exitosamente' })
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.cursosService.remove(+id, userId);
  }

  @Patch(':id/aprobar')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Aprobar un curso propuesto' })
  @ApiResponse({ status: 200, description: 'Curso aprobado exitosamente' })
  aprobar(@Param('id') id: string) {
    return this.cursosService.aprobarCurso(+id);
  }

  @Patch(':id/rechazar')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Rechazar un curso propuesto' })
  @ApiResponse({ status: 200, description: 'Curso rechazado exitosamente' })
  rechazar(@Param('id') id: string) {
    return this.cursosService.rechazarCurso(+id);
  }

  @Patch(':id/finalizar')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Finalizar un curso aprobado' })
  @ApiResponse({ status: 200, description: 'Curso finalizado exitosamente' })
  finalizar(@Param('id') id: string) {
    return this.cursosService.finalizarCurso(+id);
  }
}