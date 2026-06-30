import { Expose } from 'class-transformer';

/** Shape returned by POST /auth/login. */
export class LoginResponseDto {
  @Expose() id: string;
  @Expose() token: string;
  @Expose() refreshToken: string;
}
