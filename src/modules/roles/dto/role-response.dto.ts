import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ description: 'UUID of the role' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Role name' })
  @Expose()
  name: string;
}
