import { Metadata } from "next"

export const metadata: Metadata = {
    title: "SnapShot"
}

export default function Page() {
    return (
        <div className="min-h-screen grid place-items-center">
            <h1 className='text-7xl text-blue-500'>Snapshot</h1>
        </div>
    )
}