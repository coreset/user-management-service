import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateForgotPasswordTokenDto {
  @ApiProperty({
    name: 'token',
    required: true,
    example: '1234!@#$',
  })
  @IsString()
  token: string;

  @ApiProperty({
    name: 'userId',
    required: true,
    example: 1,
  })
  @Type(()=> Number)
  @IsNumber()
  userId: number;
}
