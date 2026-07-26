import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRealmRoleDto {
  @ApiProperty({
    name: 'name',
    required: true,
    example: 'Admin',
  })
  @IsString()
  name: string;
}
