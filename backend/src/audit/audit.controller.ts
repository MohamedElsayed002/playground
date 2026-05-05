import { Controller, DefaultValuePipe, Get, Options, ParseIntPipe, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }


  @Get()
  listAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('page_size', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('event') event?: string,
    @Query('status') status?: string,
    @Query('user_id') userId?: string,
  ) {
    const safePage = page < 1 ? 1 : page;
    const safePageSize = pageSize < 1 ? 20 : Math.min(pageSize, 100);

    return this.auditService.listAuditLogs({
      page: safePage,
      pageSize: safePageSize,
      event,
      status,
      userId,
    });
  }
}
