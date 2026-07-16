import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty({ description: 'Setting key' })
  @Expose()
  key: string;

  @ApiProperty({ description: 'Setting value (masked if encrypted)' })
  @Expose()
  value: string | null;

  @ApiProperty({ description: 'Whether this is a custom override' })
  @Expose()
  isOverridden: boolean;

  @ApiProperty({ description: 'Value type (string, number, boolean, etc)' })
  @Expose()
  valueType: string;

  @ApiProperty({ description: 'Whether the value is encrypted' })
  @Expose()
  isEncrypted: boolean;

  @ApiProperty({ description: 'Setting description' })
  @Expose()
  description: string | null;
}
