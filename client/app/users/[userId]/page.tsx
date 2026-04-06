import type { Metadata } from "next"
import SingleUser from "@/components/users/single-user";
import { getUserName } from "@/actions";

type PageProps = {
    params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { userId } = await params
    const userName = await getUserName(userId)

    return {
        title: userName ? `${userName} | User` : "User Info",
        description: ":D"
    }
}

export default function SingleUserPage() {
    return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fed7aa_0%,#ffedd5_35%,#fefce8_75%,#fafaf9_100%)]">
        <SingleUser/>
    </main>
}
