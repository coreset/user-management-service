import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealmSetting } from '../realms/entities/realm-setting.entity';
import { SettingDefinition } from '../realms/entities/setting-definition.entity';
import { Realm } from '../realms/entities/realm.entity';
import { validateValueType } from '../../common/utils/value-type.util';

const MASKED = '********';

export type EffectiveSetting = {
  key: string;
  value: string | null;
  isOverridden: boolean;
  valueType: string;
  isEncrypted: boolean;
  description: string | null;
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(RealmSetting)
    private readonly settingRepo: Repository<RealmSetting>,
    @InjectRepository(SettingDefinition)
    private readonly definitionRepo: Repository<SettingDefinition>,
  ) {}

  /** All settings for a realm = definition defaults overlaid with realm overrides. */
  async list(realmId: string): Promise<EffectiveSetting[]> {
    const [definitions, overrides] = await Promise.all([
      this.definitionRepo.find(),
      this.settingRepo.find({ where: { realm: { id: realmId } } }),
    ]);
    const overrideMap = new Map(overrides.map((o) => [o.settingKey, o.settingValue]));

    return definitions.map((def) => {
      const isOverridden = overrideMap.has(def.settingKey);
      const raw = isOverridden
        ? (overrideMap.get(def.settingKey) as string)
        : def.defaultValue;
      return {
        key: def.settingKey,
        value: def.isEncrypted && isOverridden ? MASKED : raw,
        isOverridden,
        valueType: def.valueType,
        isEncrypted: def.isEncrypted,
        description: def.description,
      };
    });
  }

  async get(realmId: string, key: string): Promise<EffectiveSetting> {
    const def = await this.definitionRepo.findOne({ where: { settingKey: key } });
    if (!def) throw new NotFoundException(`Unknown setting '${key}'`);

    const override = await this.settingRepo.findOne({
      where: { realm: { id: realmId }, settingKey: key },
    });
    const isOverridden = !!override;
    const raw = isOverridden ? override!.settingValue : def.defaultValue;
    return {
      key: def.settingKey,
      value: def.isEncrypted && isOverridden ? MASKED : raw,
      isOverridden,
      valueType: def.valueType,
      isEncrypted: def.isEncrypted,
      description: def.description,
    };
  }

  /** Upsert a realm's override for an allowed setting key. */
  async set(realmId: string, key: string, value: string): Promise<EffectiveSetting> {
    const def = await this.definitionRepo.findOne({ where: { settingKey: key } });
    if (!def) {
      throw new BadRequestException(`'${key}' is not an allowed setting`);
    }
    validateValueType(value, def.valueType);

    let row = await this.settingRepo.findOne({
      where: { realm: { id: realmId }, settingKey: key },
    });
    if (row) {
      row.settingValue = value;
      row.valueType = def.valueType;
      row.isEncrypted = def.isEncrypted;
    } else {
      row = this.settingRepo.create({
        realm: { id: realmId } as Realm,
        settingKey: key,
        settingValue: value,
        valueType: def.valueType,
        isEncrypted: def.isEncrypted,
      });
    }
    await this.settingRepo.save(row);
    return this.get(realmId, key);
  }

  /** Remove a realm's override so the setting falls back to its default. */
  async reset(realmId: string, key: string): Promise<{ message: string }> {
    const result = await this.settingRepo.delete({
      realm: { id: realmId },
      settingKey: key,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`No override for '${key}' in this realm`);
    }
    return { message: `Setting '${key}' reset to default` };
  }
}
