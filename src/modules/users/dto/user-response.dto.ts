import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Shape returned by GET /users/:id and GET /users/me. */
export class UserResponseDto {
  @ApiProperty({ description: 'UUID of the user' })
  @Expose() id: string;

  @ApiProperty({ description: 'Username' })
  @Expose() username: string;

  @ApiProperty({ description: 'Email address' })
  @Expose() email: string;

  @ApiProperty({ description: 'First name' })
  @Expose() firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Expose() lastName: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @Expose() avatarUrl?: string;

  @ApiProperty({ description: 'Whether the email address has been verified' })
  @Expose() isEmailVerified: boolean;

  @ApiProperty({ description: 'Whether the account is active' })
  @Expose() isActive: boolean;

  @ApiProperty({ description: 'When the user was created' })
  @Expose() createdAt: Date;
}
