import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ description: 'Name of the realm these statistics belong to' })
  @Expose()
  realmName: string;

  @ApiProperty({ description: 'Total users in the realm' })
  @Expose()
  totalUsers: number;

  @ApiProperty({ description: 'Users currently active' })
  @Expose()
  activeUsers: number;

  @ApiProperty({ description: 'Users currently inactive' })
  @Expose()
  inactiveUsers: number;

  @ApiProperty({ description: 'Total realm-level roles' })
  @Expose()
  totalRealmRoles: number;

  @ApiProperty({ description: 'Total client-level roles, across every client in the realm' })
  @Expose()
  totalClientRoles: number;

  @ApiProperty({ description: "Total permissions in the realm's permission catalog" })
  @Expose()
  totalPermissions: number;

  @ApiProperty({ description: 'Total OAuth/OIDC clients registered in the realm' })
  @Expose()
  totalClients: number;

  @ApiProperty({ description: 'Clients currently active' })
  @Expose()
  activeClients: number;
}
