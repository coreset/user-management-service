import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    type: [String],
    description: 'Permission IDs to assign to the client role',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}
