"use client";

import { useMemo, useState } from "react";
import type { Agent } from "@/lib/db/schema";

type DashboardActionsProps = {
  agents: Agent[];
};

type Feedback = {
  kind: "success" | "error";
  text: string;
} | null;

function parseJsonObject(input: string) {
  const parsed = JSON.parse(input) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export function DashboardActions({ agents }: DashboardActionsProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  const [agentName, setAgentName] = useState("Support Router");
  const [agentDesc, setAgentDesc] = useState(
    "Routes support tickets to the right specialist and keeps customer context in memory."
  );
  const [agentModel, setAgentModel] = useState("gpt-5.4-mini");

  const [targetAgentId, setTargetAgentId] = useState(agents[0]?.id || "");
  const [memoryKey, setMemoryKey] = useState("customer:last_ticket");
  const [memoryNamespace, setMemoryNamespace] = useState("support");
  const [memoryValue, setMemoryValue] = useState('{"ticketId":"T-1042","priority":"high"}');

  const [taskType, setTaskType] = useState("summarize_conversation");
  const [taskPayload, setTaskPayload] = useState('{"conversationId":"c_8391"}');

  const [stateKey, setStateKey] = useState("handoff_state");
  const [stateValue, setStateValue] = useState('{"phase":"waiting_for_manager"}');

  const [toAgentId, setToAgentId] = useState(agents[1]?.id || agents[0]?.id || "");
  const [message, setMessage] = useState(
    "Customer asked for enterprise SSO details. Taking over this thread for security review."
  );

  const hasAgents = useMemo(() => agents.length > 0, [agents.length]);

  async function postJson(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Request failed.");
    }

    return payload;
  }

  async function runAction(fn: () => Promise<void>) {
    setBusy(true);
    setFeedback(null);

    try {
      await fn();
      setFeedback({ kind: "success", text: "Saved. Refresh to see updated metrics." });
    } catch (error) {
      setFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "Action failed."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="shell p-5">
        <h3 className="text-base font-semibold">Create Agent</h3>
        <p className="mt-1 text-sm text-slate-400">
          Register a production agent with baseline metadata for monitoring and routing.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="input" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          <input className="input" value={agentModel} onChange={(e) => setAgentModel(e.target.value)} />
          <textarea
            className="input sm:col-span-2"
            rows={2}
            value={agentDesc}
            onChange={(e) => setAgentDesc(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary mt-3"
          disabled={busy}
          onClick={() =>
            runAction(async () => {
              await postJson("/api/agents", {
                name: agentName,
                description: agentDesc,
                model: agentModel
              });
            })
          }
        >
          Register Agent
        </button>
      </section>

      <section id="memory" className="shell p-5">
        <h3 className="text-base font-semibold">Memory + State</h3>
        <p className="mt-1 text-sm text-slate-400">
          Persist structured context so agents resume work without replaying full history.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select
            className="input"
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
            disabled={!hasAgents}
          >
            {hasAgents ? (
              agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))
            ) : (
              <option value="">Create an agent first</option>
            )}
          </select>
          <input
            className="input"
            value={memoryNamespace}
            onChange={(e) => setMemoryNamespace(e.target.value)}
            placeholder="namespace"
          />
          <input className="input" value={memoryKey} onChange={(e) => setMemoryKey(e.target.value)} />
          <input className="input" value={stateKey} onChange={(e) => setStateKey(e.target.value)} />
          <textarea
            className="input"
            rows={3}
            value={memoryValue}
            onChange={(e) => setMemoryValue(e.target.value)}
          />
          <textarea
            className="input"
            rows={3}
            value={stateValue}
            onChange={(e) => setStateValue(e.target.value)}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="btn btn-secondary"
            disabled={busy || !targetAgentId}
            onClick={() =>
              runAction(async () => {
                await postJson("/api/memory", {
                  agentId: targetAgentId,
                  namespace: memoryNamespace,
                  key: memoryKey,
                  value: parseJsonObject(memoryValue)
                });
              })
            }
          >
            Save Memory
          </button>

          <button
            className="btn btn-secondary"
            disabled={busy || !targetAgentId}
            onClick={() =>
              runAction(async () => {
                await postJson("/api/state", {
                  agentId: targetAgentId,
                  key: stateKey,
                  value: parseJsonObject(stateValue)
                });
              })
            }
          >
            Upsert State
          </button>
        </div>
      </section>

      <section id="tasks" className="shell p-5">
        <h3 className="text-base font-semibold">Task Queue</h3>
        <p className="mt-1 text-sm text-slate-400">
          Queue asynchronous work with typed payloads and explicit status transitions.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select
            className="input"
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
            disabled={!hasAgents}
          >
            {hasAgents ? (
              agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))
            ) : (
              <option value="">Create an agent first</option>
            )}
          </select>
          <input className="input" value={taskType} onChange={(e) => setTaskType(e.target.value)} />
          <textarea
            className="input sm:col-span-2"
            rows={3}
            value={taskPayload}
            onChange={(e) => setTaskPayload(e.target.value)}
          />
        </div>

        <button
          className="btn btn-secondary mt-3"
          disabled={busy || !targetAgentId}
          onClick={() =>
            runAction(async () => {
              await postJson("/api/tasks", {
                agentId: targetAgentId,
                type: taskType,
                payload: parseJsonObject(taskPayload),
                priority: 3,
                maxAttempts: 3
              });
            })
          }
        >
          Enqueue Task
        </button>
      </section>

      <section id="communication" className="shell p-5">
        <h3 className="text-base font-semibold">Inter-Agent Communication</h3>
        <p className="mt-1 text-sm text-slate-400">
          Send typed messages across agents so specialized workers can coordinate safely.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select
            className="input"
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
            disabled={!hasAgents}
          >
            {hasAgents ? (
              agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))
            ) : (
              <option value="">Create an agent first</option>
            )}
          </select>
          <select
            className="input"
            value={toAgentId}
            onChange={(e) => setToAgentId(e.target.value)}
            disabled={!hasAgents}
          >
            {hasAgents ? (
              agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))
            ) : (
              <option value="">Create an agent first</option>
            )}
          </select>
          <textarea
            className="input sm:col-span-2"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          className="btn btn-secondary mt-3"
          disabled={busy || !targetAgentId || !toAgentId}
          onClick={() =>
            runAction(async () => {
              await postJson("/api/communication", {
                fromAgentId: targetAgentId,
                toAgentId,
                channel: "coordination",
                message
              });
            })
          }
        >
          Send Message
        </button>
      </section>

      {feedback ? (
        <p className={`text-sm ${feedback.kind === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
