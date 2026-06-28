import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAttribute } from '../users/entities/user-attribute.entity';
import { AttributeDefinition } from '../users/entities/attribute-definition.entity';
import { User } from '../users/entities/user.entity';
import { validateValueType } from '../../common/utils/value-type.util';

const MASKED = '********';

export type UserAttributeView = {
  key: string;
  value: string | null;
  isSet: boolean;
  valueType: string;
  isRequired: boolean;
  isEncrypted: boolean;
  description: string | null;
};

@Injectable()
export class UserAttributesService {
  constructor(
    @InjectRepository(UserAttribute)
    private readonly attributeRepo: Repository<UserAttribute>,
    @InjectRepository(AttributeDefinition)
    private readonly definitionRepo: Repository<AttributeDefinition>,
  ) {}

  /** All allowed attributes for a user = definitions overlaid with set values. */
  async list(userId: string): Promise<UserAttributeView[]> {
    const [definitions, values] = await Promise.all([
      this.definitionRepo.find(),
      this.attributeRepo.find({ where: { user: { id: userId } } }),
    ]);
    const valueMap = new Map(values.map((v) => [v.attributeKey, v.attributeValue]));

    return definitions.map((def) => {
      const isSet = valueMap.has(def.attributeKey);
      return {
        key: def.attributeKey,
        value: def.isEncrypted && isSet ? MASKED : valueMap.get(def.attributeKey) ?? null,
        isSet,
        valueType: def.valueType,
        isRequired: def.isRequired,
        isEncrypted: def.isEncrypted,
        description: def.description,
      };
    });
  }

  /** Upsert a user's value for an allowed attribute key. */
  async set(userId: string, key: string, value: string): Promise<{ message: string }> {
    const def = await this.definitionRepo.findOne({
      where: { attributeKey: key },
    });
    if (!def) {
      throw new BadRequestException(`'${key}' is not an allowed attribute`);
    }
    validateValueType(value, def.valueType);

    let row = await this.attributeRepo.findOne({
      where: { user: { id: userId }, attributeKey: key },
    });
    if (row) {
      row.attributeValue = value;
      row.attributeType = def.valueType;
      row.isEncrypted = def.isEncrypted;
    } else {
      row = this.attributeRepo.create({
        user: { id: userId } as User,
        attributeKey: key,
        attributeValue: value,
        attributeType: def.valueType,
        isEncrypted: def.isEncrypted,
      });
    }
    await this.attributeRepo.save(row);
    return { message: `Attribute '${key}' saved` };
  }

  async remove(userId: string, key: string): Promise<{ message: string }> {
    const def = await this.definitionRepo.findOne({
      where: { attributeKey: key },
    });
    if (def?.isRequired) {
      throw new BadRequestException(`Attribute '${key}' is required and cannot be removed`);
    }
    const result = await this.attributeRepo.delete({
      user: { id: userId },
      attributeKey: key,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Attribute '${key}' not set for this user`);
    }
    return { message: `Attribute '${key}' removed` };
  }
}
