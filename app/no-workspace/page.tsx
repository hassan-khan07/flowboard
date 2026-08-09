import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NoWorkspacePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div>
      <p>You're not part of any workspace yet.</p>
      <p>Ask someone to invite you, or create a new one to get started.</p>
    </div>
  );
}
