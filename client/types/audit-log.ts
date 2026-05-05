export interface AuditLogItem {
  id: string;
  event: string;
  user_id: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
