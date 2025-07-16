import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { PeriodosService } from '../periodos/periodos.service';
import { AcademiasService } from '../academias/academias.service';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private cursosRepository: Repository<Curso>,
    private periodosService: PeriodosService,
    private academiasService: AcademiasService,
  ) {}

  async create(createCursoDto: CreateCursoDto, userId: number): Promise<Curso> {
    // Verificar que el periodo existe
    const periodo = await this.periodosService.findOne(createCursoDto.periodoId);
    if (periodo.estado !== 'activo') {
      throw new BadRequestException('Solo se pueden crear cursos en periodos activos');
    }

    // Verificar que la academia existe
    await this.academiasService.findOne(createCursoDto.academiaId);

    const curso = this.cursosRepository.create({
      ...createCursoDto,
      createdBy: userId
    });
    
    return this.cursosRepository.save(curso);
  }

  async findAll(): Promise<Curso[]> {
    return this.cursosRepository.find({
      relations: ['periodo', 'academia', 'instructor', 'creador']
    });
  }

  async findByPeriodo(periodoId: number): Promise<Curso[]> {
    return this.cursosRepository.find({
      where: { periodoId },
      relations: ['periodo', 'academia', 'instructor', 'creador']
    });
  }

  async findByAcademia(academiaId: number): Promise<Curso[]> {
    return this.cursosRepository.find({
      where: { academiaId },
      relations: ['periodo', 'academia', 'instructor', 'creador']
    });
  }

  async findOne(id: number): Promise<Curso> {
    const curso = await this.cursosRepository.findOne({
      where: { id },
      relations: ['periodo', 'academia', 'instructor', 'creador']
    });
    
    if (!curso) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }
    
    return curso;
  }

  async update(id: number, updateCursoDto: UpdateCursoDto, userId: number): Promise<Curso> {
    const curso = await this.findOne(id);
    
    // Verificar permisos: solo el creador o un admin puede modificar
    if (curso.createdBy !== userId) {
      throw new ForbiddenException('No tienes permisos para modificar este curso');
    }
    
    if (updateCursoDto.periodoId) {
      const periodo = await this.periodosService.findOne(updateCursoDto.periodoId);
      if (periodo.estado !== 'activo') {
        throw new BadRequestException('Solo se pueden asignar cursos a periodos activos');
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
    if (curso.createdBy !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este curso');
    }
    
    await this.cursosRepository.remove(curso);
  }

  async aprobarCurso(id: number): Promise<Curso> {
    const curso = await this.findOne(id);
    
    if (curso.estado !== 'propuesto') {
      throw new BadRequestException('Solo se pueden aprobar cursos en estado propuesto');
    }
    
    curso.estado = 'aprobado';
    return this.cursosRepository.save(curso);
  }

  async rechazarCurso(id: number): Promise<Curso> {
    const curso = await this.findOne(id);
    
    if (curso.estado !== 'propuesto') {
      throw new BadRequestException('Solo se pueden rechazar cursos en estado propuesto');
    }
    
    curso.estado = 'rechazado';
    return this.cursosRepository.save(curso);
  }

  async finalizarCurso(id: number): Promise<Curso> {
    const curso = await this.findOne(id);
    
    if (curso.estado !== 'aprobado') {
      throw new BadRequestException('Solo se pueden finalizar cursos aprobados');
    }
    
    curso.estado = 'finalizado';
    return this.cursosRepository.save(curso);
  }
}