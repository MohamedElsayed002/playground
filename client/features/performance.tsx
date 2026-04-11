"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Hls from "hls.js"
import { ArrowRight } from "lucide-react"
import Link, { useLinkStatus } from "next/link"
import { Spinner } from "@/components/ui/spinner"

function LinkButton({ href }: { href: string }) {
  const { pending } = useLinkStatus()

  return (
    <Button className="relative w-10 h-10 lg:w-12 lg:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:opacity-50">
      {/* Arrow */}
      <ArrowRight
        size={20}
        className={`transition-opacity duration-200 ${
          pending ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Spinner overlay */}
      {pending && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="w-4 h-4" />
        </div>
      )}

      <span className="sr-only">Navigate</span>
    </Button>
  )
}

export function Performance() {
  const videoRef1 = useRef<HTMLVideoElement>(null)
  const videoRef2 = useRef<HTMLVideoElement>(null)
  const videoRef3 = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const streams = [
      {
        url: "https://stream.mux.com/1RdbcBtpEUK6501pc6yaIvwo9UfSnOg02k1uHxat00xR3w.m3u8",
        ref: videoRef1,
      },
      {
        url: "https://stream.mux.com/t1TbTB8M1VYHkhxBuap4A8Vm1x015HTHyuQxqchDBago.m3u8",
        ref: videoRef2,
      },
      {
        url: "https://stream.mux.com/6yvj9SR5bjmXq9N3ak7gy427RwUs8R2ZoH4ndA7Q1018.m3u8",
        ref: videoRef3,
      },
    ]

    const hlsInstances: Hls[] = []

    streams.forEach(({ url, ref }) => {
      const video = ref.current
      if (!video) return

      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(url)
        hls.attachMedia(video)
        hlsInstances.push(hls)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url
      }
    })

    return () => {
      hlsInstances.forEach((hls) => hls.destroy())
    }
  }, [])

  return (
    <>
      <h2 className="text-3xl font-semibold mb-4 md:text-left text-center">
        Performance
      </h2>
      <p className="text-gray-400 -mt-2 mb-5">
        fetch 10k Users tanstack/virtual, react-window, fetching (bad performance)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Card 1 */}
        <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-black flex-1 min-h-[250px] overflow-hidden group">
          <video
            ref={videoRef1}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            autoPlay
            muted
            loop
            playsInline
          />

          <div className="relative z-10 h-full p-6 lg:p-10 flex flex-col justify-between text-white">
            <h2 className="text-2xl lg:text-3xl max-w-xs font-medium leading-tight">
              Bad Performance
            </h2>

            <div className="flex items-end justify-between">
              <p className="text-sm lg:text-base opacity-85 max-w-[240px]">
                fetch 10k users instantly
              </p>

              <Link href="/10k-users/bad-performance">
                <LinkButton href="/10k-users/bad-performance" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-black p-5 lg:p-8 min-h-[180px] overflow-hidden group">
          <video
            ref={videoRef2}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-50 scale-[1.5]"
            autoPlay
            muted
            loop
            playsInline
          />

          <div className="relative z-10 h-full flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              <Link href="/10k-users/react-window">
                <LinkButton href="/10k-users/react-window" />
              </Link>
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

        {/* Card 3 */}
        <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-black p-5 lg:p-8 min-h-[180px] overflow-hidden group">
          <video
            ref={videoRef3}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-50 scale-[2.8]"
            autoPlay
            muted
            loop
            playsInline
          />

          <div className="relative z-10 h-full flex flex-col justify-between text-white">
            <div className="flex justify-between items-start" />

            <div className="flex justify-between">
              <div>
                <div className="text-lg lg:text-2xl font-medium leading-tight mb-1">
                  TANSTACK VIRTUALIZED
                </div>
                <p className="text-[10px] lg:text-sm opacity-80">
                  performance optimized
                </p>
              </div>

              <Link href="/10k-users/tanstack-virtualized">
                <LinkButton href="/10k-users/tanstack-virtualized" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}