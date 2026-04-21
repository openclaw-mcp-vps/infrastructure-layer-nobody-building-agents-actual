import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Database, MessageSquare, Workflow } from "lucide-react";

type DashboardLayoutProps = {
  email: string;
  children: ReactNode;
};

export function DashboardLayout({ email, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#30363d] bg-[#111827]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AgentInfra</p>
            <h1 className="text-xl font-semibold">Production Infrastructure Console</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Workspace</p>
            <p className="text-sm font-medium text-slate-200">{email}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 md:grid-cols-[250px,1fr]">
        <aside className="shell p-4">
          <nav className="space-y-2 text-sm">
            <Link className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-800/60" href="#overview">
              <Activity className="h-4 w-4" /> Overview
            </Link>
            <Link className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-800/60" href="#memory">
              <Database className="h-4 w-4" /> Memory + State
            </Link>
            <Link className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-800/60" href="#tasks">
              <Workflow className="h-4 w-4" /> Task Queue
            </Link>
            <Link className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-800/60" href="#communication">
              <MessageSquare className="h-4 w-4" /> Communication
            </Link>
          </nav>

          <div className="mt-6 rounded-lg border border-[#30363d] bg-[#0f1722] p-3 text-xs text-slate-300">
            API base: <code>/api</code>
            <br />
            SDK class: <code>AgentInfraSDK</code>
          </div>
        </aside>

        <section className="space-y-6">{children}</section>
      </main>
    </div>
  );
}
