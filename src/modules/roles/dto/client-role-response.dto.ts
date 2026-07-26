import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Shape returned by GET /users/:userId/client-roles. */
export class ClientRoleResponseDto {
  @ApiProperty({ description: 'UUID of the client role' })
  @Expose() id: string;

  @ApiProperty({ description: 'Client role name' })
  @Expose() name: string;

  @ApiProperty({ description: 'Name of the realm the client role belongs to' })
  @Expose() realmName: string;

  @ApiProperty({ description: 'UUID of the client the role belongs to' })
  @Expose() clientId: string;

  @ApiProperty({ description: 'Name of the client the role belongs to' })
  @Expose() clientName: string;
}
