import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

@ApiTags('Dashboard')
@Controller('realms/:realmName/dashboard')
@ApiBearerAuth('authorization')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Permissions([PermissionKey.DASHBOARD_READ])
  @Get()
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      "Aggregate counts (users, roles, permissions, clients) for the given realm's overview dashboard.",
  })
  @ApiParam({
    name: 'realmName',
    required: true,
    example: 'master',
    description: 'Name of the realm',
  })
  @ApiResponse({ status: 200, description: 'Aggregated dashboard statistics.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async getStats(@Param('realmName') realmName: string) {
    const result = await this.dashboardService.getStats(realmName);
    return plainToInstance(DashboardResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
