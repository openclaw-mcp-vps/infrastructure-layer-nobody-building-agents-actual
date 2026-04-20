import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { AgentList } from "@/components/dashboard/agent-list";
import { MemoryViewer } from "@/components/dashboard/memory-viewer";
import { TaskQueue } from "@/components/dashboard/task-queue";
import { SdkDocs } from "@/components/dashboard/sdk-docs";
import { AgentHandoff } from "@/components/dashboard/agent-handoff";
import { hasPaidAccess } from "@/lib/auth";

export const metadata = {
  title: "AgentInfra Dashboard",
  description:
    "Monitor agent performance, inspect persistent memory, and orchestrate task queues from one production dashboard."
};

export default async function DashboardPage() {
  const paid = await hasPaidAccess();

  if (!paid) {
    return (
      <main className="container py-16">
        <section className="panel mx-auto max-w-2xl p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-emerald-300" />
          <h1 className="mt-4 text-3xl font-semibold text-white">Paid access required</h1>
          <p className="mt-3 text-gray-300">
            The working infrastructure platform is behind the paid plan. Complete checkout on the
            landing page and return here once the access cookie is issued.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/#pricing" className="btn-primary">
              Unlock for $19/mo
            </Link>
            <Link href="/" className="btn-secondary">
              Back to overview
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="badge">
            <ShieldCheck className="h-3.5 w-3.5" />
            Paid environment unlocked
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">AgentInfra Operations Dashboard</h1>
          <p className="mt-1 text-sm text-gray-300">
            Monitor reliability, queue execution, and memory health across your production agent fleet.
          </p>
        </div>
        <Link href="/" className="btn-secondary text-sm">
          View landing page
        </Link>
      </header>

      <div className="grid gap-5">
        <AgentList />
        <div className="grid gap-5 xl:grid-cols-2">
          <MemoryViewer />
          <TaskQueue />
        </div>
        <AgentHandoff />
        <SdkDocs />
      </div>
    </main>
  );
}
