import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Academia } from './entities/academia.entity';
import { CreateAcademiaDto } from './dto/create-academia.dto';
import { UpdateAcademiaDto } from './dto/update-academia.dto';

@Injectable()
export class AcademiasService {
  constructor(
    @InjectRepository(Academia)
    private academiasRepository: Repository<Academia>,
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