import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ListAuditLogsParams = {
  page: number;
  pageSize: number;
  event?: string;
  status?: string;
  userId?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listAuditLogs(params: ListAuditLogsParams) {
    const { page, pageSize, event, status, userId } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(event ? { event } : {}),
      ...(status ? { status } : {}),
      ...(userId ? { user_id: userId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.audit_logs.count({ where }),
      this.prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const items = rows.map((row) => ({
      ...row,
      extra: this.safeParseExtra(row.extra),
    }));

    return {
      items,
      total,
      page,
      page_size: pageSize,
      pages: total ? Math.ceil(total / pageSize) : 0,
    };
  }

  private safeParseExtra(extra: string | null) {
    if (!extra) return null;
    try {
      return JSON.parse(extra) as Record<string, unknown>;
    } catch {
      return { raw: extra };
    }
  }
}
