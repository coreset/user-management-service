import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    name: 'old password',
    required: true,
    example: 'example@mail.com',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    name: 'new password',
    required: true,
    example: '******',
  })
  @IsString()
  newPassword: string;
}
