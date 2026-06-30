import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class LocalLoginDto {
  @ApiProperty({
    name: 'username',
    required: true,
    example: 'jdoe',
  })
  @IsString()
  username!: string;

  @ApiProperty({
    name: 'realmId',
    required: true,
    example: '7aed8708-8b30-4d0b-a80a-a1f516088078',
    description:
      'Realm the user belongs to. Required because the same username/email can exist in different realms.',
  })
  @IsString()
  @IsUUID()
  realmId!: string;

  @ApiProperty({
    name: 'password',
    required: true,
    example: '******',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
