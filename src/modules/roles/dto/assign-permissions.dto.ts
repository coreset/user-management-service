import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    name: 'permissionIds',
    type: [String],
    description: 'Permission IDs to assign',
    required: true,
    example: ['7c9e6679-7425-40de-944b-e07fc1f90ae7'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds!: string[];
}
