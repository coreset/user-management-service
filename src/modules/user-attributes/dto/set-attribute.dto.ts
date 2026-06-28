import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetAttributeDto {
  @ApiProperty({
    name: 'value',
    description: 'Attribute value as a string; validated against the value_type',
    example: 'Engineering',
  })
  @IsString()
  value: string;
}
