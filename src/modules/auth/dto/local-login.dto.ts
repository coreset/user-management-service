import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Login body. The realm is taken from the URL path (`/auth/:realmName/login`),
 * NOT from the body — the same username can exist in multiple realms.
 */
export class LocalLoginDto {
  @ApiProperty({
    name: 'username',
    required: true,
    example: 'jdoe',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    name: 'password',
    required: true,
    example: '******',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
