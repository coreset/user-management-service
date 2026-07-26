import { PartialType } from '@nestjs/swagger';
import { CreateRealmRoleDto } from './create-realm-role.dto';

export class UpdateRealmRoleDto extends PartialType(CreateRealmRoleDto) {}
