import { SmallEcommerceChatPanel } from "@/components/small-ecommerce/chat-panel";
import { RealtimeShopperChatPanel } from "@/components/small-ecommerce/realtime-chat-panel";
import GridBackground from "@/components/layouts/grid-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Small E-commerce",
  description: "Mohamed Elsayed",
};

export default function SmallEcommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <GridBackground
      className="min-h-dvh bg-gray-300 dark:bg-zinc-950"
      squares={[
        [2, 1],
        [5, 2],
        [8, 1],
        [1, 5],
        [4, 6],
        [9, 6],
        [12, 4],
        [14, 8],
        [6, 10],
      ]}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">{children}</div>
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <SmallEcommerceChatPanel />
            <RealtimeShopperChatPanel />
          </div>
        </div>
      </div>
    </GridBackground>
  );
}
