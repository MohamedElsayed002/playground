import Users from "@/components/users";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Users",
  description: ":P",
};

export default function UsersPage() {
  return <Users />;
}
