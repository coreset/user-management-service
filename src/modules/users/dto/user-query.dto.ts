import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Filter by realm ID',
  })
  realmId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'master',
    description: 'Filter by realm name (alternative to realmId)',
  })
  realmName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by username, email, first name, or last name',
  })
  search?: string;
}
