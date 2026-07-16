import { IsInt, IsOptional, Min, Max, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Page number (1-indexed)',
  })
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Items per page (max 100)',
  })
  limit: number = 10;

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  @ApiPropertyOptional({
    enum: ['asc', 'desc', 'ASC', 'DESC'],
    default: 'DESC',
    description: 'Sort direction',
  })
  order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC';
}
