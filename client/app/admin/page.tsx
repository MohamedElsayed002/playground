import type { Metadata } from "next";
import AdminPage from "@/components/admin";

export const metadata: Metadata = {
    title: "Admin Chat",
    description: "Admin Chat Description :O d(O_o)b"
}

export default function Admin() {
    return <AdminPage/>
}