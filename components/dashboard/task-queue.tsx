"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronRight, Loader2, PlayCircle, PlusCircle, Workflow } from "lucide-react";

type Agent = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  agentId: string;
  title: string;
  payload: Record<string, unknown>;
  priority: "low" | "normal" | "high";
  status: "queued" | "running" | "completed" | "failed";
  attempts: number;
  runAt: string;
  createdAt: string;
  updatedAt: string;
};

const statusOptions: Task["status"][] = ["queued", "running", "completed", "failed"];

async function fetchAgents() {
  const response = await fetch("/api/agents", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load agents");
  }
  return (await response.json()) as Agent[];
}

async function fetchTasks() {
  const response = await fetch("/api/tasks", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load tasks");
  }
  return (await response.json()) as Task[];
}

export function TaskQueue() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentId, setAgentId] = useState("");
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState('{"job":"daily-reconciliation"}');
  const [priority, setPriority] = useState<Task["priority"]>("normal");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const refresh = async () => {
    try {
      const [agentList, taskList] = await Promise.all([fetchAgents(), fetchTasks()]);
      setAgents(agentList);
      setTasks(taskList);
      if (!agentId && agentList.length > 0) {
        setAgentId(agentList[0].id);
      }
      setError(null);
    } catch {
      setError("Unable to load task queue data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const statusCounts = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      {
        queued: 0,
        running: 0,
        completed: 0,
        failed: 0
      }
    );
  }, [tasks]);

  const createTask = async () => {
    if (!agentId || !title.trim()) {
      setError("Select an agent and enter a task title.");
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
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          title: title.trim(),
          payload: parsedPayload,
          priority
        })
      });

      if (!response.ok) {
        throw new Error("create failed");
      }

      setTitle("");
      await refresh();
      setError(null);
    } catch {
      setError("Task creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (taskId: string, status: Task["status"], attempts: number) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id: taskId,
          status,
          attempts
        })
      });

      if (!response.ok) {
        throw new Error("status update failed");
      }

      await refresh();
    } catch {
      setError("Unable to update task status.");
    }
  };

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Task Queue</h2>
          <p className="text-sm text-gray-300">Dispatch, track, and recover agent work items.</p>
        </div>
        <button className="btn-secondary text-sm" onClick={refresh}>
          <Workflow className="mr-2 h-4 w-4" />
          Refresh queue
        </button>
      </div>

      <div className="metric-grid mb-5">
        {statusOptions.map((status) => (
          <article key={status} className="rounded-lg border border-[#243043] bg-[#0f172a]/65 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">{status}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{statusCounts[status]}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <select
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          placeholder="Task title"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Task["priority"])}
          className="rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        >
          <option value="low">Low priority</option>
          <option value="normal">Normal priority</option>
          <option value="high">High priority</option>
        </select>
        <button onClick={createTask} disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Queueing
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Queue task
            </>
          )}
        </button>
      </div>

      <textarea
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-lg border border-[#2b3648] bg-[#0e1726] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-[#4a2a27] bg-[#281510] p-3 text-sm text-orange-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading queue
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="text-xs text-gray-300">{new Date(task.updatedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      task.status === "completed"
                        ? "bg-green-500/20 text-green-100"
                        : task.status === "failed"
                          ? "bg-red-500/20 text-red-100"
                          : task.status === "running"
                            ? "bg-blue-500/20 text-blue-100"
                            : "bg-gray-500/20 text-gray-100"
                    }`}
                  >
                    {task.status}
                  </span>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <button
                        className="inline-flex items-center rounded-md border border-[#2d3c54] px-2 py-1 text-xs text-gray-200"
                        onClick={() => setActiveTask(task)}
                      >
                        Details
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
                      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#2b3648] bg-[#0d1626] p-5">
                        <Dialog.Title className="text-lg font-semibold text-white">Task payload</Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-gray-300">
                          Inspect and update task status for reliable execution.
                        </Dialog.Description>
                        <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-[#2b3648] bg-[#09111f] p-3 text-xs text-gray-100">
                          {JSON.stringify(activeTask?.payload ?? {}, null, 2)}
                        </pre>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {statusOptions.map((status) => (
                            <button
                              key={`${task.id}:${status}`}
                              onClick={() => setStatus(task.id, status, status === "failed" ? task.attempts + 1 : task.attempts)}
                              className="btn-secondary text-xs"
                            >
                              <PlayCircle className="mr-1 h-3 w-3" />
                              Mark {status}
                            </button>
                          ))}
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
