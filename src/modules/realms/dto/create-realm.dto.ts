import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateRealmDto {
  @ApiProperty({
    name: 'realmName',
    required: true,
    example: 'pawn',
  })
  @IsString()
  realmName: string;

  @ApiProperty({
    name: 'displayName',
    required: false,
    example: 'Pawn Shop',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    name: 'isActive',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
