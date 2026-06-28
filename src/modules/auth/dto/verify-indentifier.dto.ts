import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyIdentifierDto {
  @ApiProperty({
    name: 'token',
    required: true,
    example: '1234!@#$',
  })
  @IsString()
  token: string; // token or code

  @ApiProperty({
    name: 'user',
    required: true,
    description: 'User id (uuid) or email',
    example: 'user@example.com',
  })
  @IsString()
  user: string; // user id (uuid) or email
}
