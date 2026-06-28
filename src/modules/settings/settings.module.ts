import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { RealmSetting } from '../realms/entities/realm-setting.entity';
import { SettingDefinition } from '../realms/entities/setting-definition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RealmSetting, SettingDefinition])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
