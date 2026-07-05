import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUrl, IsOptional, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';


const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/;
export class CreateUserDto {
  @ApiProperty({
    name: 'username',
    required: false,
    example: 'jdoe',
    description: 'Unique within the realm; defaults to the email if omitted',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.]*[a-zA-Z0-9]$/, {
    message: 'username must start with a letter, end with a letter/number, and not contain spaces',
  })
  @Matches(/^(?!.*[_.]{2})/, {
    message: 'username must not contain consecutive underscores or dots',
  })
  username?: string;

  @ApiProperty({
    name: 'firstName',
    required: true,
    example: 'Samadhi'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(NAME_REGEX, {
    message: 'firstName must contain only letters, spaces, hyphens, or apostrophes',
  })
  firstName!: string;

  @ApiProperty({
    name: 'lastName',
    required: true,
    example: 'Samadhi'
  })
  @IsString()
  @IsNotEmpty({ message: 'Last Name is required'})
  @MinLength(2, { message: 'Last Name must be at least 2 characters'})
  @MaxLength(50, { message: 'Last Name must not exceed 50 characters'})
  @Matches(NAME_REGEX, {
    message: 'lastName must contain only letters, spaces, hyphens, or apostrophes',
  })
  lastName!: string; 

  @ApiProperty({
    name: 'email',
    required: true,
    example: 'example@mail.com',
  })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({
    name: 'avatarUrl',
    required: false,
    example: 'https://i.pravatar.cc/300'
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @ApiProperty({
    name: 'password',
    required: true,
    example: '******',
  })
  @IsString()
  @MinLength(6)
  /**
   * @TODO password validation must be dynamic 
   */
  @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at lease on number' })
  password!: string;
}
