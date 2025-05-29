import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PaginateRoleDto {
  @ApiProperty({
    name: 'page',
    required: true,
    example: 0,
  })
  @Type(() => Number)
  @IsNumber()
  page: number;

  @ApiProperty({
    name: 'limit',
    required: true,
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  limit: number;
}
