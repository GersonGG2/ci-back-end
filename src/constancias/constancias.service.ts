import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Constancia } from './entities/constancia.entity';
import { CreateConstanciaDto } from './dto/create-constancia.dto';
import { UpdateConstanciaDto } from './dto/update-constancia.dto';
import { InscripcionesService } from '../inscripciones/inscripciones.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class ConstanciasService {
  constructor(
    @InjectRepository(Constancia)
    private constanciasRepository: Repository<Constancia>,
    private inscripcionesService: InscripcionesService,
  ) {}

  async create(createConstanciaDto: CreateConstanciaDto): Promise<Constancia> {
    // Verificar que la inscripción existe y está aprobada
    const inscripcion = await this.inscripcionesService.findOne(createConstanciaDto.inscripcionId);
    
    if (inscripcion.estado !== 'aprobado') {
      throw new BadRequestException('Solo se pueden generar constancias para inscripciones aprobadas');
    }
    
    // Verificar si ya existe una constancia para esta inscripción
    const existingConstancia = await this.constanciasRepository.findOne({
      where: { inscripcionId: createConstanciaDto.inscripcionId },
    });
    
    if (existingConstancia) {
      throw new BadRequestException('Ya existe una constancia para esta inscripción');
    }
    
    // Generar folio si no se proporciona
    const folio = createConstanciaDto.folio || await this.generarFolio();
    
    // Crear constancia
    const constancia = this.constanciasRepository.create({
      inscripcionId: createConstanciaDto.inscripcionId,
      folio,
    });
    
    // Guardar constancia en base de datos
    const savedConstancia = await this.constanciasRepository.save(constancia);
    
    // Generar PDF (se implementará después)
    const rutaPdf = await this.generarPDF(savedConstancia);
    
    // Actualizar la ruta del PDF
    savedConstancia.rutaPdf = rutaPdf;
    return this.constanciasRepository.save(savedConstancia);
  }

  async findAll(): Promise<Constancia[]> {
    return this.constanciasRepository.find({
      relations: ['inscripcion', 'inscripcion.docente', 'inscripcion.curso'],
    });
  }

  async findByDocente(docenteId: number): Promise<Constancia[]> {
    return this.constanciasRepository
      .createQueryBuilder('constancia')
      .innerJoinAndSelect('constancia.inscripcion', 'inscripcion')
      .innerJoinAndSelect('inscripcion.docente', 'docente')
      .innerJoinAndSelect('inscripcion.curso', 'curso')
      .where('docente.id = :docenteId', { docenteId })
      .getMany();
  }

  async findByCurso(cursoId: number): Promise<Constancia[]> {
    return this.constanciasRepository
      .createQueryBuilder('constancia')
      .innerJoinAndSelect('constancia.inscripcion', 'inscripcion')
      .innerJoinAndSelect('inscripcion.docente', 'docente')
      .innerJoinAndSelect('inscripcion.curso', 'curso')
      .where('curso.id = :cursoId', { cursoId })
      .getMany();
  }

  async findOne(id: number): Promise<Constancia> {
    const constancia = await this.constanciasRepository.findOne({
      where: { id },
      relations: ['inscripcion', 'inscripcion.docente', 'inscripcion.curso'],
    });
    
    if (!constancia) {
      throw new NotFoundException(`Constancia con ID ${id} no encontrada`);
    }
    
    return constancia;
  }

  async findByFolio(folio: string): Promise<Constancia> {
    const constancia = await this.constanciasRepository.findOne({
      where: { folio },
      relations: ['inscripcion', 'inscripcion.docente', 'inscripcion.curso'],
    });
    
    if (!constancia) {
      throw new NotFoundException(`Constancia con folio ${folio} no encontrada`);
    }
    
    return constancia;
  }

  async update(id: number, updateConstanciaDto: UpdateConstanciaDto): Promise<Constancia> {
    const constancia = await this.findOne(id);
    
    // Si se está cambiando la inscripción, verificar que existe y está aprobada
    if (updateConstanciaDto.inscripcionId && updateConstanciaDto.inscripcionId !== constancia.inscripcionId) {
      const inscripcion = await this.inscripcionesService.findOne(updateConstanciaDto.inscripcionId);
      
      if (inscripcion.estado !== 'aprobado') {
        throw new BadRequestException('Solo se pueden generar constancias para inscripciones aprobadas');
      }
    }
    
    this.constanciasRepository.merge(constancia, updateConstanciaDto);
    const updatedConstancia = await this.constanciasRepository.save(constancia);
    
    // Regenerar PDF si cambió la inscripción
    if (updateConstanciaDto.inscripcionId && updateConstanciaDto.inscripcionId !== constancia.inscripcionId) {
      updatedConstancia.rutaPdf = await this.generarPDF(updatedConstancia);
      return this.constanciasRepository.save(updatedConstancia);
    }
    
    return updatedConstancia;
  }

  async remove(id: number): Promise<void> {
    const constancia = await this.findOne(id);
    
    // Eliminar el archivo PDF si existe
    if (constancia.rutaPdf && fs.existsSync(constancia.rutaPdf)) {
      fs.unlinkSync(constancia.rutaPdf);
    }
    
    await this.constanciasRepository.remove(constancia);
  }

  async regenerarPDF(id: number): Promise<Constancia> {
    const constancia = await this.findOne(id);
    
    // Eliminar el PDF existente si existe
    if (constancia.rutaPdf && fs.existsSync(constancia.rutaPdf)) {
      fs.unlinkSync(constancia.rutaPdf);
    }
    
    // Generar nuevo PDF
    constancia.rutaPdf = await this.generarPDF(constancia);
    
    return this.constanciasRepository.save(constancia);
  }

  private async generarFolio(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Obtener el último folio
    const ultimaConstancia = await this.constanciasRepository.findOne({
      order: { id: 'DESC' },
    });
    
    let numeroSecuencial = 1;
    
    if (ultimaConstancia) {
      const match = ultimaConstancia.folio.match(/(\d+)$/);
      if (match) {
        numeroSecuencial = parseInt(match[1], 10) + 1;
      }
    }
    
    // Formato: ITZ-CURSO-YYYY-MM-XXXX (donde XXXX es un número secuencial)
    return `ITZ-CURSO-${year}-${month}-${numeroSecuencial.toString().padStart(4, '0')}`;
  }

  private async generarPDF(constancia: Constancia): Promise<string> {
    // Crear directorio si no existe
    const directorioConstancias = path.join(process.cwd(), 'uploads', 'constancias');
    
    if (!fs.existsSync(directorioConstancias)) {
      await mkdirAsync(directorioConstancias, { recursive: true });
    }
    
    // Generar nombre de archivo
    const nombreArchivo = `constancia_${constancia.folio.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const rutaArchivo = path.join(directorioConstancias, nombreArchivo);
    
    // TODO: Implementar la generación real del PDF usando una biblioteca como PDFKit
    // Por ahora, creamos un archivo de texto como placeholder
    await writeFileAsync(rutaArchivo, `Constancia con folio: ${constancia.folio}`);
    
    return rutaArchivo;
  }
}