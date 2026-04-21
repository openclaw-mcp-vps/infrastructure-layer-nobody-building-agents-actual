import Link from "next/link";
import { ArrowRight, CheckCircle2, Server, Shield, Workflow } from "lucide-react";
import { PricingCard } from "@/components/ui/pricing-card";
import { UnlockForm } from "@/components/ui/unlock-form";

const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export default function HomePage() {
  return (
    <main className="grid-fade min-h-screen bg-[#0d1117]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="shell p-6 sm:p-8">
          <p className="pill inline-block">ai-agents · Infrastructure SaaS · $19/mo</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl">
            The Infrastructure Layer Nobody Is Building: What Agents Actually Need to Scale
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-300 sm:text-lg">
            Your team shouldn&apos;t spend six weeks rebuilding memory stores, queue workers, and
            state recovery just to ship one reliable AI workflow. AgentInfra gives you the missing
            production primitives so your agents can run reliably under real load.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={checkoutUrl || "#pricing"}>
              Start For $19/mo <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <Link className="btn btn-secondary" href="/dashboard">
              Open Dashboard
            </Link>
          </div>
          <UnlockForm />
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="shell p-5">
            <h2 className="text-lg font-semibold">The Production Wall</h2>
            <p className="mt-2 text-sm text-slate-300">
              Demo agents look impressive until retries, stale context, and cross-agent handoffs hit
              production traffic. Most teams stall here.
            </p>
          </div>
          <div className="shell p-5">
            <h2 className="text-lg font-semibold">The Real Cost</h2>
            <p className="mt-2 text-sm text-slate-300">
              Infrastructure plumbing quietly consumes roadmap bandwidth: failed task recovery,
              brittle state snapshots, and one-off queues per feature.
            </p>
          </div>
          <div className="shell p-5">
            <h2 className="text-lg font-semibold">Who Pays For Delay</h2>
            <p className="mt-2 text-sm text-slate-300">
              CTOs at 10-50 person AI-first teams feel it first: too much reliability work, not
              enough customer value shipped.
            </p>
          </div>
        </section>

        <section className="mt-8 shell p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">What You Get</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
              <Server className="h-5 w-5 text-blue-300" />
              <h3 className="mt-3 font-medium">Persistent Memory API</h3>
              <p className="mt-2 text-sm text-slate-300">
                Namespaced memory records with key-level updates, history, and metadata.
              </p>
            </div>
            <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
              <Workflow className="h-5 w-5 text-emerald-300" />
              <h3 className="mt-3 font-medium">Task Queue API</h3>
              <p className="mt-2 text-sm text-slate-300">
                Queue jobs with priorities, status transitions, retry limits, and monitoring hooks.
              </p>
            </div>
            <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
              <Shield className="h-5 w-5 text-amber-300" />
              <h3 className="mt-3 font-medium">State Management API</h3>
              <p className="mt-2 text-sm text-slate-300">
                Snapshot and version agent state so long-running workflows can resume safely.
              </p>
            </div>
            <div className="rounded-xl border border-[#30363d] bg-[#111827] p-4">
              <CheckCircle2 className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-3 font-medium">Cross-Agent Communication</h3>
              <p className="mt-2 text-sm text-slate-300">
                Route messages across specialist agents with channel-level observability.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr,380px]" id="pricing">
          <div className="shell p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">Developer-First SDK Flow</h2>
            <p className="mt-2 text-sm text-slate-300">
              The SDK wraps all infrastructure primitives in a single interface so your product
              agents can focus on business logic.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-[#30363d] bg-[#0f1722] p-4 text-sm text-slate-200">
              <code>{`import { AgentInfraSDK } from "@/lib/agent-sdk";

const sdk = new AgentInfraSDK({ baseUrl: "https://your-domain.com" });
const agent = await sdk.createAgent({
  name: "billing-assistant",
  description: "Handles billing requests and dispute routing.",
  model: "gpt-5.4-mini"
});

await sdk.writeMemory({
  agentId: agent.id,
  namespace: "billing",
  key: "account:acme",
  value: { riskTier: "medium", retryWindowHours: 12 }
});

await sdk.queueTask({
  agentId: agent.id,
  type: "follow_up_invoices",
  payload: { accountId: "acme", period: "2026-04" }
});`}</code>
            </pre>
          </div>

          <PricingCard checkoutUrl={checkoutUrl} />
        </section>

        <section className="mt-8 shell p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div>
              <h3 className="font-medium text-slate-100">Why not just use app-level tables?</h3>
              <p className="mt-1">
                Teams usually start there, then each agent builds its own queue semantics,
                checkpointing format, and recovery edge cases. AgentInfra standardizes those
                primitives early so features ship faster.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-100">How does the paywall work?</h3>
              <p className="mt-1">
                Checkout runs on Stripe Payment Links. After successful payment, Stripe webhook
                confirmation unlocks your workspace, and access is stored in a secure HTTP-only
                cookie.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-100">Can this handle multiple agents?</h3>
              <p className="mt-1">
                Yes. Every API object is keyed by agent ID and supports cross-agent communication,
                which makes multi-agent orchestration straightforward.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
