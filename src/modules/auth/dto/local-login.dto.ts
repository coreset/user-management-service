import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LocalLoginDto {
  @ApiProperty({
    name: 'email',
    required: true,
    example: 'example@mail.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
    required: true,
    example: '******',
  })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at lease on number' })
  password: string;
}
