import Link from "next/link";
import { ArrowRight, Bot, Database, Network, Workflow } from "lucide-react";

type HeroProps = {
  checkoutUrl: string | null;
};

const capabilities = [
  {
    icon: Database,
    label: "Persistent memory",
    detail: "Versioned memory records with namespaces and retrieval APIs"
  },
  {
    icon: Workflow,
    label: "Task orchestration",
    detail: "Queue jobs, retries, and status transitions across agent fleets"
  },
  {
    icon: Network,
    label: "Shared state",
    detail: "Consistent agent state snapshots with deterministic updates"
  },
  {
    icon: Bot,
    label: "Cross-agent messaging",
    detail: "Structured handoff payloads between cooperating agents"
  }
];

export function Hero({ checkoutUrl }: HeroProps) {
  return (
    <section className="container pt-12 pb-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="badge">AI Agent Infrastructure</p>
        <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white">
          Product dashboard
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="mb-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            The Infrastructure Layer Nobody Is Building: What Agents Actually Need to Scale
          </h1>
          <p className="mb-7 max-w-2xl text-lg text-gray-300">
            AgentInfra is the operational backbone for AI-first engineering teams: durable memory,
            queue-backed execution, explicit state management, and cross-agent APIs. Stop spending
            sprints rebuilding the same plumbing and focus on product logic.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={checkoutUrl ? "#pricing" : "/dashboard"} className="btn-primary">
              Unlock full platform
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Preview dashboard
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">$19/month for teams shipping production agents</p>
        </div>

        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-green-200">
            Platform primitives
          </h2>
          <div className="space-y-3">
            {capabilities.map((item) => (
              <article key={item.label} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-4">
                <item.icon className="mb-2 h-5 w-5 text-green-300" />
                <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                <p className="mt-1 text-sm text-gray-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
