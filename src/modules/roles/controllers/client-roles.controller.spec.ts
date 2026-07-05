import { Test, TestingModule } from '@nestjs/testing';
import { ClientRolesController } from './client-roles.controller';
import { ClientRolesService } from '../services/client-roles.service';
import { RealmsService } from '../../realms/realms.service';

describe('ClientRolesController', () => {
  let controller: ClientRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientRolesController],
      providers: [
        { provide: ClientRolesService, useValue: {} },
        { provide: RealmsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ClientRolesController>(ClientRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
