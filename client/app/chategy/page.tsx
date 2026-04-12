import { ChategyWorkspace } from "@/components/chategy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChatEGY",
};

export default function Page() {
  return <ChategyWorkspace />;
}
