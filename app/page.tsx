import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SquareKanban, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center -rotate-6">
          <SquareKanban className="text-stone-950" size={20} />
        </div>
        <span className="text-stone-50 text-xl font-medium tracking-tight">
          FlowBoard
        </span>
      </div>

      <h1 className="text-stone-50 text-4xl sm:text-5xl font-medium leading-tight tracking-tight mb-4">
        Where work
        <br />
        finds its <span className="text-orange-500">flow.</span>
      </h1>

      <p className="text-stone-500 text-sm sm:text-base leading-relaxed max-w-md mb-8">
        Create a workspace, invite your team with roles, and manage tasks on a
        real-time Kanban board.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="h-11 px-5 bg-orange-500 hover:bg-orange-400 rounded-[9px] flex items-center gap-2 text-stone-950 text-sm font-medium transition-colors"
        >
          Get started
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/login"
          className="h-11 px-5 border border-stone-700 hover:bg-stone-900 rounded-[9px] flex items-center text-stone-50 text-sm font-medium transition-colors"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
