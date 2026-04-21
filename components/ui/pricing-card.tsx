type PricingCardProps = {
  checkoutUrl?: string;
};

export function PricingCard({ checkoutUrl }: PricingCardProps) {
  return (
    <div className="shell p-8 lg:p-10">
      <p className="pill inline-block">AI Agents · Production Tier</p>
      <h3 className="mt-4 text-2xl font-semibold">Ship agents without rebuilding infrastructure</h3>
      <p className="mt-3 text-sm text-slate-300">
        One plan for early product teams. Includes memory APIs, queued execution, state snapshots,
        agent-to-agent messaging, and usage analytics in one dashboard.
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-4xl font-bold">$19</span>
        <span className="mb-1 text-sm text-slate-400">/month</span>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-slate-200">
        <li>Persistent memory namespaces with key-level updates</li>
        <li>Task queue API with status transitions and retries</li>
        <li>State snapshots for resumable agent workflows</li>
        <li>Cross-agent communication channel API</li>
        <li>Dashboard metrics and API-first SDK examples</li>
      </ul>

      <div className="mt-7 flex flex-wrap gap-3">
        <a className="btn btn-primary" href={checkoutUrl || "#pricing"}>
          Buy Now
        </a>
        <a className="btn btn-secondary" href="/dashboard">
          Open Dashboard
        </a>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Checkout is hosted by Stripe. After payment, return here and unlock with the same purchase
        email.
      </p>
    </div>
  );
}
