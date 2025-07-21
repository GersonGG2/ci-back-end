import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademiasService } from './academias.service';
import { CreateAcademiaDto } from './dto/create-academia.dto';
import { UpdateAcademiaDto } from './dto/update-academia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiPaginatedResponse } from 'src/common/decorators/api-response.decorator';
import { Academia } from './entities/academia.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiResponse as StandardResponse } from 'src/common/interfaces/pagination-result.interface'; // 👈 AÑADIR ESTA LÍNEA

@ApiTags('academias')
@Controller('academias')
// // @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcademiasController {
  constructor(private readonly academiasService: AcademiasService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Crear una nueva academia' })
  @ApiResponse({ status: 201, description: 'Academia creada exitosamente' })
  create(@Body() createAcademiaDto: CreateAcademiaDto) {
    return this.academiasService.create(createAcademiaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las academias' })
  @ApiPaginatedResponse(Academia) // 👈 Usa el nuevo decorador
  async findAll(@Query() paginationQuery: PaginationQueryDto): Promise<StandardResponse<any>> {
    const data = await this.academiasService.findAllPaginated(paginationQuery);

    return {
      data,
      message: 'Datos encontrados exitosamente',
      status: HttpStatus.OK,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una academia por ID' })
  @ApiResponse({ status: 200, description: 'Academia obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Academia no encontrada' })
  findOne(@Param('id') id: string) {
    return this.academiasService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Actualizar una academia' })
  @ApiResponse({ status: 200, description: 'Academia actualizada exitosamente' })
  update(@Param('id') id: string, @Body() updateAcademiaDto: UpdateAcademiaDto) {
    return this.academiasService.update(+id, updateAcademiaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar una academia' })
  @ApiResponse({ status: 200, description: 'Academia eliminada exitosamente' })
  remove(@Param('id') id: string) {
    return this.academiasService.remove(+id);
  }
}