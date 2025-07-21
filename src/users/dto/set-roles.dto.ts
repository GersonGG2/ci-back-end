import { ApiProperty } from '@nestjs/swagger';

export class SetRolesDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  roleIds: number[];
}