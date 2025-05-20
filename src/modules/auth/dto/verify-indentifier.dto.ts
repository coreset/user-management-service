import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifyIdentifierDto {
  @ApiProperty({
    name: 'token',
    required: true,
    example: '1234!@#$',
  })
  @IsString()
  token: string; // token or code

  @ApiProperty({
    name: 'userId',
    required: true,
    example: 1,
  })
  @ValidateIf((o) => typeof o.user === 'string')
  @IsString()
  @ValidateIf((o) => typeof o.user === 'number')
  @IsNumber()
  user: number | string;
}
