import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AssignUsersDto {
  @ApiProperty({
    description: 'Array of user IDs to assign to the role',
    name: 'userIdList',
    required: true,
    type: [Number], // Indicates an array of numbers
    example: [1, 2, 3],
  })
  @IsArray()
  userIdList: number[];
}
