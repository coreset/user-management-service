import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import dataSourceOptions from '../../config/typeorm.config';
import { MasterRealmSeeder } from './meta-data/master-realm.seeder';
import { PermissionsSeeder } from './meta-data/permissions.seeder';
import { SettingDefinitionsSeeder } from './meta-data/setting-definitions.seeder';
import { AttributeDefinitionsSeeder } from './meta-data/attribute-definitions.seeder';

(async () => {
  const dataSource = new DataSource({
    ...dataSourceOptions,
    migrationsRun: false,
    synchronize: false,
  });

  await dataSource.initialize();

  await runSeeders(dataSource, {
    seeds: [
      MasterRealmSeeder,
      PermissionsSeeder, // must run after MasterRealmSeeder (needs its roles)
      SettingDefinitionsSeeder,
      AttributeDefinitionsSeeder,
    ],
  });

  await dataSource.destroy();

  console.log('Seeding Completed!');
})().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
