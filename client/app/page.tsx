import { DotPattern } from '@/components/layouts/dot-pattern';
import { Performance } from '@/features/performance';
import { Tables } from '@/features/tables';

export default function RootPage() {
  return (
    <DotPattern
      className='bg-gray-800'
    >
      <main className='mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 text-white sm:px-6 lg:px-8'>
        <div className='w-full'>
          <h1 className='text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl'>
            PlayGround
          </h1>
          <div className='mt-8 flex w-full flex-col'>
            {/* Performance Section */}
            <Performance/>
            <div className='my-8 h-px w-full bg-white/40'/> 

            {/* Table Section (Tanstack Tables) */}
            <Tables/>
            <div className='my-8 h-px w-full bg-white/40'/> 
          </div>
        </div>
      </main>
    </DotPattern>
  )
}
