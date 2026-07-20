import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
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

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value === 'true' : value))
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  isActive?: boolean;
}
