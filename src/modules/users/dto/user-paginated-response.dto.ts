import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserPaginatedResponseDto {
  @ApiProperty({ type: [UserResponseDto], description: 'Array of users' })
  @Expose()
  @Type(() => UserResponseDto)
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
