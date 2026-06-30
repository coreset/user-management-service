import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    name: 'oldPassword',
    required: true,
    example: 'example@mail.com',
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    name: 'newPassword',
    required: true,
    example: '******',
  })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at lease on number' })
  newPassword!: string;
}
