import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ description: 'UUID of the permission' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Permission name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Name of the realm the permission belongs to' })
  @Expose()
  @Transform(({ obj }) => obj.realm?.realmName, { toClassOnly: true })
  realmName: string;

  @ApiProperty({ description: 'Whether this is a built-in system permission (cannot be renamed or deleted)' })
  @Expose()
  isSystem: boolean;

  @ApiProperty({ description: "Category derived from the name's `resource:action` prefix (or 'general' if absent)" })
  @Expose()
  @Transform(({ obj }) => {
    const name: string = obj.name ?? '';
    const i = name.indexOf(':');
    return i > -1 ? name.slice(0, i) : 'general';
  }, { toClassOnly: true })
  category: string;
}
