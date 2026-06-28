import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAttributesService } from './user-attributes.service';
import { UserAttributesController } from './user-attributes.controller';
import { UserAttribute } from '../users/entities/user-attribute.entity';
import { AttributeDefinition } from '../users/entities/attribute-definition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAttribute, AttributeDefinition])],
  controllers: [UserAttributesController],
  providers: [UserAttributesService],
  exports: [UserAttributesService],
})
export class UserAttributesModule {}
