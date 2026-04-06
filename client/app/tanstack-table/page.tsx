import UsersTable from "@/components/users";
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Tanstack Table/ GraphQL',
    description: ":p"
}

export default function Page() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fed7aa_0%,_#ffedd5_35%,_#fefce8_75%,_#fafaf9_100%)]">
        <UsersTable/>
        </main>
    )
}