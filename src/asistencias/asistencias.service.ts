import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Asistencia } from './entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { InscripcionesService } from '../inscripciones/inscripciones.service';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciasRepository: Repository<Asistencia>,
    private inscripcionesService: InscripcionesService,
  ) { }

  async create(createAsistenciaDto: CreateAsistenciaDto): Promise<Asistencia> {
    // Verificar que la inscripción existe
    await this.inscripcionesService.findOne(createAsistenciaDto.inscripcionId);

    // Verificar si ya existe una asistencia para esa inscripción y fecha
    const existingAsistencia = await this.asistenciasRepository.findOne({
      where: {
        inscripcionId: createAsistenciaDto.inscripcionId,
        fecha: new Date(createAsistenciaDto.fecha),
      },
    });

    if (existingAsistencia) {
      throw new BadRequestException('Ya existe un registro de asistencia para esta inscripción y fecha');
    }

    const asistencia = this.asistenciasRepository.create({
      ...createAsistenciaDto,
      fecha: new Date(createAsistenciaDto.fecha),
    });

    return this.asistenciasRepository.save(asistencia);
  }

  async findAll(): Promise<Asistencia[]> {
    return this.asistenciasRepository.find({
      relations: ['inscripcion', 'inscripcion.docente', 'inscripcion.curso'],
    });
  }

  async findByInscripcion(inscripcionId: number): Promise<Asistencia[]> {
    return this.asistenciasRepository.find({
      where: { inscripcionId },
      relations: ['inscripcion'],
      order: { fecha: 'ASC' },
    });
  }

  async findByCurso(cursoId: number): Promise<Asistencia[]> {
    return this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .innerJoinAndSelect('asistencia.inscripcion', 'inscripcion')
      .innerJoinAndSelect('inscripcion.curso', 'curso')
      .innerJoinAndSelect('inscripcion.docente', 'docente')
      .where('curso.id = :cursoId', { cursoId })
      .orderBy('asistencia.fecha', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Asistencia> {
    const asistencia = await this.asistenciasRepository.findOne({
      where: { id },
      relations: ['inscripcion', 'inscripcion.docente', 'inscripcion.curso'],
    });

    if (!asistencia) {
      throw new NotFoundException(`Asistencia con ID ${id} no encontrada`);
    }

    return asistencia;
  }

  async update(id: number, updateAsistenciaDto: UpdateAsistenciaDto): Promise<Asistencia> {
    const asistencia = await this.findOne(id);

    // Si se está cambiando la inscripción, verificar que existe
    if (updateAsistenciaDto.inscripcionId && updateAsistenciaDto.inscripcionId !== asistencia.inscripcionId) {
      await this.inscripcionesService.findOne(updateAsistenciaDto.inscripcionId);
    }

    // Si se está cambiando la fecha, verificar que no existe otra asistencia con esa fecha para la misma inscripción
    if (updateAsistenciaDto.fecha && updateAsistenciaDto.fecha !== asistencia.fecha.toISOString().split('T')[0]) {
      const inscripcionId = updateAsistenciaDto.inscripcionId || asistencia.inscripcionId;
      const existingAsistencia = await this.asistenciasRepository.findOne({
        where: {
          inscripcionId,
          fecha: new Date(updateAsistenciaDto.fecha),
          id: Not(id),
        },
      });

      if (existingAsistencia) {
        throw new BadRequestException('Ya existe un registro de asistencia para esta inscripción y fecha');
      }
    }

    this.asistenciasRepository.merge(asistencia, {
      ...updateAsistenciaDto,
      fecha: updateAsistenciaDto.fecha ? new Date(updateAsistenciaDto.fecha) : asistencia.fecha,
    });

    return this.asistenciasRepository.save(asistencia);
  }

  async remove(id: number): Promise<void> {
    const asistencia = await this.findOne(id);
    await this.asistenciasRepository.remove(asistencia);
  }

  async registrarAsistencia(inscripcionId: number, fecha: string, asistio: boolean): Promise<Asistencia> {
    // Verificar que la inscripción existe
    await this.inscripcionesService.findOne(inscripcionId);

    // Buscar si ya existe un registro para esa inscripción y fecha
    const existingAsistencia = await this.asistenciasRepository.findOne({
      where: {
        inscripcionId,
        fecha: new Date(fecha),
      },
    });

    if (existingAsistencia) {
      // Actualizar el registro existente
      existingAsistencia.asistio = asistio;
      return this.asistenciasRepository.save(existingAsistencia);
    } else {
      // Crear un nuevo registro
      return this.create({ inscripcionId, fecha, asistio });
    }
  }
}