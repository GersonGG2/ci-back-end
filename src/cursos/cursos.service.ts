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
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as PdfPrinter from 'pdfmake';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private cursosRepository: Repository<Curso>,
    private periodosService: PeriodosService,
    private academiasService: AcademiasService,
    private paginationService: PaginationService,
    private usersService: UsersService,

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
      relations: ['periodo', 'academia', 'instructor', 'instructorDos', 'creador'],
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
    cursosIds: number[],
    nuevoEstado: string,
  ): Promise<{
    exitosos: Curso[];
    fallidos: { id: number; razon: string }[];
  }> {
    console.log('cursosIds recibido en servicio:', cursosIds);
    const resultados: {
      exitosos: Curso[];
      fallidos: { id: number; razon: string }[];
    } = {
      exitosos: [],
      fallidos: [],
    };

    // Convierte todos los IDs a número y filtra los inválidos
    const ids = (cursosIds ?? []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    console.log('IDs procesados:', ids);
    if (ids.length === 0) {
      throw new BadRequestException('No se recibieron IDs válidos de cursos');
    }

    for (const id of ids) {
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


  async eliminarMultiplesCursos(
    cursosIds: number[],
  ): Promise<{
    eliminados: number[];
    fallidos: { id: number; razon: string }[];
  }> {
    const resultados: {
      eliminados: number[];
      fallidos: { id: number; razon: string }[];
    } = {
      eliminados: [],
      fallidos: [],
    };

    // Estados permitidos para eliminar
    const estadosPermitidos = ['nuevo', 'propuesto', 'rechazado', 'finalizado'];

    // Validar y limpiar IDs
    const ids = (cursosIds ?? []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);

    if (ids.length === 0) {
      throw new BadRequestException('No se recibieron IDs válidos de cursos');
    }

    for (const id of ids) {
      try {
        const curso = await this.cursosRepository.findOneBy({ id });
        if (!curso) {
          resultados.fallidos.push({ id, razon: 'Curso no encontrado' });
          continue;
        }
        if (!estadosPermitidos.includes(curso.estado)) {
          resultados.fallidos.push({ id, razon: `No se puede eliminar un curso en estado "${curso.estado}"` });
          continue;
        }
        await this.cursosRepository.remove(curso);
        resultados.eliminados.push(id);
      } catch (error) {
        resultados.fallidos.push({ id, razon: error.message || 'Error desconocido' });
      }
    }

    return resultados;
  }


  async exportarCursosExcel(
    filtro: { periodoId?: number; estado?: string; academiaId?: number; searchValue?: string }
  ): Promise<Buffer> {

    // Usar QueryBuilder para traer relaciones necesarias
    const qb = this.cursosRepository
      .createQueryBuilder('curso')
      .leftJoinAndSelect('curso.periodo', 'periodo')
      .leftJoinAndSelect('curso.academia', 'academia')
      .leftJoinAndSelect('curso.instructor', 'instructor')
      .leftJoinAndSelect('curso.instructorDos', 'instructorDos');

    if (filtro.periodoId !== undefined && filtro.periodoId !== null) {
      qb.andWhere('curso.periodoId = :periodoId', { periodoId: Number(filtro.periodoId) });
    }

    if (filtro.academiaId !== undefined && filtro.academiaId !== null) {
      qb.andWhere('curso.academiaId = :academiaId', { academiaId: Number(filtro.academiaId) });
    }

    if (filtro.estado) {
      qb.andWhere('curso.estado = :estado', { estado: filtro.estado });
    }

    if (filtro.searchValue) {
      qb.andWhere('(curso.nombre LIKE :search OR curso.objetivo LIKE :search)', {
        search: `%${filtro.searchValue}%`,
      });
    }

    const cursos = await qb.getMany();
    return this.cursosToExcel(cursos);
  }

  // Método auxiliar para generar el Excel con estilo
  private async cursosToExcel(cursos: Curso[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cursos', {
      views: [{ state: 'frozen', ySplit: 1 }] // congelar encabezado
    });

    // Columnas: solo id principal + nombres en lugar de ids (ajustadas widths)
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nombre', key: 'nombre', width: 38 },
      { header: 'Competencias a desarrollar', key: 'objetivo', width: 65 },
      { header: 'Periodo', key: 'periodo', width: 30 },       // periodo.nombre
      { header: 'Academia', key: 'academia', width: 100 },     // academia.nombre
      { header: 'Instructor', key: 'instructorName', width: 30 },
      { header: 'Instructor Dos', key: 'instructorDosName', width: 30 },
      { header: 'Lugar', key: 'lugar', width: 70 },
      { header: 'Aula', key: 'aula', width: 12 },
      { header: 'Horas', key: 'horas', width: 8 },
      { header: 'Fecha Inicio', key: 'fecha_inicio', width: 15 },
      { header: 'Fecha Fin', key: 'fecha_fin', width: 15 },
      { header: 'Hora Inicio', key: 'hora_inicio', width: 12 },
      { header: 'Hora Fin', key: 'hora_fin', width: 12 },
      { header: 'Dirigido A', key: 'dirigido_a', width: 45 },
      { header: 'Observaciones', key: 'prerequisitos', width: 65 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Tipo', key: 'tipo', width: 10 },
    ];

    // Formato y espaciado general
    worksheet.properties.defaultRowHeight = 22;
    // Reemplazo de eachColumn por iteración segura sobre columns
    worksheet.columns.forEach((col) => {
      if (!col) return;
      col.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });

    worksheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });

    // Alineaciones específicas
    worksheet.getColumn('id').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getColumn('horas').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getColumn('fecha_inicio').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getColumn('fecha_fin').alignment = { vertical: 'middle', horizontal: 'center' };

    // Encabezado: estilo más bonito y espaciado
    const headerRow = worksheet.getRow(1);
    headerRow.height = 60;
    headerRow.font = { bold: true, size: 12, color: { argb: 'FF1F4E78' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAF4FB' },
      };
      cell.border = {
        top: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FFD0D7DE' } },
        left: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FFD0D7DE' } },
        bottom: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FFD0D7DE' } },
        right: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FFD0D7DE' } },
      };
      cell.font = { bold: true, size: 11, color: { argb: 'FF1F4E78' } };
    });

    // Agrega filas de datos
    cursos.forEach(curso => {
      const instructorName = curso.instructor
        ? `${curso.instructor.nombre ?? ''} ${curso.instructor.apellidos ?? ''}`.trim()
        : '';
      const instructorDosName = curso.instructorDos
        ? `${curso.instructorDos.nombre ?? ''} ${curso.instructorDos.apellidos ?? ''}`.trim()
        : '';
      const periodoNombre = curso.periodo ? (curso.periodo.nombre ?? '') : '';
      const academiaNombre = curso.academia ? (curso.academia.nombre ?? '') : '';

      const row = worksheet.addRow({
        id: curso.id,
        nombre: curso.nombre,
        objetivo: curso.objetivo,
        periodo: periodoNombre,
        academia: academiaNombre,
        instructorName,
        instructorDosName,
        lugar: curso.lugar,
        aula: curso.aula,
        horas: curso.horas,
        fecha_inicio: curso.fecha_inicio ? (curso.fecha_inicio instanceof Date ? curso.fecha_inicio.toISOString().split('T')[0] : curso.fecha_inicio) : '',
        fecha_fin: curso.fecha_fin ? (curso.fecha_fin instanceof Date ? curso.fecha_fin.toISOString().split('T')[0] : curso.fecha_fin) : '',
        hora_inicio: curso.hora_inicio,
        hora_fin: curso.hora_fin,
        dirigido_a: curso.dirigido_a,
        prerequisitos: curso.prerequisitos,
        estado: curso.estado,
        tipo: curso.tipo,
      });

      // Pequeño padding vertical por fila
      row.height = 60;
    });

    // Añadir un pequeño espacio visual (fila vacía) al final
    worksheet.addRow([]);
    // Líneas divisorias suaves en la fila 2 (debajo de encabezado)
    worksheet.getRow(2).eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FFE0E0E0' } },
      };
    });

    // Auto-ajustar ancho de columnas ligeramenete (si se quiere más ajuste se puede calcular)
    worksheet.columns.forEach((column) => {
      if (column && column.width && column.width < 15) {
        // deja tal cual
      }
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }



  async importarCursosExcel(bufferParam: Buffer | ArrayBufferLike | Uint8Array | BufferSource | unknown): Promise<{
    creados: Curso[];
    actualizados: Curso[];
    fallidos: { fila: number; razon: string }[];
  }> {
    const raw: unknown = bufferParam;
    const buffer: Buffer = Buffer.isBuffer(raw)
      ? (raw as Buffer)
      : Buffer.from(raw as ArrayBufferLike);

    const resultados: {
      creados: Curso[];
      actualizados: Curso[];
      fallidos: { fila: number; razon: string }[];
    } = { creados: [], actualizados: [], fallidos: [] };

    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new BadRequestException('Se requiere un Buffer válido con el archivo Excel');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    // Buscar hoja por nombre 'Cursos' o usar la primera
    const worksheet = workbook.getWorksheet('Cursos') || workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('No se encontró hoja de cálculo en el archivo');
    }

    // Mapear encabezados (fila 1)
    const headerRow = worksheet.getRow(1);
    const headers: Record<number, string> = {};
    headerRow.eachCell((cell, colNumber) => {
      const val = (cell.value ?? '').toString().trim();
      // Mapear por nombre de encabezado a claves usadas en export (coincidir con textos)
      if (val) headers[colNumber] = val;
    });

    // Helper para obtener valor normalizado de celda
    const getCellValue = (row: ExcelJS.Row, colNumber: number) => {
      const cell = row.getCell(colNumber);
      if (!cell) return '';
      const v = cell.value;
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') {
        // Date, RichText, Hyperlink, etc.
        if ((v as any).text) return (v as any).text;
        if (v instanceof Date) return v.toISOString().split('T')[0];
        if ((v as any).result) return (v as any).result; // formulas
        if (Array.isArray((v as any).richText)) return (v as any).richText.map((t: any) => t.text).join('');
        if ((v as any).hyperlink && (v as any).text) return (v as any).text;
        return String(v);
      }
      return String(v);
    };

    const parseDateSafe = (s: string): Date | undefined => {
      if (!s) return undefined;
      const d = new Date(s);
      return isNaN(d.getTime()) ? undefined : d;
    };

    // Recorre filas de datos (desde fila 2)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      // saltar filas vacías (row.values puede ser undefined y su índice 0 no es parte de los datos)
      const rawValues = (row.values ?? []) as any[];
      const dataValues = rawValues.slice(1); // ExcelJS usa índice 1..n
      const isEmpty = dataValues.length === 0 || dataValues.every((c: any) => c === null || c === undefined || (typeof c === 'string' && c.trim() === ''));
      if (isEmpty) continue;

      try {
        // Construir un mapa de valores por header clave
        const data: Record<string, string> = {};
        Object.entries(headers).forEach(([colStr, headerText]) => {
          const col = Number(colStr);
          // Normalizar headerText a las claves esperadas (basado en export)
          // Se espera encabezados en español exactos; se usa coincidencia simple
          const key = headerText
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          data[key] = getCellValue(row, col).toString().trim();
        });

        // Leer campos
        const idVal = data['id'] || '';
        const nombre = data['nombre'] || '';
        const objetivo = data['competencias_a_desarrollar'] || data['objetivo'] || '';
        const periodoCell = data['periodo'] || '';
        const academiaCell = data['academia'] || '';
        const instructorName = data['instructor'] || '';
        const instructorDosName = data['instructor_dos'] || '';
        const lugar = data['lugar'] || '';
        const aula = data['aula'] || '';
        const horas = Number(data['horas']) || 0;
        const fecha_inicio = data['fecha_inicio'] || '';
        const fecha_fin = data['fecha_fin'] || '';
        const hora_inicio = data['hora_inicio'] || '';
        const hora_fin = data['hora_fin'] || '';
        const dirigido_a = data['dirigido_a'] || '';
        const prerequisitos = data['observaciones'] || data['prerequisitos'] || '';
        const estado = data['estado'] || '';
        const tipo = data['tipo'] || '';

        let periodoId: number | undefined;
        let academiaId: number | undefined;

        // --- Resolver periodo por Id o por nombre (varias estrategias) ---
        if (periodoCell) {
          const n = Number(periodoCell);
          if (!isNaN(n) && n > 0) {
            periodoId = n;
          } else {
            const name = (periodoCell || '').toString().trim();
            let periodoAny: any = undefined;
            try {
              // intentos de métodos comunes en servicios
              periodoAny =
                (await (this.periodosService as any).findByNombre?.(name)) ??
                (await (this.periodosService as any).findByName?.(name)) ??
                (await (this.periodosService as any).findOneByNombre?.(name));
            } catch {
              periodoAny = undefined;
            }
            // si no existe un método específico, intentar obtener todos y buscar por nombre
            if (!periodoAny && (this.periodosService as any).findAll) {
              try {
                const all = await (this.periodosService as any).findAll();
                periodoAny = (all || []).find((p: any) => (p.nombre || '').toString().trim().toLowerCase() === name.toLowerCase());
              } catch {
                periodoAny = undefined;
              }
            }
            if (periodoAny && periodoAny.id) periodoId = Number(periodoAny.id);
          }
        }

        // --- Resolver academia por Id o por nombre (varias estrategias) ---
        if (academiaCell) {
          const n = Number(academiaCell);
          if (!isNaN(n) && n > 0) {
            academiaId = n;
          } else {
            const name = (academiaCell || '').toString().trim();
            let academiaAny: any = undefined;
            try {
              academiaAny =
                (await (this.academiasService as any).findByNombre?.(name)) ??
                (await (this.academiasService as any).findByName?.(name)) ??
                (await (this.academiasService as any).findOneByNombre?.(name));
            } catch {
              academiaAny = undefined;
            }
            if (!academiaAny && (this.academiasService as any).findAll) {
              try {
                const all = await (this.academiasService as any).findAll();
                academiaAny = (all || []).find((a: any) => (a.nombre || '').toString().trim().toLowerCase() === name.toLowerCase());
              } catch {
                academiaAny = undefined;
              }
            }
            if (academiaAny && academiaAny.id) academiaId = Number(academiaAny.id);
          }
        }
        // Intento simple para instructor(es) usando método auxiliar si existe
        let instructorId: number | undefined;
        let instructorDosId: number | undefined;

        // Helper para resolver nombre -> entidad usando varios servicios/métodos comunes
        const resolveByName = async (name: string, candidates: any[] = []): Promise<any | undefined> => {
          if (!name) return undefined;
          const wanted = name.toString().trim().toLowerCase();

          const tryService = async (svc: any) => {
            if (!svc) return undefined;
            // intentos por métodos públicos comunes
            const fnNames = ['findByNombre', 'findByName', 'findOneByNombre', 'findOne', 'findOneBy', 'findBy'];
            for (const fn of fnNames) {
              if (typeof svc[fn] === 'function') {
                try {
                  const res = await svc[fn](name);
                  if (res) return Array.isArray(res) ? res[0] : res;
                } catch { /* ignore */ }
              }
            }
            // si tiene findAll, normalizar y buscar coincidencias
            if (typeof svc.findAll === 'function') {
              try {
                const all = await svc.findAll();
                if (Array.isArray(all)) {
                  const found = (all || []).find((x: any) => {
                    const nombre = ((x.nombre ?? '') + '').toString().trim().toLowerCase();
                    const apellidos = ((x.apellidos ?? '') + '').toString().trim().toLowerCase();
                    const full = (nombre + (apellidos ? (' ' + apellidos) : '')).trim().toLowerCase();
                    // coincidencia exacta o contains (para cuando el excel trae solo parte del nombre)
                    return full === wanted || full.includes(wanted) || nombre === wanted || apellidos === wanted;
                  });
                  if (found) return found;
                }
              } catch { /* ignore */ }
            }
            return undefined;
          };

          // Probar candidatos pasados
          for (const svc of candidates) {
            const r = await tryService(svc);
            if (r) return r;
          }

          // Intentar con UsersService explícitamente (está inyectado)
          try {
            const r = await tryService(this.usersService);
            if (r) return r;
          } catch { /* noop */ }

          return undefined;
        };

        // Candidates: servicios opcionales (si existen en tu app) - UsersService inyectado se probará siempre
        const instructorCandidates = [
          (this as any).instructoresService,
          (this as any).personasService,
        ];

        if (instructorName) {
          const instResolved = await resolveByName(instructorName.toString().trim(), instructorCandidates);
          if (instResolved && instResolved.id != null) instructorId = Number(instResolved.id);
        }
        if (instructorDosName) {
          const inst2Resolved = await resolveByName(instructorDosName.toString().trim(), instructorCandidates);
          if (inst2Resolved && inst2Resolved.id != null) instructorDosId = Number(inst2Resolved.id);
        }
        // DTO-like object para crear/actualizar
        const cursoDto: Partial<Curso> & Record<string, any> = {
          nombre,
          objetivo,
          periodoId,
          academiaId,
          instructorId,
          instructorDosId,
          lugar,
          aula,
          horas,
          fecha_inicio: parseDateSafe(fecha_inicio),
          fecha_fin: parseDateSafe(fecha_fin),
          hora_inicio,
          hora_fin,
          dirigido_a,
          prerequisitos,
          estado,
          tipo,
        };

        if (idVal) {
          const idNum = Number(idVal);
          if (isNaN(idNum)) throw new Error(`ID inválido en fila ${rowNumber}`);
          const cursoExistente = await this.cursosRepository.findOneBy({ id: idNum });
          if (!cursoExistente) throw new Error(`Curso con ID ${idNum} no encontrado`);
          this.cursosRepository.merge(cursoExistente, cursoDto);
          const actualizado = (await this.cursosRepository.save(cursoExistente) as unknown) as Curso;
          resultados.actualizados.push(actualizado);
        } else {
          // Validaciones obligatorias para creación: periodo (resuelto por nombre o id)
          if (!periodoId) {
            resultados.fallidos.push({ fila: rowNumber, razon: 'Periodo no especificado o no encontrado' });
            continue;
          }
          // Validar que el periodo existe y (opcional) esté activo
          try {
            const periodoObj = await this.periodosService.findOne(periodoId);
            if (!periodoObj) {
              resultados.fallidos.push({ fila: rowNumber, razon: 'Periodo no encontrado' });
              continue;
            }
            if (periodoObj.estado && periodoObj.estado !== 'activo') {
              resultados.fallidos.push({ fila: rowNumber, razon: `Periodo "${periodoObj.nombre}" no está activo` });
              continue;
            }
          } catch (e) {
            resultados.fallidos.push({ fila: rowNumber, razon: `Error al validar periodo: ${(e as Error).message}` });
            continue;
          }

          // Validar academia si se resolvió
          if (academiaId) {
            try {
              await this.academiasService.findOne(academiaId);
            } catch (e) {
              resultados.fallidos.push({ fila: rowNumber, razon: `Academia no encontrada: ${academiaCell}` });
              continue;
            }
          }

          const nuevo = this.cursosRepository.create(cursoDto as any);
          const creado = (await this.cursosRepository.save(nuevo) as unknown) as Curso;
          resultados.creados.push(creado);
        }
      } catch (err) {
        resultados.fallidos.push({ fila: rowNumber, razon: (err as Error).message || 'Error desconocido' });
      }
    } // for filas

    return resultados;
  }

  // Exportar pdf
  async exportarCursosPDF(
    filtro: { periodoId?: number; estado?: string; academiaId?: number; searchValue?: string }
  ): Promise<Buffer> {

    const qb = this.cursosRepository
      .createQueryBuilder('curso')
      .leftJoinAndSelect('curso.periodo', 'periodo')
      .leftJoinAndSelect('curso.academia', 'academia')
      .leftJoinAndSelect('curso.instructor', 'instructor')
      .leftJoinAndSelect('curso.instructorDos', 'instructorDos')
      .orderBy('curso.id', 'ASC');

    const periodoId = filtro.periodoId != null ? Number(filtro.periodoId) : undefined;
    const academiaId = filtro.academiaId != null ? Number(filtro.academiaId) : undefined;

    if (periodoId !== undefined && !isNaN(periodoId)) {
      qb.andWhere('curso.periodoId = :periodoId', { periodoId });
    }
    if (academiaId !== undefined && !isNaN(academiaId)) {
      qb.andWhere('curso.academiaId = :academiaId', { academiaId });
    }
    if (filtro.estado) {
      qb.andWhere('curso.estado = :estado', { estado: filtro.estado });
    }
    if (filtro.searchValue) {
      qb.andWhere('(curso.nombre LIKE :search OR curso.objetivo LIKE :search OR instructor.nombre LIKE :search OR instructor.apellidos LIKE :search OR instructorDos.nombre LIKE :search OR instructorDos.apellidos LIKE :search)', {
        search: `%${filtro.searchValue}%`,
      });
    }

    const cursos = await qb.getMany();
    const periodoNombre = cursos[0]?.periodo?.nombre ?? 'PERIODO GENERAL';

    // --- 2. Preparar Datos para la Tabla ---
    const tableBody = cursos.map((curso, idx) => {
      const fechaInicioStr = curso.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString('es-MX') : '';
      const fechaFinStr = curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString('es-MX') : '';
      const periodoRealizacion = `Del ${fechaInicioStr} al ${fechaFinStr}\n${curso.hora_inicio || ''} a ${curso.hora_fin || ''} horas`;

      const lugarCompleto = `${curso.lugar || ''}\nAula: ${curso.aula || ''}`;

      let facilitadores = '';
      if (curso.instructor) {
        facilitadores = `${curso.instructor.nombre || ''} ${curso.instructor.apellidos || ''}`.trim();
      }
      if (curso.instructorDos) {
        const segundo = `${curso.instructorDos.nombre || ''} ${curso.instructorDos.apellidos || ''}`.trim();
        facilitadores = facilitadores
          ? `${facilitadores}, ${segundo}`
          : segundo;
      }

      return [
        { text: idx + 1, alignment: 'center' },
        { text: curso.nombre || '', alignment: 'left' },
        { text: curso.objetivo || '', alignment: 'left' },
        { text: periodoRealizacion, alignment: 'center' },
        { text: lugarCompleto, alignment: 'center' },
        { text: curso.horas?.toString() || '', alignment: 'center' },
        { text: facilitadores, alignment: 'left' },
        { text: curso.dirigido_a || '', alignment: 'left' },
        { text: curso.prerequisitos || '', alignment: 'left' },
      ];
    });

    // --- 3. Definir Fuentes ---
    const fonts = {
      Roboto: {
        normal: path.resolve(process.cwd(), 'src/fonts/Roboto-Regular.ttf'),
        bold: path.resolve(process.cwd(), 'src/fonts/Roboto-Medium.ttf'),
        italics: path.resolve(process.cwd(), 'src/fonts/Roboto-Italic.ttf'),
        bolditalics: path.resolve(process.cwd(), 'src/fonts/Roboto-MediumItalic.ttf'),
      }
    };
    const printer = new PdfPrinter(fonts);

    // --- 4. Definición del Documento PDF ---
    const docDefinition: any = {
      pageOrientation: 'landscape',
      pageMargins: [10, 120, 10, 20],
      header: function (currentPage, pageCount) {
        return {
          margin: [10, 10, 10, 0],
          columns: [
            {
              // Si tienes logo en base64, usa image:
              // image: 'logo',
              // width: 60,
              // Si no tienes logo, deja el texto:
              text: 'ITZ',
              style: 'headerLogo',
              width: 60,
              alignment: 'left',
              margin: [0, 10, 0, 0]
            },
            {
              width: '*',
              stack: [
                { text: 'PROGRAMA INSTITUCIONAL DE ACTUALIZACIÓN PROFESIONAL Y FORMACIÓN DOCENTE', style: 'headerTitle', alignment: 'center' },
                { text: 'INSTITUTO TECNOLÓGICO DE ZACATEPEC', style: 'headerTitle', alignment: 'center' },
                { text: `PERIODO ${periodoNombre.toUpperCase()}`, style: 'headerTitle', alignment: 'center', margin: [0, 5, 0, 0] }
              ],
              alignment: 'center'
            },
            {
              width: 'auto',
              alignment: 'right',
              style: 'headerInfo',
              table: {
                body: [
                  [
                    { text: 'VERSIÓN:', bold: true },
                    { text: '0', alignment: 'right' }
                  ],
                  /*    [
                       { text: 'REFERENCIA A LA NORMA ISO 9001:2015', colSpan: 2, alignment: 'left', margin: [0, 5, 0, 0] }, {}
                     ], */
                  [
                    { text: 'PÁGINA:', bold: true, margin: [0, 5, 0, 0] },
                    { text: `${currentPage} de ${pageCount}`, alignment: 'right' }
                  ]
                ]
              },
              layout: 'noBorders'
            }
          ]
        };
      },
      // No footer
      content: [
        {
          table: {
            headerRows: 1,
            widths: [35, 120, 120, 100, 100, 40, 100, 80, 80],
            body: [
              [
                { text: 'No.', style: 'tableHeader' },
                { text: 'Nombre evento', style: 'tableHeader' },
                { text: 'Competencia a desarrollar', style: 'tableHeader' },
                { text: 'Periodo', style: 'tableHeader' },
                { text: 'Lugar', style: 'tableHeader' },
                { text: 'Hrs', style: 'tableHeader' },
                { text: 'Facilitador(a)', style: 'tableHeader' },
                { text: 'Dirigido a', style: 'tableHeader' },
                { text: 'Observaciones', style: 'tableHeader' },
              ],
              ...tableBody,
            ],
          },
          layout: {
            hLineWidth: function (i, node) { return 0.5; },
            vLineWidth: function (i, node) { return 0.5; },
            hLineColor: function (i, node) { return 'gray'; },
            vLineColor: function (i, node) { return 'gray'; },
            paddingLeft: function (i, node) { return 2; },
            paddingRight: function (i, node) { return 2; },
            paddingTop: function (i, node) { return 8; },
            paddingBottom: function (i, node) { return 8; }
          }
        },
      ],
      styles: {
        headerLogo: {
          fontSize: 16,
          bold: true,
          color: '#4472C4',
          margin: [0, 5, 0, 0]
        },
        headerTitle: {
          fontSize: 10,
          bold: true,
          color: 'black',
          margin: [0, 0, 0, 2]
        },
        headerInfo: {
          fontSize: 8,
          color: 'gray'
        },
        tableHeader: {
          fillColor: '#D9E1F2',
          color: 'black',
          bold: true,
          fontSize: 7,
          alignment: 'center',
          margin: [0, 2, 0, 2]
        },
        tableCell: {
          fontSize: 7,
          margin: [1, 1, 1, 1]
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 7,
        alignment: 'left'
      },
      // Si tienes logo en base64, agrega aquí:
      // images: {
      //   logo: 'data:image/png;base64,...tu_base64_aqui...'
      // }
    };

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err) => reject(err));
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

}

