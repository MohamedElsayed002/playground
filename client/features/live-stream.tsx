"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/nextjs-docs/transition-progress-layout";

export function LiveStream() {
  const router = useRouter();
  useHotkey("Control+Alt+9", () => {
    router.push("/admin");
  });

  useHotkey("Control+Alt+8", () => {
    router.push("/realtime");
  });

  useHotkey("Control+Alt+0", () => {
    router.push("/chategy");
  });

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-4 md:text-left text-center">AI</h2>
      <p className="text-gray-400 -mt-2 mb-5">
        Bots/ Livechat/ tanstack-hotkeywords/ tanstack-ai / tools
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="w-full md:w-[371px]  h-[188px] text-black bg-[radial-gradient(circle_at_top,_#fde68a_0%,_#fff7ed_35%,_#eef2ff_75%,_#f8fafc_100%)] rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">Admin</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-8">
            Controlling the database
          </p>
          <div className="flex justify-between items-center">
            <div>
              <span>
                Press <Badge className="bg-black ml-2">Ctrl+Alt+9</Badge>
              </span>
            </div>
            <Button variant="outline">
              <Link href="/admin">
                <ArrowRight className="text-black" size={24} />
              </Link>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-[371px]  h-[188px] bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_40%,_#020617_100%)] rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">
            Realtime Voice Chat
          </h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-8">General Chat</p>
          <div className="flex justify-between items-center">
            <div>
              <span>
                Press <Badge className="bg-black ml-2">Ctrl+Alt+8</Badge>
              </span>
            </div>
            <Button variant="outline">
              <Link href="/realtime">
                <ArrowRight className="text-black" size={24} />
              </Link>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-[371px]  h-[188px]  bg-[radial-gradient(circle_at_top,_#1d4ed8_0%,_#1e3a8a_40%,_#020617_100%)] rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">ChatEGY</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-3">
            deepsearch, upload images/PDF, execute code and more
          </p>
          <div className="flex justify-between items-center">
            <div>
              <span>
                Press <Badge className="bg-black ml-2">Ctrl+Alt+0</Badge>
              </span>
            </div>
            <Button variant="outline">
              <Link href="/chategy">
                <ArrowRight className="text-black" size={24} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
