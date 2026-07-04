import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Query params for GET /roles — optional `name` filters, otherwise lists all. */
export class RoleQueryDto {
  @ApiProperty({
    name: 'name',
    required: false,
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    name: 'page',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    name: 'limit',
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
