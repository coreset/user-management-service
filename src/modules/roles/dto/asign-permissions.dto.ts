import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    name: 'permissionIdList',
    required: true,
    type: [Number], // Indicates an array of numbers
    example: [1, 2, 3],
  })
  @IsArray()
  permissionIdList: number[];
}
