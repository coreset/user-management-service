import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Safe user view returned alongside the registration message. */
export class RegisteredUserDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() username: string;
  @ApiProperty() @Expose() email: string;
  @ApiProperty() @Expose() firstName: string;
  @ApiProperty() @Expose() lastName: string;
  @ApiProperty() @Expose() avatarUrl: string;
  @ApiProperty() @Expose() isEmailVerified: boolean;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
}

/** Shape returned by POST /auth/register. */
export class RegisterResponseDto {
  @ApiProperty({ required: false })
  @Expose() message?: string;

  @ApiProperty({ type: () => RegisteredUserDto })
  @Expose()
  @Type(() => RegisteredUserDto)
  user!: RegisteredUserDto;
}
