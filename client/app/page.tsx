import type { Metadata} from 'next'

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Playground Description'
}

export default function HomePage() {
  return (
    <div className='min-h-screen grid place-items-center'>
      <h1 className='text-7xl text-blue-500 font-bold'>Mohamed</h1>
    </div>
  )
}