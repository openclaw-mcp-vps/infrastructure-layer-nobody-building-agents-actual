"use client";

import { useEffect, useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Database, Loader2, Search } from "lucide-react";

type Agent = {
  id: string;
  name: string;
};

type MemoryRecord = {
  id: string;
  agentId: string;
  namespace: string;
  content: string;
  tags: string[];
  createdAt: string;
};

async function fetchAgents() {
  const response = await fetch("/api/agents", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load agents");
  }
  return (await response.json()) as Agent[];
}

async function fetchMemory(agentId?: string, query?: string) {
  const params = new URLSearchParams();
  if (agentId) {
    params.set("agentId", agentId);
  }
  if (query) {
    params.set("query", query);
  }

  const response = await fetch(`/api/memory?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load memory");
  }

  return (await response.json()) as MemoryRecord[];
}

export function MemoryViewer() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [namespace, setNamespace] = useState("runtime-events");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("production,agent");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (agentOverride?: string, queryOverride?: string) => {
    try {
      const agentId = agentOverride ?? selectedAgentId;
      const searchQuery = queryOverride ?? query;
      const payload = await fetchMemory(agentId || undefined, searchQuery || undefined);
      setRecords(payload);
      setError(null);
    } catch {
      setError("Unable to load memory records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const agentList = await fetchAgents();
        setAgents(agentList);
        const firstId = agentList[0]?.id ?? "";
        setSelectedAgentId(firstId);
        await refresh(firstId, "");
      } catch {
        setError("Could not initialize memory viewer.");
        setLoading(false);
      }
    };

    void run();
  }, []);

  const activeAgentName = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId)?.name ?? "All agents",
    [agents, selectedAgentId]
  );

  const addMemory = async () => {
    if (!selectedAgentId || !content.trim() || !namespace.trim()) {
      setError("Select an agent and provide namespace + content.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          namespace: namespace.trim(),
          content: content.trim(),
          tags: tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error("Unable to create memory");
      }

      setContent("");
      await refresh();
      setError(null);
    } catch {
      setError("Memory write failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-semibold text-white">Persistent Memory</h2>
      <p className="mt-1 text-sm text-gray-300">
        Store durable context by namespace and query it during runtime planning.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          value={selectedAgentId}
          onChange={(event) => {
            const next = event.target.value;
            setSelectedAgentId(next);
            void refresh(next);
          }}
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>

        <div className="flex items-center rounded-lg border border-[#2b3648] bg-[#0e1726] px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => {
              void refresh(undefined, query.trim());
            }}
            placeholder="Search namespace, content, or tags"
            className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          value={namespace}
          onChange={(event) => setNamespace(event.target.value)}
          placeholder="Namespace"
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags (comma separated)"
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <button onClick={addMemory} disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Writing memory
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Save memory
            </>
          )}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        placeholder="Capture durable context: incidents, customer preferences, policy updates, checkpoints..."
        className="mt-3 w-full rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-[#4a2a27] bg-[#281510] p-3 text-sm text-orange-200">
          {error}
        </p>
      )}

      <Tabs.Root defaultValue="recent" className="mt-5">
        <Tabs.List className="inline-flex rounded-lg border border-[#263244] bg-[#0f172a]/70 p-1">
          <Tabs.Trigger
            value="recent"
            className="rounded-md px-3 py-1.5 text-sm text-gray-300 data-[state=active]:bg-[#1a2438] data-[state=active]:text-white"
          >
            Recent
          </Tabs.Trigger>
          <Tabs.Trigger
            value="agent"
            className="rounded-md px-3 py-1.5 text-sm text-gray-300 data-[state=active]:bg-[#1a2438] data-[state=active]:text-white"
          >
            {activeAgentName}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="recent" className="mt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading memory
            </div>
          ) : (
            <ul className="space-y-3">
              {records.slice(0, 10).map((record) => (
                <li key={record.id} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[#1b2a40] px-2.5 py-1 text-xs text-blue-100">
                      {record.namespace}
                    </span>
                    <time className="text-xs text-gray-400">
                      {new Date(record.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-sm leading-6 text-gray-200">{record.content}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {record.tags.map((tag) => (
                      <span key={`${record.id}:${tag}`} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Content>

        <Tabs.Content value="agent" className="mt-4">
          <ul className="space-y-3">
            {records
              .filter((record) => record.agentId === selectedAgentId)
              .slice(0, 10)
              .map((record) => (
                <li key={record.id} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-4">
                  <p className="text-sm font-semibold text-white">{record.namespace}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-300">{record.content}</p>
                </li>
              ))}
          </ul>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
