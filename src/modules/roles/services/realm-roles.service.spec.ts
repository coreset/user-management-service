import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RealmRolesService } from './realm-roles.service';
import { RealmRole } from '../entities/realm-role.entity';
import { UserRealmRole } from '../entities/user-realm-role.entity';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { UsersService } from '../../users/users.service';
import { PermissionService } from '../../permission/permission.service';

describe('RealmRolesService', () => {
  let service: RealmRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealmRolesService,
        { provide: getRepositoryToken(RealmRole), useValue: {} },
        { provide: getRepositoryToken(UserRealmRole), useValue: {} },
        { provide: AppLoggerService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: PermissionService, useValue: {} },
      ],
    }).compile();

    service = module.get<RealmRolesService>(RealmRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
