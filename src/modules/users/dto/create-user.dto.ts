import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    name: 'firstName',
    required: true,
    example: 'FirstName',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    name: 'lastName',
    required: true,
    example: 'LastName',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    name: 'email',
    required: true,
    example: 'example@mail.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'avatarUrl',
    required: false,
    example: 'https://avatar.com',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({
    name: 'password',
    required: true,
    example: '*******',
  })
  @IsString()
  password: string;
}
