import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import dataSourceOptions from '../../config/typeorm.config';
import { MasterRealmSeeder } from './meta-data/master-realm.seeder';

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
    ],
  });

  await dataSource.destroy();

  console.log('Seeding Completed!');
})().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
