import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { PeriodosService } from '../periodos/periodos.service';
import { AcademiasService } from '../academias/academias.service';
import { PaginationService } from 'src/common/services/pagination.service';
import { CursoFilterDto } from './dto/curso-filter.dto';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private cursosRepository: Repository<Curso>,
    private periodosService: PeriodosService,
    private academiasService: AcademiasService,
    private paginationService: PaginationService,
  ) { }

  private readonly TRANSICIONES_PERMITIDAS = {
    nuevo: ['propuesto', 'rechazado'],
    propuesto: ['aprobado', 'rechazado', 'nuevo'],
    aprobado: ['finalizado'],
    rechazado: ['propuesto', 'nuevo'],
    finalizado: [],
  };

  async create(createCursoDto: CreateCursoDto, userId: number): Promise<Curso> {
    // Verificar que el periodo existe
    const periodo = await this.periodosService.findOne(
      createCursoDto.periodoId,
    );
    if (periodo.estado !== 'activo') {
      throw new BadRequestException(
        'Solo se pueden crear cursos en periodos activos',
      );
    }

    // Validar fechas del curso dentro del periodo
    const fechaInicioCurso = new Date(createCursoDto.fecha_inicio);
    const fechaFinCurso = new Date(createCursoDto.fecha_fin);
    const fechaInicioPeriodo = new Date(periodo.fecha_inicio);
    const fechaFinPeriodo = new Date(periodo.fecha_fin);

    if (
      fechaInicioCurso < fechaInicioPeriodo ||
      fechaFinCurso > fechaFinPeriodo
    ) {
      throw new BadRequestException(
        `Las fechas del curso deben estar dentro del periodo: ${periodo.fecha_inicio} a ${periodo.fecha_fin}`,
      );
    }

    // Verificar que la academia existe
    await this.academiasService.findOne(createCursoDto.academiaId);

    const curso = this.cursosRepository.create({
      ...createCursoDto,
      createdBy: userId,
    });

    return this.cursosRepository.save(curso);
  }

  async findAll(): Promise<Curso[]> {
    return this.cursosRepository.find({
      relations: ['periodo', 'academia', 'instructor','instructorDos', 'creador'],
    });
  }

  async findByPeriodo(periodoId: number): Promise<Curso[]> {
    return this.cursosRepository.find({
      where: { periodoId },
      relations: ['periodo', 'academia', 'instructor', 'creador'],
    });
  }

  async findByAcademia(academiaId: number): Promise<Curso[]> {
    return this.cursosRepository.find({
      where: { academiaId },
      relations: ['periodo', 'academia', 'instructor', 'creador'],
    });
  }

  async findOne(id: number): Promise<Curso> {
    const curso = await this.cursosRepository.findOne({
      where: { id },
      relations: ['periodo', 'academia', 'instructor', 'creador'],
    });

    if (!curso) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    return curso;
  }

  async update(
    id: number,
    updateCursoDto: UpdateCursoDto,
    userId: number,
  ): Promise<Curso> {
    const curso = await this.findOne(id);

    // Verificar permisos: solo el creador o un admin puede modificar
    // if (curso.createdBy !== userId) {
    //   throw new ForbiddenException('No tienes permisos para modificar este curso');
    // }

    if (updateCursoDto.periodoId) {
      const periodo = await this.periodosService.findOne(
        updateCursoDto.periodoId,
      );
      if (periodo.estado !== 'activo') {
        throw new BadRequestException(
          'Solo se pueden asignar cursos a periodos activos',
        );
      }
    }

    if (updateCursoDto.academiaId) {
      await this.academiasService.findOne(updateCursoDto.academiaId);
    }

    this.cursosRepository.merge(curso, updateCursoDto);
    return this.cursosRepository.save(curso);
  }

  async remove(id: number, userId: number): Promise<void> {
    const curso = await this.findOne(id);

    // Verificar permisos: solo el creador o un admin puede eliminar
    // if (curso.createdBy !== userId) {
    //   throw new ForbiddenException('No tienes permisos para eliminar este curso');
    // }

    await this.cursosRepository.remove(curso);
  }

  async aprobarCurso(id: number): Promise<Curso> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('ID de curso inválido');
    }
    const curso = await this.findOne(id);

    if (curso.estado !== 'propuesto') {
      throw new BadRequestException(
        'Solo se pueden aprobar cursos en estado propuesto',
      );
    }

    curso.estado = 'aprobado';
    return this.cursosRepository.save(curso);
  }

  async rechazarCurso(id: number): Promise<Curso> {
    const curso = await this.findOne(id);

    if (curso.estado !== 'propuesto') {
      throw new BadRequestException(
        'Solo se pueden rechazar cursos en estado propuesto',
      );
    }

    curso.estado = 'rechazado';
    return this.cursosRepository.save(curso);
  }

  async finalizarCurso(id: number): Promise<Curso> {
    const curso = await this.findOne(id);

    if (curso.estado !== 'aprobado') {
      throw new BadRequestException(
        'Solo se pueden finalizar cursos aprobados',
      );
    }

    curso.estado = 'finalizado';
    return this.cursosRepository.save(curso);
  }

  async cambiarEstadoCurso(id: number, nuevoEstado: string): Promise<Curso> {
    console.log(
      'cambiarEstadoCurso llamado con id:',
      id,
      'nuevoEstado:',
      nuevoEstado,
    );

    // Validación estricta del ID
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException(`ID de curso inválido: ${id}`);
    }

    try {
      // Buscar el curso directamente usando repository.findOneBy
      const curso = await this.cursosRepository.findOneBy({ id });

      if (!curso) {
        throw new NotFoundException(`Curso con ID ${id} no encontrado`);
      }

      if (!this.TRANSICIONES_PERMITIDAS[curso.estado]?.includes(nuevoEstado)) {
        throw new BadRequestException(
          `No se puede cambiar un curso de estado "${curso.estado}" a "${nuevoEstado}"`,
        );
      }

      // Cambiar estado y guardar
      curso.estado = nuevoEstado;
      return this.cursosRepository.save(curso);
    } catch (error) {
      // Mejorar mensaje de error si es de tipo QueryFailedError
      if (error.code) {
        console.error(
          'Error en SQL:',
          error.sql,
          'Parámetros:',
          error.parameters,
        );
        throw new InternalServerErrorException(
          'Error en consulta a base de datos',
        );
      }
      throw error;
    }
  }

  async findAllFiltered(filter: CursoFilterDto) {
    const qb = this.cursosRepository
      .createQueryBuilder('curso')
      .leftJoinAndSelect('curso.periodo', 'periodo')
      .leftJoinAndSelect('curso.academia', 'academia')
      .leftJoinAndSelect('curso.instructor', 'instructor')
      .leftJoinAndSelect('curso.instructorDos', 'instructorDos')
      .leftJoinAndSelect('curso.creador', 'creador');

    if (filter.periodoId) {
      qb.andWhere('curso.periodoId = :periodoId', {
        periodoId: filter.periodoId,
      });
    }
    if (filter.academiaId) {
      qb.andWhere('curso.academiaId = :academiaId', {
        academiaId: filter.academiaId,
      });
    }
    if (filter.searchValue) {
      qb.andWhere(
        '(curso.nombre LIKE :search OR curso.objetivo LIKE :search)',
        { search: `%${filter.searchValue}%` },
      );
    }
    let sortField = filter.sort || 'curso.id';
    if (sortField && !sortField.startsWith('curso.')) {
      sortField = `curso.${sortField}`;
    }

    if (filter.userId) {
      qb.andWhere('curso.createdBy = :userId', {
        userId: filter.userId,
      });
    }

    if (filter.estado) {
      qb.andWhere('curso.estado = :estado', {
        estado: filter.estado,
      });
    }

    if (filter.instructorId) {
      qb.andWhere('curso.instructorId = :instructorId', {
        instructorId: filter.instructorId,
      });
    }

    if (filter.tipo) {
      qb.andWhere('curso.tipo = :tipo', { tipo: filter.tipo });
    }

    // Convierte solo para TypeORM aquí
    qb.orderBy(
      sortField,
      filter.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
    );

    return this.paginationService.paginate<Curso>(
      qb,
      { ...filter, sort: sortField }, // No conviertas el order aquí
      ['curso.nombre', 'curso.objetivo'],
    );
  }

  async cambiarEstatusCursos(
    ids: number[],
    nuevoEstado: string,
  ): Promise<{
    exitosos: Curso[];
    fallidos: { id: number; razon: string }[];
  }> {
    const resultados: {
      exitosos: Curso[];
      fallidos: { id: number; razon: string }[];
    } = {
      exitosos: [],
      fallidos: [],
    };

    for (const id of ids) {
      // Validar ID antes de llamar a cambiarEstadoCurso
      if (!id || isNaN(id) || typeof id !== 'number' || id <= 0) {
        resultados.fallidos.push({
          id,
          razon: 'ID de curso inválido',
        });
        continue;
      }
      try {
        const curso = await this.cambiarEstadoCurso(id, nuevoEstado);
        resultados.exitosos.push(curso);
      } catch (error) {
        resultados.fallidos.push({
          id,
          razon: error.message || 'Error desconocido',
        });
      }
    }

    return resultados;
  }

  async findByCreador(
    userId: number,
    periodoId?: number,
    estado?: string,
  ): Promise<Curso[]> {
    // Validación extra
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new BadRequestException(`ID de usuario inválido: ${userId}`);
    }

    try {
      const where: any = { createdBy: userId };

      // Agregar filtro por periodo si se proporciona
      if (periodoId && !isNaN(periodoId)) {
        where.periodoId = periodoId;
      }

      // Filtro por estado si se proporciona
      if (estado) {
        where.estado = estado;
      }

      return this.cursosRepository.find({
        where,
        relations: ['periodo', 'academia', 'instructor', 'creador'],
      });
    } catch (error) {
      console.error('Error en findByCreador:', error);
      throw new InternalServerErrorException(
        'Error al consultar la base de datos',
      );
    }
  }

  async enviarCurso(id: number): Promise<Curso> {
    const curso = await this.findOne(id);

    if (curso.estado !== 'nuevo' && curso.estado !== 'rechazado') {
      throw new BadRequestException(
        'Solo se pueden enviar cursos en estado nuevo o rechazado',
      );
    }

    curso.estado = 'propuesto';
    return this.cursosRepository.save(curso);
  }

  async cambiarEstatusPorFiltro(
    filtro: { periodoId?: number; userId?: number; estadoActual?: string },
    nuevoEstado: string,
  ): Promise<{
    exitosos: Curso[];
    fallidos: { id: number; razon: string }[];
  }> {
    console.log('[Service] Filtro recibido:', filtro);

    const resultados: {
      exitosos: Curso[];
      fallidos: { id: number; razon: string }[];
    } = {
      exitosos: [],
      fallidos: [],
    };

    try {
      // Crear condición de búsqueda
      const where: any = {};
      if (filtro.periodoId) where.periodoId = filtro.periodoId;
      if (filtro.userId) where.createdBy = filtro.userId;
      if (filtro.estadoActual) where.estado = filtro.estadoActual;

      console.log('[Service] Condición de búsqueda:', where);

      // Buscar todos los cursos que coincidan
      const cursos = await this.cursosRepository.find({
        where,
        relations: ['periodo', 'academia', 'instructor', 'creador'],
      });

      console.log('[Service] Cursos encontrados:', cursos);

      if (cursos.length === 0) {
        console.warn(
          '[Service] No se encontraron cursos con los filtros dados.',
        );
        return resultados;
      }

      for (const curso of cursos) {
        console.log('[Service] Procesando curso:', {
          id: curso.id,
          nombre: curso.nombre,
          estado: curso.estado,
        });

        try {
          if (
            !this.TRANSICIONES_PERMITIDAS[curso.estado]?.includes(nuevoEstado)
          ) {
            resultados.fallidos.push({
              id: curso.id,
              razon: `No se puede cambiar un curso de estado "${curso.estado}" a "${nuevoEstado}"`,
            });
            continue;
          }

          curso.estado = nuevoEstado;
          const cursoActualizado = await this.cursosRepository.save(curso);
          resultados.exitosos.push(cursoActualizado);
        } catch (error) {
          console.error('[Service] Error al procesar curso:', error);
          resultados.fallidos.push({
            id: curso.id,
            razon: error.message || 'Error desconocido',
          });
        }
      }

      return resultados;
    } catch (error) {
      console.error('[Service] Error en cambiarEstatusPorFiltro:', error);
      throw new InternalServerErrorException(
        'Error al cambiar estado de cursos',
      );
    }
  }
}
