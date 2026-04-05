import { DotPattern } from '@/components/layouts/dot-pattern';
import { Chat } from '@/features/chat';
import { LiveStream } from '@/features/live-stream';
import { Performance } from '@/features/performance';
import { Tables } from '@/features/tables';

export default function RootPage() {
  return (
    <DotPattern
      className='min-h-screen bg-[radial-gradient(circle_at_top,_#065f46_0%,_#022c22_40%,_#020617_100%)]'
    >
      <main className='mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 text-white sm:px-6 lg:px-8'>
        <div className='w-full'>
          <h1 className='text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl'>
            PlayGround
          </h1>
          <div className='mt-8 flex w-full flex-col'>

            {/* Performance Section */}
            <Performance />
            <div className='my-8 h-px w-full bg-white/40' />


            <div className='grid w-full grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-x-8'>

              {/* Tables Card */}
              <Tables />

              <div className='my-8 h-px w-full bg-white/40 md:my-0 md:h-full md:min-h-px md:w-px md:justify-self-center' />

              {/* Chat Card */}
              <Chat />

            </div>
            <div className='my-8 h-px w-full bg-white/40' />


            {/* AI Cards */}
            <LiveStream />

            <div className='my-8 h-px w-full bg-white/40' />

            <h1 className='text-4xl font-bold text-center'>
              Break
            </h1>

          </div>
        </div>
      </main>
    </DotPattern>
  )
}
