import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Shape returned by GET /realms/:realmName/sessions. */
export class SessionResponseDto {
  @ApiProperty({ description: 'UUID of the session' })
  @Expose() id: string;

  @ApiProperty({ description: 'Username of the session owner' })
  @Expose()
  @Transform(({ obj }) => obj.user?.username, { toClassOnly: true })
  username: string;

  @ApiProperty({ description: 'Email of the session owner' })
  @Expose()
  @Transform(({ obj }) => obj.user?.email, { toClassOnly: true })
  email: string;

  @ApiProperty({ description: 'IP address the session was created from', nullable: true })
  @Expose() ipAddress: string | null;

  @ApiProperty({ description: 'User agent the session was created from', nullable: true })
  @Expose() userAgent: string | null;

  @ApiProperty({ description: 'Whether "remember me" was selected at login' })
  @Expose() rememberMe: boolean;

  @ApiProperty({ description: 'Whether the session is still active' })
  @Expose() isActive: boolean;

  @ApiProperty({ description: 'When the session was created' })
  @Expose() createdAt: Date;

  @ApiProperty({ description: 'When the session was last seen', nullable: true })
  @Expose() lastSeenAt: Date | null;

  @ApiProperty({ description: 'When the session expires' })
  @Expose() expiresAt: Date;
}
