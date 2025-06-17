import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the Permission',
    required: true,
    example: 'READ',
  })
  @IsString()
  name: string;
}
