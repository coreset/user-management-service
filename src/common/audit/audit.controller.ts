import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { RolesGuard } from '../../modules/roles/guards/roles/roles.guard';
import { FixedUserRole } from '../../modules/roles/enums/role.enum';

@Controller('audit-logs')
@ApiBearerAuth('authorization')
@SetMetadata('role', [FixedUserRole.SUPER_ADMIN])
@UseGuards(AuthGuard('jwt-rs256'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: AuditLogQueryDto) {
    return this.auditService.findAuditLogs(query);
  }

  @Get('verify')
  verify() {
    return this.auditService.verifyChain();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
