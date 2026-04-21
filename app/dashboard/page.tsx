import { redirect } from "next/navigation";
import { AgentMetrics } from "@/components/ui/agent-metrics";
import { DashboardActions } from "@/components/ui/dashboard-actions";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { getSessionFromCookie } from "@/lib/auth";
import {
  AgentSchema,
  CommunicationRecordSchema,
  MemoryRecordSchema,
  parseCollection,
  StateRecordSchema,
  TaskRecordSchema
} from "@/lib/db/schema";
import { readJsonFile } from "@/lib/storage";

export default async function DashboardPage() {
  const session = await getSessionFromCookie();

  if (!session) {
    redirect("/?unlock=required");
  }

  const [agentsRaw, tasksRaw, memoryRaw, stateRaw, commRaw] = await Promise.all([
    readJsonFile<unknown[]>("agents.json", []),
    readJsonFile<unknown[]>("tasks.json", []),
    readJsonFile<unknown[]>("memory.json", []),
    readJsonFile<unknown[]>("state.json", []),
    readJsonFile<unknown[]>("communication.json", [])
  ]);

  const agents = parseCollection(agentsRaw, AgentSchema).filter(
    (agent) => agent.ownerEmail === session.email
  );

  const tasks = parseCollection(tasksRaw, TaskRecordSchema).filter(
    (task) => task.ownerEmail === session.email
  );

  const memory = parseCollection(memoryRaw, MemoryRecordSchema).filter(
    (record) => record.ownerEmail === session.email
  );

  const state = parseCollection(stateRaw, StateRecordSchema).filter(
    (record) => record.ownerEmail === session.email
  );

  const communication = parseCollection(commRaw, CommunicationRecordSchema).filter(
    (record) => record.ownerEmail === session.email
  );

  return (
    <DashboardLayout email={session.email}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="shell p-4">
          <p className="text-xs text-slate-400">Registered Agents</p>
          <p className="mt-1 text-2xl font-bold">{agents.length}</p>
        </div>
        <div className="shell p-4">
          <p className="text-xs text-slate-400">Queued + Running Tasks</p>
          <p className="mt-1 text-2xl font-bold">
            {tasks.filter((task) => task.status === "queued" || task.status === "running").length}
          </p>
        </div>
        <div className="shell p-4">
          <p className="text-xs text-slate-400">Memory Entries</p>
          <p className="mt-1 text-2xl font-bold">{memory.length}</p>
        </div>
        <div className="shell p-4">
          <p className="text-xs text-slate-400">Cross-Agent Messages</p>
          <p className="mt-1 text-2xl font-bold">{communication.length}</p>
        </div>
      </div>

      <AgentMetrics agents={agents} tasks={tasks} />

      <section className="shell p-5">
        <h2 className="text-lg font-semibold">Current State Snapshots</h2>
        <p className="mt-1 text-sm text-slate-400">
          State keys let agents resume exactly where they stopped without replaying whole workflows.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Key</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {state.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-slate-400">
                    No state stored yet. Use the actions panel below to persist agent checkpoints.
                  </td>
                </tr>
              ) : (
                state.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="border-t border-[#30363d]">
                    <td className="py-2 pr-4">{entry.agentId}</td>
                    <td className="py-2 pr-4">{entry.key}</td>
                    <td className="py-2 pr-4">{entry.version}</td>
                    <td className="py-2 pr-4">{new Date(entry.updatedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DashboardActions agents={agents} />
    </DashboardLayout>
  );
}
