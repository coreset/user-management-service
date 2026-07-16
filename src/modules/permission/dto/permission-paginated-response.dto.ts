import { Expose, Type } from 'class-transformer';
import { PermissionResponseDto } from './permission-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionPaginatedResponseDto {
  @ApiProperty({ type: [PermissionResponseDto], description: 'Array of permissions' })
  @Expose()
  @Type(() => PermissionResponseDto)
  data: PermissionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
