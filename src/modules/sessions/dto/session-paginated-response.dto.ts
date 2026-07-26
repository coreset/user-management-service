import { Expose, Type } from 'class-transformer';
import { SessionResponseDto } from './session-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SessionPaginatedResponseDto {
  @ApiProperty({ type: [SessionResponseDto], description: 'Array of sessions' })
  @Expose()
  @Type(() => SessionResponseDto)
  data: SessionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
