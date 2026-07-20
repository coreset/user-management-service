import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query params for GET /realms/:realmName/clients. */
export class ClientQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'pawn-backend',
    description: 'Search by client name or client ID (wildcard)',
  })
  search?: string;
}
