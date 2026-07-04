import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    name: 'permissionIdList',
    required: true,
    type: [String], // Array of permission UUIDs
    example: ['7c9e6679-7425-40de-944b-e07fc1f90ae7'],
  })
  @IsArray()
  permissionIdList: string[];
}
