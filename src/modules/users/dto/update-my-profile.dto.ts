import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, Matches, MinLength } from 'class-validator';

const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/;

/**
 * Self-service profile update — deliberately narrower than UpdateUserDto
 * (no username/email/password/isActive) since this is exposed to any
 * authenticated user editing their own account, not an admin.
 */
export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Samadhi' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(NAME_REGEX, {
    message: 'firstName must contain only letters, spaces, hyphens, or apostrophes',
  })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Samadhi' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(NAME_REGEX, {
    message: 'lastName must contain only letters, spaces, hyphens, or apostrophes',
  })
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://i.pravatar.cc/300' })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;
}
