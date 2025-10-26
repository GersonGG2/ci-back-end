import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class EliminarMultiplesCursosDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  cursosIds: number[];
}