import { Expose, Type } from 'class-transformer';

/** Safe user view returned alongside the registration message. */
export class RegisteredUserDto {
  @Expose() id: string;
  @Expose() username: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() avatarUrl: string;
  @Expose() isEmailVerified: boolean;
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;
}

/** Shape returned by POST /auth/register. */
export class RegisterResponseDto {
  @Expose() message?: string;

  @Expose()
  @Type(() => RegisteredUserDto)
  user!: RegisteredUserDto;
}
