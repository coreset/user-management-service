import { Expose, Type } from 'class-transformer';
import { RealmResponseDto } from './realm-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RealmPaginatedResponseDto {
  @ApiProperty({ type: [RealmResponseDto], description: 'Array of realms' })
  @Expose()
  @Type(() => RealmResponseDto)
  data: RealmResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
