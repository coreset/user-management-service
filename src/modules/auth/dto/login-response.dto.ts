import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Shape returned by POST /auth/login. */
export class LoginResponseDto {
  @ApiProperty({ description: 'UUID of the authenticated user' })
  @Expose() id: string;

  @ApiProperty({ description: 'Short-lived JWT access token' })
  @Expose() token: string;

  @ApiProperty({ description: 'Long-lived refresh token' })
  @Expose() refreshToken: string;
}
