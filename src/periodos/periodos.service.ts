import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Periodo } from './entities/periodo.entity';
import { CreatePeriodoDto } from './dto/create-periodo.dto';
import { UpdatePeriodoDto } from './dto/update-periodo.dto';

@Injectable()
export class PeriodosService {
  constructor(
    @InjectRepository(Periodo)
    private periodosRepository: Repository<Periodo>,
  ) {}

  async create(createPeriodoDto: CreatePeriodoDto, usuarioId: number): Promise<Periodo> {
    const periodo = this.periodosRepository.create({
      ...createPeriodoDto,
      usuarioId
    });
    
    return this.periodosRepository.save(periodo);
  }

  async findAll(): Promise<Periodo[]> {
    return this.periodosRepository.find({
      relations: ['usuario']
    });
  }

  async findOne(id: number): Promise<Periodo> {
    const periodo = await this.periodosRepository.findOne({ 
      where: { id },
      relations: ['usuario']
    });
    
    if (!periodo) {
      throw new NotFoundException(`Periodo con ID ${id} no encontrado`);
    }
    
    return periodo;
  }

  async update(id: number, updatePeriodoDto: UpdatePeriodoDto): Promise<Periodo> {
    const periodo = await this.findOne(id);
    
    this.periodosRepository.merge(periodo, updatePeriodoDto);
    return this.periodosRepository.save(periodo);
  }

  async remove(id: number): Promise<void> {
    const periodo = await this.findOne(id);
    await this.periodosRepository.remove(periodo);
  }

  async activarPeriodo(id: number): Promise<Periodo> {
    const periodo = await this.findOne(id);
    
    // Primero desactivamos todos los periodos
    await this.periodosRepository.update({}, { estado: 'inactivo' });
    
    // Luego activamos el periodo solicitado
    periodo.estado = 'activo';
    return this.periodosRepository.save(periodo);
  }

  async cerrarPeriodo(id: number): Promise<Periodo> {
    const periodo = await this.findOne(id);
    periodo.estado = 'cerrado';
    return this.periodosRepository.save(periodo);
  }
}