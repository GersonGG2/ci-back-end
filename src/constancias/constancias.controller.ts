import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ConstanciasService } from './constancias.service';
import { CreateConstanciaDto } from './dto/create-constancia.dto';
import { UpdateConstanciaDto } from './dto/update-constancia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('constancias')
@Controller('constancias')
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConstanciasController {
  constructor(private readonly constanciasService: ConstanciasService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Generar una constancia para una inscripción aprobada' })
  @ApiResponse({ status: 201, description: 'Constancia generada exitosamente' })
  create(@Body() createConstanciaDto: CreateConstanciaDto) {
    return this.constanciasService.create(createConstanciaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las constancias' })
  @ApiResponse({ status: 200, description: 'Lista de constancias obtenida exitosamente' })
  @ApiQuery({ name: 'docenteId', required: false, type: Number, description: 'Filtrar por docente' })
  @ApiQuery({ name: 'cursoId', required: false, type: Number, description: 'Filtrar por curso' })
  findAll(
    @Query('docenteId') docenteId?: number,
    @Query('cursoId') cursoId?: number,
  ) {
    if (docenteId) {
      return this.constanciasService.findByDocente(+docenteId);
    }

    if (cursoId) {
      return this.constanciasService.findByCurso(+cursoId);
    }

    return this.constanciasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una constancia por ID' })
  @ApiResponse({ status: 200, description: 'Constancia obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Constancia no encontrada' })
  findOne(@Param('id') id: string) {
    return this.constanciasService.findOne(+id);
  }

  @Get('folio/:folio')
  @ApiOperation({ summary: 'Obtener una constancia por folio' })
  @ApiResponse({ status: 200, description: 'Constancia obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Constancia no encontrada' })
  findByFolio(@Param('folio') folio: string) {
    return this.constanciasService.findByFolio(folio);
  }

  @Get(':id/descargar')
  @ApiOperation({ summary: 'Descargar una constancia en formato PDF' })
  @ApiResponse({ status: 200, description: 'PDF descargado exitosamente' })
  @ApiResponse({ status: 404, description: 'Constancia no encontrada' })
  async descargar(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const constancia = await this.constanciasService.findOne(+id);
    const file = createReadStream(join(process.cwd(), constancia.rutaPdf));
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="constancia_${constancia.folio}.pdf"`,
    });
    
    return new StreamableFile(file);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Actualizar una constancia' })
  @ApiResponse({ status: 200, description: 'Constancia actualizada exitosamente' })
  update(@Param('id') id: string, @Body() updateConstanciaDto: UpdateConstanciaDto) {
    return this.constanciasService.update(+id, updateConstanciaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar una constancia' })
  @ApiResponse({ status: 200, description: 'Constancia eliminada exitosamente' })
  remove(@Param('id') id: string) {
    return this.constanciasService.remove(+id);
  }

  @Post(':id/regenerar')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Instructor')
  @ApiOperation({ summary: 'Regenerar el PDF de una constancia' })
  @ApiResponse({ status: 200, description: 'PDF regenerado exitosamente' })
  regenerarPDF(@Param('id') id: string) {
    return this.constanciasService.regenerarPDF(+id);
  }
}