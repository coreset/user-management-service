import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetSettingDto {
  @ApiProperty({
    name: 'value',
    description: 'Setting value as a string; validated against the value_type',
    example: '3600',
  })
  @IsString()
  value: string;
}
