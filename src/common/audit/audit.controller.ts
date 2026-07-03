import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { Permissions } from '../../modules/permission/decorators/permissions.decorator';
import { PermissionKey } from '../../modules/permission/constants/permission-key.enum';

@Controller('audit-logs')
@ApiBearerAuth('authorization')
@Permissions([PermissionKey.AUDIT_READ])
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
