import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientRolesService } from './client-roles.service';
import { ClientRole } from '../../clients/entities/client-role.entity';
import { UserClientRole } from '../../clients/entities/user-client-role.entity';
import { Permission } from '../../permission/entities/permission.entity';
import { ClientsService } from '../../clients/clients.service';

describe('ClientRolesService', () => {
  let service: ClientRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientRolesService,
        { provide: getRepositoryToken(ClientRole), useValue: {} },
        { provide: getRepositoryToken(UserClientRole), useValue: {} },
        { provide: getRepositoryToken(Permission), useValue: {} },
        { provide: ClientsService, useValue: {} },
      ],
    }).compile();

    service = module.get<ClientRolesService>(ClientRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
