import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PeriodosService } from './periodos.service';
import { CreatePeriodoDto } from './dto/create-periodo.dto';
import { UpdatePeriodoDto } from './dto/update-periodo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PeriodoFilterDto } from './dto/periodo-filter.dto';

@ApiTags('periodos')
@Controller('periodos')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class PeriodosController {
  constructor(private readonly periodosService: PeriodosService) { }

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Crear un nuevo periodo' })
  @ApiResponse({ status: 201, description: 'Periodo creado exitosamente' })
  create(@Body() createPeriodoDto: CreatePeriodoDto) {
    return this.periodosService.create(createPeriodoDto, createPeriodoDto.usuarioId);
  }


  @Get()
  @ApiOperation({ summary: 'Obtener todos los periodos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de periodos obtenida exitosamente' })
  async findAll(@Query() filtro: PeriodoFilterDto) {
    const data = await this.periodosService.findAllFiltered(filtro);
    return {
      data,
      message: 'Datos encontrados exitosamente',
      status: 200,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un periodo por ID' })
  @ApiResponse({ status: 200, description: 'Periodo obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Periodo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.periodosService.findOne(+id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Actualizar un periodo' })
  @ApiResponse({ status: 200, description: 'Periodo actualizado exitosamente' })
  update(@Param('id') id: string, @Body() updatePeriodoDto: UpdatePeriodoDto) {
    return this.periodosService.update(+id, updatePeriodoDto);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar un periodo' })
  @ApiResponse({ status: 200, description: 'Periodo eliminado exitosamente' })
  remove(@Param('id') id: string) {
    return this.periodosService.remove(+id);
  }

  @Patch(':id/activar')
  @Roles('Admin')
  @ApiOperation({ summary: 'Activar un periodo' })
  @ApiResponse({ status: 200, description: 'Periodo activado exitosamente' })
  activar(@Param('id') id: string) {
    return this.periodosService.activarPeriodo(+id);
  }

  @Patch(':id/cerrar')
  @Roles('Admin')
  @ApiOperation({ summary: 'Cerrar un periodo' })
  @ApiResponse({ status: 200, description: 'Periodo cerrado exitosamente' })
  cerrar(@Param('id') id: string) {
    return this.periodosService.cerrarPeriodo(+id);
  }
}