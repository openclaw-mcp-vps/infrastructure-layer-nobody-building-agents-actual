"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Loader2, Plus, ServerCrash } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";

type Agent = {
  id: string;
  name: string;
  role: string;
  status: "healthy" | "degraded" | "offline";
  requests24h: number;
  errorRate: number;
  avgLatencyMs: number;
  createdAt: string;
  updatedAt: string;
};

async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch("/api/agents", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to fetch agents");
  }
  return (await response.json()) as Agent[];
}

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const payload = await fetchAgents();
      setAgents(payload);
    } catch {
      setError("Could not load agents. Verify paid access and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const addAgent = async () => {
    if (!name.trim() || !role.trim()) {
      setError("Provide both a name and role for the agent.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role: role.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to create agent");
      }

      setName("");
      setRole("");
      await refresh();
    } catch {
      setError("Agent creation failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestData = useMemo(
    () =>
      agents
        .map((agent) => ({
          name: agent.name.length > 14 ? `${agent.name.slice(0, 14)}…` : agent.name,
          requests: agent.requests24h
        }))
        .reverse(),
    [agents]
  );

  const errorRateData = useMemo(
    () =>
      agents.map((agent) => ({
        name: agent.name.length > 14 ? `${agent.name.slice(0, 14)}…` : agent.name,
        errorRate: Number((agent.errorRate * 100).toFixed(2))
      })),
    [agents]
  );

  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Agent Fleet</h2>
          <p className="text-sm text-gray-300">Create and monitor specialized agents in one control plane.</p>
        </div>
        <button onClick={refresh} className="btn-secondary text-sm">
          <Activity className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Agent name"
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Role (e.g. Incident triage)"
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>

      <button onClick={addAgent} disabled={isSubmitting} className="btn-primary mb-5 w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating agent
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add agent
          </>
        )}
      </button>

      {error && (
        <p className="mb-4 rounded-lg border border-[#4a2a27] bg-[#281510] p-3 text-sm text-orange-200">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading agents
        </div>
      ) : agents.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#364152] bg-[#111827]/80 p-4 text-sm text-gray-200">
          <ServerCrash className="h-4 w-4" />
          No agents yet. Create one above.
        </div>
      ) : (
        <>
          <ul className="mb-6 space-y-3">
            {agents.map((agent) => (
              <li key={agent.id} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-300">{agent.role}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      agent.status === "healthy"
                        ? "bg-green-500/20 text-green-200"
                        : agent.status === "degraded"
                          ? "bg-yellow-500/20 text-yellow-100"
                          : "bg-red-500/20 text-red-100"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-gray-300 sm:grid-cols-3">
                  <p>
                    Requests (24h): <span className="text-white">{agent.requests24h.toLocaleString()}</span>
                  </p>
                  <p>
                    Error rate: <span className="text-white">{(agent.errorRate * 100).toFixed(2)}%</span>
                  </p>
                  <p>
                    Avg latency: <span className="text-white">{agent.avgLatencyMs} ms</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-[#243043] bg-[#0f172a]/55 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-gray-300">
                24h request volume
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestData}>
                    <CartesianGrid stroke="#233147" strokeDasharray="4 4" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1220",
                        border: "1px solid #2d3c54",
                        borderRadius: 10,
                        color: "#e5e7eb"
                      }}
                    />
                    <Bar dataKey="requests" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-xl border border-[#243043] bg-[#0f172a]/55 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-gray-300">
                Error rate trend
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={errorRateData}>
                    <CartesianGrid stroke="#233147" strokeDasharray="4 4" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} unit="%" />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "error rate"]}
                      contentStyle={{
                        background: "#0b1220",
                        border: "1px solid #2d3c54",
                        borderRadius: 10,
                        color: "#e5e7eb"
                      }}
                    />
                    <Line type="monotone" dataKey="errorRate" stroke="#f97316" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
