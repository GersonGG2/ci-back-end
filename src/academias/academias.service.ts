import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Academia } from './entities/academia.entity';
import { CreateAcademiaDto } from './dto/create-academia.dto';
import { UpdateAcademiaDto } from './dto/update-academia.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationResult } from 'src/common/interfaces/pagination-result.interface';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class AcademiasService {
  constructor(
    @InjectRepository(Academia)
    private academiasRepository: Repository<Academia>,
     private paginationService: PaginationService,
  ) {}

  async create(createAcademiaDto: CreateAcademiaDto): Promise<Academia> {
    const academia = this.academiasRepository.create(createAcademiaDto);
    return this.academiasRepository.save(academia);
  }

  async findAll(): Promise<Academia[]> {
    return this.academiasRepository.find({
      order: {
        nombre: 'ASC'
      }
    });
  }
 async findAllPaginated(paginationQuery: PaginationQueryDto): Promise<PaginationResult<Academia>> {
    const queryBuilder = this.academiasRepository.createQueryBuilder('academia');
    
    return this.paginationService.paginate<Academia>(
      queryBuilder,
      paginationQuery,
      ['academia.nombre', 'academia.descripcion'] // columnas para búsqueda
    );
  }
  
  async findOne(id: number): Promise<Academia> {
    const academia = await this.academiasRepository.findOne({
      where: { id },
      relations: ['cursos']
    });
    
    if (!academia) {
      throw new NotFoundException(`Academia con ID ${id} no encontrada`);
    }
    
    return academia;
  }

  async update(id: number, updateAcademiaDto: UpdateAcademiaDto): Promise<Academia> {
    const academia = await this.findOne(id);
    
    this.academiasRepository.merge(academia, updateAcademiaDto);
    return this.academiasRepository.save(academia);
  }

  async remove(id: number): Promise<void> {
    const academia = await this.findOne(id);
    await this.academiasRepository.remove(academia);
  }
}