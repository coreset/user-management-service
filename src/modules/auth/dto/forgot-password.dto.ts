import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

enum NotifyType {
  URL = 'url',
  CODE = 'code',
}

export class ForgotPasswordDto {
  @ApiProperty({
    name: 'email',
    required: true,
    example: 'example@mail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'type',
    required: true,
    example: 'token or code',
  })
  @IsString()
  type: NotifyType;
}
