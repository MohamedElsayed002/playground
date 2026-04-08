import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";


export function Tables() {
    return (
        <div>
            <h2 className='text-3xl font-semibold mb-4 md:text-left text-center'>Tables</h2>
            <p className='text-gray-400 -mt-2 mb-5'>fetching data with tanstack-tables and shadcn </p>
            <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="w-full md:w-[371px]  h-[188px] text-black bg-[radial-gradient(circle_at_top,_#fed7aa_0%,_#ffedd5_35%,_#fefce8_75%,_#fafaf9_100%)] rounded-4xl p-5 flex flex-col justify-between">
                    <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">Tanstack Tables</h1>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>with Shadcn Components</p>
                        </div>
                        <Button variant="outline">
                            <Link href="/tanstack-table">
                                <ArrowRight className="text-black" size={24}/>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}