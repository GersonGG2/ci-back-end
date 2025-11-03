import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
  InternalServerErrorException,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CursoFilterDto } from './dto/curso-filter.dto';
import { CambiarEstatusCursosDto } from './dto/cambiar-estatus-curso.dto';
import { EliminarMultiplesCursosDto } from './dto/EliminarMultiplesCursosDto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@ApiTags('cursos')
@Controller('cursos')
// // @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CursosController {
  constructor(private readonly cursosService: CursosService) { }

  @Post()
  // //@UseGuards(RolesGuard)
  // @Roles('Admin', 'Jefe de academia')
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  @ApiResponse({ status: 201, description: 'Curso creado exitosamente' })
  create(@Body() createCursoDto: CreateCursoDto, @Req() req) {
    // const userId = req.user.id;
    // return this.cursosService.create(createCursoDto, userId);
    return this.cursosService.create(
      createCursoDto,
      createCursoDto.createdBy ?? 1,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los cursos con paginación y filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos obtenida exitosamente',
  })
  @ApiQuery({
    name: 'periodoId',
    required: false,
    type: Number,
    description: 'Filtrar por periodo',
  })
  @ApiQuery({
    name: 'academiaId',
    required: false,
    type: Number,
    description: 'Filtrar por academia',
  })
  @ApiQuery({
    name: 'searchValue',
    required: false,
    type: String,
    description: 'Buscar por nombre u objetivo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Campo de orden',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Orden ascendente o descendente',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de usuario creador',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['enviado', 'propuesto', 'aprobado', 'rechazado', 'finalizado'],
    description: 'Filtrar por estado del curso',
  })

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cursos con filtros' })
  @ApiQuery({ name: 'instructorId', required: false, type: Number })

  async findAll(@Query() filter: CursoFilterDto) {
    return this.cursosService.findAllFiltered(filter);
  }

  @Get('mis-cursos')
  @ApiOperation({
    summary: 'Obtener cursos creados por el usuario logeado o por ID',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description:
      'ID del usuario creador (opcional, usa el usuario autenticado si no se especifica)',
  })
  @ApiQuery({
    name: 'periodoId',
    required: false,
    type: Number,
    description: 'Filtrar por periodo (opcional)',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['enviado', 'propuesto', 'aprobado', 'rechazado', 'finalizado'],
    description: 'Filtrar por estado del curso (opcional)',
  })
  findMisCursos(
    @Req() req,
    @Query('userId') userIdParam?: string,
    @Query('periodoId') periodoIdParam?: string,
    @Query('estado') estado?: string,
  ) {
    console.log('req.user:', req.user);

    // Usa un ID explícito si se proporciona, de lo contrario usa el ID del usuario autenticado
    let id: number | null = null;

    if (userIdParam) {
      id = Number(userIdParam);
    } else if (req.user && req.user.userId) {
      id = Number(req.user.userId);
    }

    // Valida que sea un número válido
    if (id === null || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Convertir periodoId a número si se proporciona
    const periodoId = periodoIdParam ? Number(periodoIdParam) : undefined;

    // Usa try/catch para manejar errores de la base de datos
    try {
      return this.cursosService.findByCreador(id, periodoId, estado);
    } catch (error) {
      console.error('Error al buscar cursos:', error);
      throw new InternalServerErrorException(
        'Error al buscar cursos por creador',
      );
    }
  }

  @Post('cambiar-estatus-por-filtro')
  @ApiOperation({ summary: 'Cambiar estado de cursos por filtros' })
  @ApiResponse({
    status: 200,
    description: 'Estados de cursos cambiados exitosamente',
  })
  cambiarEstatusPorFiltro(
    @Body()
    body: {
      periodoId?: number;
      userId?: number;
      estadoActual?: string;
      nuevoEstado: string;
    },
  ) {
    console.log('[Controller] Payload recibido:', body);
    return this.cursosService.cambiarEstatusPorFiltro(
      {
        periodoId: body.periodoId,
        userId: body.userId,
        estadoActual: body.estadoActual,
      },
      body.nuevoEstado,
    );
  }

  @Get('exportar-pdf')
  @ApiOperation({ summary: 'Exportar cursos filtrados a PDF' })
  @ApiQuery({ name: 'periodoId', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, type: String })
  @ApiQuery({ name: 'academiaId', required: false, type: Number })
  @ApiQuery({ name: 'searchValue', required: false, type: String })
  async exportarPDF(
    @Res() res: Response,
    @Query() query: { periodoId?: number; estado?: string; academiaId?: number; searchValue?: string }
  ) {
    const buffer = await this.cursosService.exportarCursosPDF(query);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cursos.pdf');
    res.send(buffer);
  }

  @Get('exportar-excel')
  @ApiOperation({ summary: 'Exportar cursos filtrados a Excel' })
  @ApiQuery({ name: 'periodoId', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, type: String })
  @ApiQuery({ name: 'academiaId', required: false, type: Number })
  @ApiQuery({ name: 'searchValue', required: false, type: String })
  async exportarExcel(
    @Res() res: Response,
    @Query() query: { periodoId?: number; estado?: string; academiaId?: number; searchValue?: string }
  ) {
    const buffer = await this.cursosService.exportarCursosExcel(query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=cursos.xlsx');
    res.send(buffer);
  }

  @Post('importar-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar cursos desde un archivo Excel (plantilla)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx)',
        },
      },
    },
  })
  async importarExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se ha enviado archivo válido');
    }
    return await this.cursosService.importarCursosExcel(
      Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer as ArrayBuffer),
    );
  }

  @Get('usuario/:userId')
  @ApiOperation({ summary: 'Obtener cursos donde participa un usuario' })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de registros por página' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Campo por el cual ordenar' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Dirección del ordenamiento' })
  @ApiQuery({ name: 'searchValue', required: false, type: String, description: 'Valor para búsqueda' })
  @ApiQuery({ name: 'periodoId', required: false, type: Number, description: 'Filtrar por periodo' })
  @ApiQuery({ name: 'estado', required: false, type: String, description: 'Filtrar por estado' })
  async getCursosByUsuario(
    @Param('userId') userId: number,
    @Query() filter: CursoFilterDto
  ) {
    return this.cursosService.findCursosByUsuario(Number(userId), filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  @ApiResponse({ status: 200, description: 'Curso obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  findOne(@Param('id') id: string) {
    return this.cursosService.findOne(+id);
  }

  @Get('instructor/:instructorId')
  @ApiOperation({ summary: 'Obtener cursos donde participa un instructor' })
  @ApiParam({ name: 'instructorId', type: Number, description: 'ID del instructor' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de registros por página' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Campo por el cual ordenar' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Dirección del ordenamiento' })
  @ApiQuery({ name: 'searchValue', required: false, type: String, description: 'Valor para búsqueda' })
  @ApiQuery({ name: 'periodoId', required: false, type: Number, description: 'Filtrar por periodo' })
  @ApiQuery({ name: 'academiaId', required: false, type: Number, description: 'Filtrar por academia' })
  @ApiQuery({ name: 'estado', required: false, type: String, description: 'Filtrar por estado' })
  async getCursosByInstructor(
    @Param('instructorId') instructorId: number,
    @Query() filter: CursoFilterDto
  ) {
    return this.cursosService.findCursosByInstructor(Number(instructorId), filter);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un curso' })
  @ApiResponse({ status: 200, description: 'Curso actualizado exitosamente' })
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto) {
    // Usa el campo createdBy del body o un valor fijo para pruebas
    const userId = updateCursoDto.createdBy ?? 1;
    return this.cursosService.update(+id, updateCursoDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un curso' })
  @ApiResponse({ status: 200, description: 'Curso eliminado exitosamente' })
  remove(@Param('id') id: string, @Body() body: any) {
    // Usa el campo createdBy del body o un valor fijo para pruebas
    const userId = body?.createdBy ?? 1;
    return this.cursosService.remove(+id, userId);
  }

  @Patch(':id/aprobar')
  @ApiOperation({ summary: 'Aprobar un curso propuesto' })
  @ApiResponse({ status: 200, description: 'Curso aprobado exitosamente' })
  aprobar(@Param('id') id: string) {
    return this.cursosService.aprobarCurso(+id);
  }

  @Patch(':id/rechazar')
  @ApiOperation({ summary: 'Rechazar un curso propuesto' })
  @ApiResponse({ status: 200, description: 'Curso rechazado exitosamente' })
  rechazar(@Param('id') id: string) {
    return this.cursosService.rechazarCurso(+id);
  }

  @Patch(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar un curso aprobado' })
  @ApiResponse({ status: 200, description: 'Curso finalizado exitosamente' })
  finalizar(@Param('id') id: string) {
    return this.cursosService.finalizarCurso(+id);
  }

  @Post('cambiar-estatus')
  @ApiResponse({
    status: 200,
    description: 'Estados de cursos cambiados exitosamente',
  })
  cambiarEstatusCursos(
    @Body() cambiarEstatusCursosDto: CambiarEstatusCursosDto,
  ) {
    console.log('DTO recibido en controlador:', cambiarEstatusCursosDto);
    return this.cursosService.cambiarEstatusCursos(
      cambiarEstatusCursosDto.cursosIds,
      cambiarEstatusCursosDto.nuevoEstado,
    );
  }

  @Patch(':id/enviar')
  @ApiOperation({ summary: 'Enviar un curso para revisión' })
  @ApiResponse({ status: 200, description: 'Curso enviado exitosamente' })
  enviar(@Param('id') id: string) {
    return this.cursosService.enviarCurso(+id);
  }


  @Post('eliminar-multiples')
  @ApiBody({ type: EliminarMultiplesCursosDto })
  @ApiResponse({
    status: 200,
    description: 'Cursos eliminados exitosamente',
  })
  async eliminarMultiplesCursos(
    @Body() body: EliminarMultiplesCursosDto,
  ) {
    return this.cursosService.eliminarMultiplesCursos(body.cursosIds);
  }


}
