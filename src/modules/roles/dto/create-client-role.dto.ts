import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateClientRoleDto {
  @ApiProperty({ name: 'name', required: true, example: 'pawn-admin' })
  @IsString()
  name: string;

  @ApiProperty({ name: 'description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
