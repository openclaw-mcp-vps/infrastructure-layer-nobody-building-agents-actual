"use client";

import * as Tabs from "@radix-ui/react-tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Agent, TaskRecord } from "@/lib/db/schema";

type AgentMetricsProps = {
  agents: Agent[];
  tasks: TaskRecord[];
};

export function AgentMetrics({ agents, tasks }: AgentMetricsProps) {
  const statusData = [
    { name: "Queued", value: tasks.filter((task) => task.status === "queued").length },
    { name: "Running", value: tasks.filter((task) => task.status === "running").length },
    { name: "Completed", value: tasks.filter((task) => task.status === "completed").length },
    { name: "Failed", value: tasks.filter((task) => task.status === "failed").length }
  ];

  const successRateData = agents.map((agent) => ({
    name: agent.name.length > 18 ? `${agent.name.slice(0, 18)}…` : agent.name,
    rate: Math.round(agent.successRate * 100)
  }));

  return (
    <div id="overview" className="shell p-5">
      <h2 className="text-lg font-semibold">Operational Metrics</h2>
      <p className="mt-1 text-sm text-slate-400">
        Track queue health and per-agent reliability to catch bottlenecks before users notice.
      </p>

      <Tabs.Root defaultValue="queue" className="mt-4">
        <Tabs.List className="inline-flex gap-2 rounded-lg border border-[#30363d] bg-[#0f1722] p-1">
          <Tabs.Trigger
            value="queue"
            className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-[#1f2937]"
          >
            Queue Status
          </Tabs.Trigger>
          <Tabs.Trigger
            value="agents"
            className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-[#1f2937]"
          >
            Agent Reliability
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="queue" className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3647" />
              <XAxis dataKey="name" stroke="#9da7b3" />
              <YAxis allowDecimals={false} stroke="#9da7b3" />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #30363d" }} />
              <Bar dataKey="value" fill="#2f81f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Tabs.Content>

        <Tabs.Content value="agents" className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={successRateData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3647" />
              <XAxis dataKey="name" stroke="#9da7b3" />
              <YAxis domain={[0, 100]} stroke="#9da7b3" />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #30363d" }} />
              <Bar dataKey="rate" fill="#3fb950" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
