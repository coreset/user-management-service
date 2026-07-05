import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Realm } from '../../../modules/realms/entities/realm.entity';
import { RealmKey } from '../../../modules/realms/entities/realm-key.entity';
import { RealmRole } from '../../../modules/roles/entities/realm-role.entity';
import { User } from '../../../modules/users/entities/user.entity';
import { FixedUserRole } from '../../../modules/roles/enums/role.enum';
import { generateRealmKeyPair } from '../../../common/utils/rsa-key.util';

export class MasterRealmSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const realmRepo = dataSource.getRepository(Realm);
    const realmKeyRepo = dataSource.getRepository(RealmKey);
    const roleRepo = dataSource.getRepository(RealmRole);
    const userRepo = dataSource.getRepository(User);

    const masterRealmName = process.env.MASTER_REALM_NAME || 'master';
    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const superAdminUsername =
      process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const superAdminPassword =
      process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe!SuperAdmin123';

    // 1. Master realm (+ its signing key) ------------------------------------
    let masterRealm = await realmRepo.findOne({
      where: { realmName: masterRealmName },
    });
    if (!masterRealm) {
      masterRealm = await realmRepo.save(
        realmRepo.create({
          realmName: masterRealmName,
          displayName: 'Master',
          isActive: true,
        }),
      );

      const key = generateRealmKeyPair();
      await realmKeyRepo.save(
        realmKeyRepo.create({
          realm: masterRealm,
          kid: key.kid,
          algorithm: key.algorithm,
          keyType: key.keyType,
          publicKey: key.publicKey,
          privateKey: key.privateKey,
          isActive: true,
        }),
      );
      console.log(`Master realm '${masterRealmName}' created with signing key`);
    }

    // 2. Realm roles ----------------------------------------------------------
    const roleNames = [FixedUserRole.SUPER_ADMIN, FixedUserRole.REALM_ADMIN];
    const roles: RealmRole[] = [];
    for (const name of roleNames) {
      let role = await roleRepo.findOne({
        where: { name, realm: { id: masterRealm.id } },
        relations: ['realm'],
      });
      if (!role) {
        role = await roleRepo.save(
          roleRepo.create({ name, realm: masterRealm }),
        );
      }
      roles.push(role);
    }
    const superAdminRole = roles.find(
      (r) => r.name === FixedUserRole.SUPER_ADMIN,
    )!;

    // 3. Super admin user -----------------------------------------------------
    const existingUser = await userRepo.findOne({
      where: { email: superAdminEmail },
    });
    if (!existingUser) {
      await userRepo.save(
        userRepo.create({
          username: superAdminUsername,
          email: superAdminEmail,
          // @BeforeInsert hashes this plain value
          passwordHash: superAdminPassword,
          firstName: 'Super',
          lastName: 'Admin',
          isActive: true,
          realm: masterRealm,
          realmRoles: [superAdminRole],
        }),
      );
      console.log(`Super admin user '${superAdminEmail}' created`);
    }
  }
}
