import { Suspense } from "react";
import AuditLogsTable from "@/components/audit-log";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NestJS Audit Logs | Playground",
  description: "View NestJS system-wide activity and event history.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#030303] bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#18181b_38%,_#030303_100%)] text-white selection:bg-primary/30">
      <div className="relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <Suspense
            fallback={
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-12 text-center text-white/80">
                Loading audit logs...
              </div>
            }
          >
            <AuditLogsTable source="nestjs" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
