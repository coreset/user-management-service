import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ description: 'UUID of the permission' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Permission name' })
  @Expose()
  name: string;
}
