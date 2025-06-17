import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Array of roles IDs to assign to the role',
    name: 'roleIdList',
    required: true,
    type: [Number], // Indicates an array of numbers
    example: [1, 2, 3],
  })
  @IsArray()
  roleIdList: number[];
}
