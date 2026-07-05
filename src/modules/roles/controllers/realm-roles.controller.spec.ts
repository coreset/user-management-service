import { Test, TestingModule } from '@nestjs/testing';
import { RealmRolesController } from './realm-roles.controller';
import { RealmRolesService } from '../services/realm-roles.service';
import { RealmsService } from '../../realms/realms.service';

describe('RealmRolesController', () => {
  let controller: RealmRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealmRolesController],
      providers: [
        { provide: RealmRolesService, useValue: {} },
        { provide: RealmsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<RealmRolesController>(RealmRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
