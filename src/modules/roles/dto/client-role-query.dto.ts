import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query params for GET /realms/:realmName/clients/:clientId/roles. */
export class ClientRoleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Admin',
    description: 'Search by client role name (wildcard)',
  })
  search?: string;
}
