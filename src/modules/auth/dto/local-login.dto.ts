import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

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
  password: string;
}
