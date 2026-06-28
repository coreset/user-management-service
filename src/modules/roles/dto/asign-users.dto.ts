import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AssignUsersDto {
  @ApiProperty({
    description: 'Array of user IDs to assign to the role',
    name: 'userIdList',
    required: true,
    type: [String], // Array of user UUIDs
    example: ['7c9e6679-7425-40de-944b-e07fc1f90ae7'],
  })
  @IsArray()
  userIdList: string[];
}
