import { Expose, Type } from 'class-transformer';
import { ClientResponseDto } from './client-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ClientPaginatedResponseDto {
  @ApiProperty({ type: [ClientResponseDto], description: 'Array of clients' })
  @Expose()
  @Type(() => ClientResponseDto)
  data: ClientResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
