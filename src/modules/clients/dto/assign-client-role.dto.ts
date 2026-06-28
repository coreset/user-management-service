import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignClientRoleDto {
  @ApiProperty({ name: 'userId', required: true })
  @IsUUID()
  userId: string;

  @ApiProperty({ name: 'clientRoleId', required: true })
  @IsUUID()
  clientRoleId: string;
}
