import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Periodo } from './entities/periodo.entity';
import { CreatePeriodoDto } from './dto/create-periodo.dto';
import { UpdatePeriodoDto } from './dto/update-periodo.dto';
import { PeriodoFilterDto } from './dto/periodo-filter.dto';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class PeriodosService {
  constructor(
    @InjectRepository(Periodo)
    private periodosRepository: Repository<Periodo>,
    private paginationService: PaginationService,
  ) { }

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
    periodo.estado = 'activo';
    return this.periodosRepository.save(periodo);
  }

  async cerrarPeriodo(id: number): Promise<Periodo> {
    const periodo = await this.findOne(id);
    periodo.estado = 'cerrado';
    return this.periodosRepository.save(periodo);
  }

    async findAllFiltered(filtro: PeriodoFilterDto) {
    const qb = this.periodosRepository.createQueryBuilder('periodo').leftJoinAndSelect('periodo.usuario', 'usuario');
  
    if (filtro.estado) {
      qb.andWhere('periodo.estado = :estado', { estado: filtro.estado });
    }
    if (filtro.fecha_inicio_desde) {
      qb.andWhere('periodo.fecha_inicio >= :desde', { desde: filtro.fecha_inicio_desde });
    }
    if (filtro.fecha_inicio_hasta) {
      qb.andWhere('periodo.fecha_inicio <= :hasta', { hasta: filtro.fecha_inicio_hasta });
    }
  
    return this.paginationService.paginate<Periodo>(
      qb,
      filtro,
      ['periodo.nombre']
    );
  }
}