import { Expose, Type } from 'class-transformer';
import { RoleResponseDto } from './role-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RolePaginatedResponseDto {
  @ApiProperty({ type: [RoleResponseDto], description: 'Array of roles' })
  @Expose()
  @Type(() => RoleResponseDto)
  data: RoleResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
