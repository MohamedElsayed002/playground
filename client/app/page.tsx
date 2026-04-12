import type { Metadata } from "next";
import { DotPattern } from "@/components/layouts/dot-pattern";
import {
  APIsAndRealtime,
  Chat,
  LiveStream,
  NoSQLVSSQL,
  Performance,
  RenderingStrategies,
  Tables,
} from "@/features";
import { UserBadge } from "@/components/users/user-badge";

export const metadata: Metadata = {
  title: "Playground",
  description: "d(O_o)b",
};

export default function RootPage() {
  return (
    <DotPattern className="min-h-screen bg-[radial-gradient(circle_at_top,_#065f46_0%,_#022c22_40%,_#020617_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="w-full">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            PlayGround <UserBadge />
          </h1>
          <div className="mt-8 flex w-full flex-col">
            {/* Performance Section */}
            <Performance />
            <div className="my-8 h-px w-full bg-white/40" />

            <div className="grid w-full grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-x-8">
              {/* Tables Card */}
              <Tables />

              <div className="my-8 h-px w-full bg-white/40 md:my-0 md:h-full md:min-h-px md:w-px md:justify-self-center" />

              {/* Chat Card */}
              <Chat />
            </div>
            <div className="my-8 h-px w-full bg-white/40" />

            {/* AI Cards */}
            <LiveStream />

            <div className="my-8 h-px w-full bg-white/40" />

            <NoSQLVSSQL />
            <div className="my-8 h-px w-full bg-white/40" />

            <APIsAndRealtime />
            <div className="my-8 h-px w-full bg-white/40" />

            <RenderingStrategies />
            <div className="my-8 h-px w-full bg-white/40" />
          </div>
        </div>
      </main>
    </DotPattern>
  );
}
