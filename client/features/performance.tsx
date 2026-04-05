"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Hls from 'hls.js'
import { ArrowRight } from "lucide-react"
import Link from "next/link"


export function Performance() {

    const videoRef1 = useRef<HTMLVideoElement>(null)
    const videoRef2 = useRef<HTMLVideoElement>(null)
    const videoRef3 = useRef<HTMLVideoElement>(null)


    useEffect(() => {
        const streams = [
            {
                url: 'https://stream.mux.com/1RdbcBtpEUK6501pc6yaIvwo9UfSnOg02k1uHxat00xR3w.m3u8',
                ref: videoRef1,
            },
            {
                url: 'https://stream.mux.com/t1TbTB8M1VYHkhxBuap4A8Vm1x015HTHyuQxqchDBago.m3u8',
                ref: videoRef2,
            },
            {
                url: 'https://stream.mux.com/6yvj9SR5bjmXq9N3ak7gy427RwUs8R2ZoH4ndA7Q1018.m3u8',
                ref: videoRef3,
            },
        ];

        const hlsInstances: Hls[] = [];

        streams.forEach(({ url, ref }) => {
            const video = ref.current;
            if (!video) return;

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(video);
                hlsInstances.push(hls);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            }
        });

        return () => {
            hlsInstances.forEach((hls) => hls.destroy());
        };
    }, []);

    return (
        <>
            <h2 className='text-3xl font-semibold mb-4 md:text-left text-center'>Performance</h2>
            <p className='text-gray-400 -mt-2 mb-5'>fetch 10k Users tanstack/virtual, react-window, fetching (bad performance)</p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-10 '>
                <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-black flex-1 min-h-[250px] lg:min-h-0 overflow-hidden group">
                    <video
                        ref={videoRef1}
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                    />
                    <div className="relative z-10 h-full p-6 lg:p-10 flex flex-col justify-between text-white">
                        <h2 className="text-2xl lg:text-3xl max-w-xs font-medium leading-tight">
                            Bad Performance
                        </h2>
                        <div className="flex items-end justify-between">
                            <p className="text-sm lg:text-base opacity-85 max-w-[240px]">
                                fetch 10k users instantly
                            </p>
                            <Button className="w-12 h-12 lg:w-14 lg:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:opacity-50">
                                {/* <ArrowRight size={24} /> */}
                                <Link href="/10k-users/bad-performance">
                                    <ArrowRight size={24} />
                                    <span className='sr-only'>Navigate</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-black p-5 lg:p-8 min-h-[180px] overflow-hidden group">
                    <video
                        ref={videoRef2}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-50 scale-[1.5]"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                    />
                    <div className="relative z-10 h-full flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                            <Button className="w-8 h-8 lg:w-10 lg:h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:opacity-50">
                                <Link href="/10k-users/react-window">
                                    <ArrowRight size={24} />
                                    <span className='sr-only'>Navigate</span>
                                </Link>
                            </Button>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-2xl font-medium leading-tight mb-1">
                                react-window
                            </h3>
                            <p className="text-[10px] lg:text-sm opacity-80">
                                performance optimized.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-black p-5 lg:p-8 min-h-[180px] overflow-hidden group">
                    <video
                        ref={videoRef3}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-50 scale-[2.8]"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                    />
                    <div className="relative z-10 h-full flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] lg:text-xs font-medium uppercase tracking-wider">
                                tanstack virtualized
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <div>
                                <div className="text-4xl lg:text-7xl font-bold leading-none mb-2">34</div>
                                <p className="text-[10px] lg:text-sm opacity-80">
                                    performance optimized
                                </p>
                            </div>
                            <Button className="w-8 h-8 lg:w-10 lg:h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:opacity-50">
                                <Link href="/10k-users/tanstack-virtualized">
                                    <ArrowRight size={24} />
                                    <span className='sr-only'>Navigate</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}