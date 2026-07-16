import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserAttributeResponseDto {
  @ApiProperty({ description: 'Attribute key' })
  @Expose()
  key: string;

  @ApiProperty({ description: 'Attribute value (masked if encrypted)' })
  @Expose()
  value: string | null;

  @ApiProperty({ description: 'Whether the attribute is set for this user' })
  @Expose()
  isSet: boolean;

  @ApiProperty({ description: 'Value type (string, number, boolean, etc)' })
  @Expose()
  valueType: string;

  @ApiProperty({ description: 'Whether this attribute is required' })
  @Expose()
  isRequired: boolean;

  @ApiProperty({ description: 'Whether the value is encrypted' })
  @Expose()
  isEncrypted: boolean;

  @ApiProperty({ description: 'Attribute description' })
  @Expose()
  description: string | null;
}
