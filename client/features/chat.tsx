import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Chat() {
    return (
        <div>
            <h2 className='text-3xl font-semibold mb-4 md:text-left text-center'>Chat</h2>
            <p className='text-gray-400 -mt-2 mb-2'>Socket.IO Private/Group chat</p>
            {/* <p className="text-gray-400 mb-5">Send me a message my ID 3e7c6026-9164-43c5-8893-63da41e4789e 😵‍💫</p> */}
            <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="w-full md:w-[371px]  h-[188px] bg-blue-500 rounded-4xl p-5 flex flex-col justify-between">
                    <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">Socket IO/ Tanstack Query</h1>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>with Shadcn Components</p>
                        </div>
                        <Button variant="outline">
                            <Link href="/rooms">
                                <ArrowRight className="text-black" size={24} />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}