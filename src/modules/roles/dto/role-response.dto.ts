import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ description: 'UUID of the role' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name of the realm the role belongs to' })
  @Expose()
  @Transform(({ obj }) => obj.realm?.realmName, { toClassOnly: true })
  realmName: string;

  @ApiProperty({ description: 'Role name' })
  @Expose()
  name: string;
}
