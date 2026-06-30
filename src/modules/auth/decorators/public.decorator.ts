import { SetMetadata } from '@nestjs/common';

/** Metadata key marking a route/controller as public; read by the global JwtRs256Guard. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as public so the globally-registered
 * JwtRs256Guard skips authentication for it. Routes that authenticate by another
 * mechanism (refresh token, Google) should be @Public() too and keep their own
 * @UseGuards(AuthGuard('...')).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
