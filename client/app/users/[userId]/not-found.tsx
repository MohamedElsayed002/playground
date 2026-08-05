import Link from "next/link";
import { ArrowLeft, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fed7aa_0%,#ffedd5_35%,#fefce8_75%,#fafaf9_100%)] px-4 py-12">
            <Card className="w-full max-w-md border-border/60 bg-white/80 shadow-xl backdrop-blur">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <UserRoundX className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">User not found</CardTitle>
                    <CardDescription>
                        The requested profile could not be found or may have been removed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to users
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
