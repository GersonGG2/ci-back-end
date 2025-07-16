import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CursosService } from '../cursos/cursos.service';
import { CreateInscripcionDto } from './dto/create-inscripcione.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcione.dto';
import { Inscripcion } from './entities/inscripcione.entity';

@Injectable()
export class InscripcionesService {
  constructor(
    @InjectRepository(Inscripcion)
    private inscripcionesRepository: Repository<Inscripcion>,
    private cursosService: CursosService,
  ) {}

  async create(createInscripcionDto: CreateInscripcionDto, userId: number): Promise<Inscripcion> {
    // Verificar que el curso existe y está aprobado
    const curso = await this.cursosService.findOne(createInscripcionDto.cursoId);
    
    if (curso.estado !== 'aprobado') {
      throw new BadRequestException('Solo es posible inscribirse a cursos aprobados');
    }

    // Verificar si el usuario ya está inscrito en este curso
    const inscripcionExistente = await this.inscripcionesRepository.findOne({
      where: {
        cursoId: createInscripcionDto.cursoId,
        docenteId: userId,
      },
    });

    if (inscripcionExistente) {
      throw new ConflictException('Ya estás inscrito en este curso');
    }

    const inscripcion = this.inscripcionesRepository.create({
      ...createInscripcionDto,
      docenteId: userId,
      estado: createInscripcionDto.estado || 'inscrito',
    });

    return this.inscripcionesRepository.save(inscripcion);
  }

  async findAll(): Promise<Inscripcion[]> {
    return this.inscripcionesRepository.find({
      relations: ['curso', 'docente'],
    });
  }

  async findByCurso(cursoId: number): Promise<Inscripcion[]> {
    return this.inscripcionesRepository.find({
      where: { cursoId },
      relations: ['curso', 'docente'],
    });
  }

  async findByDocente(docenteId: number): Promise<Inscripcion[]> {
    return this.inscripcionesRepository.find({
      where: { docenteId },
      relations: ['curso', 'docente'],
    });
  }

  async findOne(id: number): Promise<Inscripcion> {
    const inscripcion = await this.inscripcionesRepository.findOne({
      where: { id },
      relations: ['curso', 'docente', 'asistencias', 'constancia'],
    });

    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }

    return inscripcion;
  }

  async update(id: number, updateInscripcionDto: UpdateInscripcionDto): Promise<Inscripcion> {
    const inscripcion = await this.findOne(id);
    
    // Si se está cambiando el curso, verificar que el nuevo curso exista y esté aprobado
    if (updateInscripcionDto.cursoId && updateInscripcionDto.cursoId !== inscripcion.cursoId) {
      const curso = await this.cursosService.findOne(updateInscripcionDto.cursoId);
      if (curso.estado !== 'aprobado') {
        throw new BadRequestException('Solo es posible inscribirse a cursos aprobados');
      }
    }
    
    this.inscripcionesRepository.merge(inscripcion, updateInscripcionDto);
    return this.inscripcionesRepository.save(inscripcion);
  }

  async remove(id: number): Promise<void> {
    const inscripcion = await this.findOne(id);
    await this.inscripcionesRepository.remove(inscripcion);
  }

  async aprobarInscripcion(id: number): Promise<Inscripcion> {
    const inscripcion = await this.findOne(id);
    
    if (inscripcion.estado !== 'inscrito') {
      throw new BadRequestException('Solo se pueden aprobar inscripciones en estado "inscrito"');
    }
    
    inscripcion.estado = 'aprobado';
    return this.inscripcionesRepository.save(inscripcion);
  }

  async reprobarInscripcion(id: number): Promise<Inscripcion> {
    const inscripcion = await this.findOne(id);
    
    if (inscripcion.estado !== 'inscrito') {
      throw new BadRequestException('Solo se pueden reprobar inscripciones en estado "inscrito"');
    }
    
    inscripcion.estado = 'reprobado';
    return this.inscripcionesRepository.save(inscripcion);
  }

  async cancelarInscripcion(id: number, userId: number): Promise<Inscripcion> {
    const inscripcion = await this.findOne(id);
    
    // Solo el propio docente puede cancelar su inscripción
    if (inscripcion.docenteId !== userId) {
      throw new BadRequestException('Solo puedes cancelar tus propias inscripciones');
    }
    
    if (inscripcion.estado !== 'inscrito') {
      throw new BadRequestException('Solo se pueden cancelar inscripciones en estado "inscrito"');
    }
    
    inscripcion.estado = 'cancelado';
    return this.inscripcionesRepository.save(inscripcion);
  }
}