import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    name: 'email',
    required: true,
    example: 'example@mail.com',
  })
  @IsEmail()
  email: string;
}
