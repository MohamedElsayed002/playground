"use client";

import { ArrowRight } from "lucide-react";
import { HoverPrefetchLink } from "@/components/nextjs-docs/hover-prefetch-link";
import { useRef, useEffect } from "react";


export function Audit() {

  const divElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = divElement.current
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.history.replaceState(null, "", "#audit")
          }
        })
      },
      {
        rootMargin: "0px",
        // scrollMargin: "0px",
        threshold: 0.5
      }
    )

    observer.observe(section)

    const hash = window.location.hash.substring(1)
    if (hash === "audit") {
      requestAnimationFrame(() => {
        section.scrollIntoView({ behavior: "smooth" })
      })
    }

    return () => {
      observer.unobserve(section)
    }
  }, [])

  return (
    <div ref={divElement} id="audit">
      <h2 className="text-3xl font-semibold mb-4 md:text-left text-center">Audits</h2>
      <div className="text-gray-400 -mt-2 mb-5 container space-y-4 text-sm leading-7 md:text-base">
        <p>
          Audit logs are intentionally public in this project to demonstrate how activity tracking works across users and system events. They are not indicators of bugs or implementation issues — they are an operational feature designed to provide visibility into what happens inside the application.
        </p>
        <p>
          In production environments, audit logs are typically restricted to authorized roles such as administrators, auditors, and security teams. Access is limited because logs often contain sensitive operational context, security-relevant events, and traces of critical business actions.
        </p>
        <p>
          Audit logging is essential for observability, troubleshooting, and accountability. When a production issue occurs — for example, a payment failure, permission change, failed API request, or unexpected system error — logs make it possible to trace exactly what happened, when it happened, and which user or system process triggered the event. This allows teams to investigate incidents with precise timestamps and reliable historical context.
        </p>
        <p>
          Audit logs also provide an important layer of verification. If a specific action does not appear in the audit trail, there is no recorded evidence that the action was executed. In that sense, audit logs serve as operational proof of activity and are a core part of maintaining reliability, security, and trust in modern software systems.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-38">
        <div className="w-full md:w-[371px]  h-[188px] text-black bg-[#030303] bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#18181b_38%,_#030303_100%)] text-white rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">NestJS Audit Logs</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-8">
            NestJS audit logs for internal platform events.
          </p>
          <div className="flex justify-between items-center">
            <div />
            <HoverPrefetchLink
              href="/audit-log-nestjs"
              ariaLabel="Open CareerCast AI project"
              className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-black shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <span className="sr-only">Open NestJS Audit Logs</span>
              <span aria-hidden="true">
                <ArrowRight className="text-black" size={24} />
              </span>
            </HoverPrefetchLink>
          </div>
        </div>
        <div className="w-full md:w-[371px]  h-[188px] bg-[#030303] bg-[radial-gradient(ellipse_at_top,_#1e1e2e_0%,_#11111b_40%,_#030303_100%)] rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">FastAPI Audit Logs</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-8">
            FastAPI audit logs for ecommerce platform events.
          </p>
          <div className="flex justify-between items-center">
            <div />
            <HoverPrefetchLink
              href="/audit-log-fastapi"
              ariaLabel="Open Playground project"
              className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-black shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <span className="sr-only">Open FastAPI Audit Logs</span>
              <span aria-hidden="true">
                <ArrowRight className="text-black" size={24} />
              </span>
            </HoverPrefetchLink>
          </div>
        </div>
      </div>
    </div>
  );
}
