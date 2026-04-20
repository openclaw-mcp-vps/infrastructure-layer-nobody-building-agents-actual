"use client";

import { useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";

const sdkSnippet = `import { AgentInfrastructureSDK } from "@/lib/agent-sdk";

const sdk = new AgentInfrastructureSDK("https://your-domain.com");

await sdk.createAgent({
  name: "Invoice Reconciler",
  role: "Correlates payment events and flags anomalies"
});

await sdk.createTask({
  agentId: "agent-id",
  title: "Reconcile failed charge events",
  priority: "high",
  payload: {
    source: "stripe",
    replayWindow: "30m"
  }
});

await sdk.createMemory({
  agentId: "agent-id",
  namespace: "incident-context",
  content: "Stripe webhook latency spike detected after deploy 2026.04.20",
  tags: ["incident", "payments"]
});

await sdk.sendMessage({
  fromAgentId: "planner-agent-id",
  toAgentId: "remediator-agent-id",
  topic: "incident-handoff",
  payload: {
    severity: "high",
    summary: "Replay tasks require manual verification"
  }
});`;

export function SdkDocs() {
  const highlighted = useMemo(() => {
    return Prism.highlight(sdkSnippet, Prism.languages.typescript, "typescript");
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-semibold text-white">SDK Quickstart</h2>
      <p className="mt-1 text-sm text-gray-300">
        Drop this client into your services and route memory/task/state events through AgentInfra.
      </p>
      <pre className="mt-4 overflow-auto rounded-xl border border-[#2b3648] bg-[#09111f] p-4 text-xs leading-6 text-gray-100">
        <code className="language-typescript" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </section>
  );
}
