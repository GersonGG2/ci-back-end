import { PartialType } from '@nestjs/swagger';
import { CreateConstanciaDto } from './create-constancia.dto';

export class UpdateConstanciaDto extends PartialType(CreateConstanciaDto) {}