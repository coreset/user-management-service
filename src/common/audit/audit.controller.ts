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
import { FixedUserRole } from '../../modules/roles/enums/role.enum';
import { Roles } from '../../modules/roles/decorators/roles.decorator';

@Controller('audit-logs')
@ApiBearerAuth('authorization')
@Roles([FixedUserRole.SUPER_ADMIN])
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
