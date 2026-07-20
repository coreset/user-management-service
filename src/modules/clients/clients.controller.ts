import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { ClientPaginatedResponseDto } from './dto/client-paginated-response.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

const ID_PARAM = {
  name: 'id',
  required: true,
  format: 'uuid',
  description: 'UUID of the client',
} as const;

@ApiTags('Clients')
@Controller('realms/:realmName/clients')
@ApiBearerAuth('authorization')
@ApiParam({
  name: 'realmName',
  required: true,
  example: 'master',
  description: 'Name of the realm the client belongs to',
})
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ----- Clients -------------------------------------------------------------

  @Permissions([PermissionKey.CLIENTS_CREATE])
  @Post()
  @ApiOperation({
    summary: 'Create a client',
    description: 'Registers a new OAuth/OIDC client within the given realm.',
  })
  @ApiResponse({ status: 201, description: 'Client created.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  @ApiResponse({ status: 409, description: 'A client with this clientId already exists in this realm.' })
  async create(
    @Param('realmName') realmName: string,
    @Body() createClientDto: CreateClientDto,
  ) {
    const realmId = await this.clientsService.resolveRealmId(realmName);
    const result = await this.clientsService.create(realmId, createClientDto);
    return plainToInstance(ClientResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENTS_READ])
  @Get()
  @ApiOperation({
    summary: 'List clients',
    description: 'Lists all clients registered within the given realm (paginated).',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc', 'ASC', 'DESC'], example: 'DESC', description: 'Sort direction' })
  @ApiQuery({ name: 'search', required: false, example: 'pawn-backend', description: 'Search by client name or client ID' })
  @ApiResponse({ status: 200, description: 'Paginated list of clients in the realm.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async findAll(
    @Param('realmName') realmName: string,
    @Query() queryDto: ClientQueryDto,
  ) {
    const realmId = await this.clientsService.resolveRealmId(realmName);
    const result = await this.clientsService.findAllPaginated(
      realmId,
      queryDto.page,
      queryDto.limit,
      queryDto.order,
      queryDto.search,
    );
    return plainToInstance(ClientPaginatedResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENTS_READ])
  @Get(':id')
  @ApiOperation({
    summary: 'Get a client by id',
    description: 'Fetches a single client by its UUID, scoped to the given realm.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'The requested client.' })
  @ApiResponse({ status: 404, description: 'Realm not found, or client not found in this realm.' })
  async findOne(
    @Param('realmName') realmName: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const realmId = await this.clientsService.resolveRealmId(realmName);
    const result = await this.clientsService.findOne(realmId, id);
    return plainToInstance(ClientResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENTS_UPDATE])
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a client',
    description: 'Partially updates a client (any subset of fields) within the given realm.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Client updated.' })
  @ApiResponse({ status: 404, description: 'Realm not found, or client not found in this realm.' })
  async update(
    @Param('realmName') realmName: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const realmId = await this.clientsService.resolveRealmId(realmName);
    const result = await this.clientsService.update(realmId, id, updateClientDto);
    return plainToInstance(ClientResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENTS_DELETE])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a client',
    description: 'Permanently removes a client from the given realm.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 204, description: 'Client deleted.' })
  @ApiResponse({ status: 404, description: 'Realm not found, or client not found in this realm.' })
  async remove(
    @Param('realmName') realmName: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const realmId = await this.clientsService.resolveRealmId(realmName);
    await this.clientsService.remove(realmId, id);
  }
}
