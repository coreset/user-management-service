import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Current page number' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Items per page' })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  @Expose()
  totalPages: number;
}
