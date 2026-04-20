"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, CheckCheck, MessageSquare } from "lucide-react";

type Agent = {
  id: string;
  name: string;
};

type MessageRecord = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  topic: string;
  payload: Record<string, unknown>;
  status: "sent" | "acknowledged";
  createdAt: string;
  acknowledgedAt?: string;
};

async function fetchAgents() {
  const response = await fetch("/api/agents", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load agents");
  }
  return (await response.json()) as Agent[];
}

async function fetchMessages() {
  const response = await fetch("/api/messages", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load messages");
  }
  return (await response.json()) as MessageRecord[];
}

export function AgentHandoff() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [fromAgentId, setFromAgentId] = useState("");
  const [toAgentId, setToAgentId] = useState("");
  const [topic, setTopic] = useState("incident-handoff");
  const [payload, setPayload] = useState('{"severity":"high","summary":"replay required"}');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [agentList, messageList] = await Promise.all([fetchAgents(), fetchMessages()]);
      setAgents(agentList);
      setMessages(messageList);
      const first = agentList[0]?.id ?? "";
      const second = agentList[1]?.id ?? first;
      setFromAgentId((current) => current || first);
      setToAgentId((current) => current || second);
      setError(null);
    } catch {
      setError("Unable to load handoff data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const agentMap = useMemo(() => {
    return new Map(agents.map((agent) => [agent.id, agent.name]));
  }, [agents]);

  const sendMessage = async () => {
    if (!fromAgentId || !toAgentId || !topic.trim()) {
      setError("Select both agents and provide a handoff topic.");
      return;
    }

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      setError("Payload must be valid JSON.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAgentId,
          toAgentId,
          topic: topic.trim(),
          payload: parsedPayload
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      await refresh();
      setError(null);
    } catch {
      setError("Message send failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const acknowledge = async (id: string) => {
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", id })
      });

      if (!response.ok) {
        throw new Error("ack failed");
      }

      await refresh();
    } catch {
      setError("Unable to acknowledge message.");
    }
  };

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Cross-Agent Communication</h2>
          <p className="text-sm text-gray-300">
            Send structured handoffs between agents and track acknowledgements.
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={refresh}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Refresh inbox
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={fromAgentId}
          onChange={(event) => setFromAgentId(event.target.value)}
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              From: {agent.name}
            </option>
          ))}
        </select>

        <select
          value={toAgentId}
          onChange={(event) => setToAgentId(event.target.value)}
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              To: {agent.name}
            </option>
          ))}
        </select>

        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="handoff topic"
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>

      <textarea
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />

      <button onClick={sendMessage} disabled={submitting} className="btn-primary mt-3 w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending handoff
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send handoff
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 rounded-lg border border-[#4a2a27] bg-[#281510] p-3 text-sm text-orange-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading messages
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {messages.slice(0, 12).map((message) => (
            <li key={message.id} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{message.topic}</p>
                  <p className="text-xs text-gray-300">
                    {agentMap.get(message.fromAgentId) ?? message.fromAgentId} →{" "}
                    {agentMap.get(message.toAgentId) ?? message.toAgentId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      message.status === "acknowledged"
                        ? "bg-green-500/20 text-green-100"
                        : "bg-blue-500/20 text-blue-100"
                    }`}
                  >
                    {message.status}
                  </span>
                  {message.status !== "acknowledged" && (
                    <button onClick={() => acknowledge(message.id)} className="btn-secondary text-xs">
                      <CheckCheck className="mr-1 h-3 w-3" />
                      Ack
                    </button>
                  )}
                </div>
              </div>
              <pre className="mt-3 overflow-auto rounded-lg border border-[#2b3648] bg-[#09111f] p-3 text-xs text-gray-100">
                {JSON.stringify(message.payload, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
