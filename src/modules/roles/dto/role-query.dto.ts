import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query params for GET /realms/:realmName/roles. */
export class RoleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'ADMIN',
    description: 'Search by role name (wildcard)',
  })
  search?: string;
}
