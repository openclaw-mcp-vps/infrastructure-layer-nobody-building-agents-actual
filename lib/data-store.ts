import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  type AgentRecord,
  type CreateAgentInput,
  type CreateMessageInput,
  type CreateMemoryInput,
  type CreateTaskInput,
  type DatabaseShape,
  type UpdateTaskStatusInput,
  type UpsertStateInput,
  dbSchema
} from "@/lib/db/schema";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

const defaultData: DatabaseShape = {
  agents: [
    {
      id: "agent-ingestion",
      name: "Ingestion Agent",
      role: "Ingests external events and normalizes payloads.",
      status: "healthy",
      requests24h: 18421,
      errorRate: 0.012,
      avgLatencyMs: 84,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "agent-planner",
      name: "Planner Agent",
      role: "Generates execution plans and dependency maps.",
      status: "healthy",
      requests24h: 11204,
      errorRate: 0.02,
      avgLatencyMs: 131,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "agent-remediator",
      name: "Remediation Agent",
      role: "Handles retries, incident summaries, and escalations.",
      status: "degraded",
      requests24h: 6410,
      errorRate: 0.061,
      avgLatencyMs: 249,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  memories: [
    {
      id: randomUUID(),
      agentId: "agent-planner",
      namespace: "customer-context",
      content: "Customer c_192 is running nightly batch jobs at 02:00 UTC; avoid heavy retraining windows.",
      tags: ["scheduling", "production"],
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: randomUUID(),
      agentId: "agent-ingestion",
      title: "Reconcile webhook retries",
      payload: { source: "stripe", window: "15m" },
      priority: "high",
      status: "running",
      attempts: 1,
      runAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: randomUUID(),
      agentId: "agent-remediator",
      title: "Replay failed vector writes",
      payload: { failedRows: 27, table: "agent_memory" },
      priority: "normal",
      status: "queued",
      attempts: 0,
      runAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  state: [
    {
      id: randomUUID(),
      agentId: "agent-ingestion",
      key: "last_checkpoint",
      value: {
        cursor: "evt_804922",
        consumedAt: new Date(Date.now() - 90 * 1000).toISOString()
      },
      updatedAt: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: randomUUID(),
      fromAgentId: "agent-planner",
      toAgentId: "agent-remediator",
      topic: "incident-handoff",
      payload: {
        incidentId: "inc_22014",
        summary: "Payment webhook retries exceeded threshold on shard us-east-1."
      },
      status: "sent",
      createdAt: new Date().toISOString()
    }
  ],
  purchases: []
};

let writeLock: Promise<void> = Promise.resolve();

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

export async function readDatabase(): Promise<DatabaseShape> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, "utf-8");
  const parsed = JSON.parse(raw);
  const result = dbSchema.safeParse(parsed);

  if (!result.success) {
    await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2), "utf-8");
    return structuredClone(defaultData);
  }

  return result.data;
}

async function writeDatabase(data: DatabaseShape) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf-8");
}

export async function updateDatabase(
  updater: (current: DatabaseShape) => DatabaseShape | Promise<DatabaseShape>
): Promise<DatabaseShape> {
  const run = async () => {
    const current = await readDatabase();
    const next = await updater(current);
    dbSchema.parse(next);
    await writeDatabase(next);
    return next;
  };

  const chain = writeLock.then(run, run);
  writeLock = chain.then(
    () => undefined,
    () => undefined
  );

  return chain;
}

export async function listAgents() {
  const db = await readDatabase();
  return db.agents;
}

export async function createAgent(input: CreateAgentInput): Promise<AgentRecord> {
  const now = new Date().toISOString();
  const agent: AgentRecord = {
    id: randomUUID(),
    name: input.name,
    role: input.role,
    status: "healthy",
    requests24h: 0,
    errorRate: 0,
    avgLatencyMs: 0,
    createdAt: now,
    updatedAt: now
  };

  await updateDatabase((db) => ({ ...db, agents: [agent, ...db.agents] }));
  return agent;
}

export async function listMemory(agentId?: string, query?: string) {
  const db = await readDatabase();
  return db.memories
    .filter((item) => (agentId ? item.agentId === agentId : true))
    .filter((item) => {
      if (!query) {
        return true;
      }
      const normalized = query.toLowerCase();
      return (
        item.content.toLowerCase().includes(normalized) ||
        item.namespace.toLowerCase().includes(normalized) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMemory(input: CreateMemoryInput) {
  const memory = {
    id: randomUUID(),
    agentId: input.agentId,
    namespace: input.namespace,
    content: input.content,
    tags: input.tags,
    createdAt: new Date().toISOString()
  };

  await updateDatabase((db) => ({ ...db, memories: [memory, ...db.memories] }));
  return memory;
}

export async function listTasks(agentId?: string, status?: string) {
  const db = await readDatabase();
  return db.tasks
    .filter((task) => (agentId ? task.agentId === agentId : true))
    .filter((task) => (status ? task.status === status : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTask(input: CreateTaskInput) {
  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    agentId: input.agentId,
    title: input.title,
    payload: input.payload,
    priority: input.priority,
    status: "queued" as const,
    attempts: 0,
    runAt: input.runAt ?? now,
    createdAt: now,
    updatedAt: now
  };

  await updateDatabase((db) => ({ ...db, tasks: [task, ...db.tasks] }));
  return task;
}

export async function updateTaskStatus(input: UpdateTaskStatusInput) {
  let updatedTask = null;

  await updateDatabase((db) => {
    const tasks = db.tasks.map((task) => {
      if (task.id !== input.id) {
        return task;
      }

      const updated = {
        ...task,
        status: input.status,
        attempts: input.attempts ?? task.attempts,
        updatedAt: new Date().toISOString()
      };
      updatedTask = updated;
      return updated;
    });

    return { ...db, tasks };
  });

  return updatedTask;
}

export async function listState(agentId: string, key?: string) {
  const db = await readDatabase();
  return db.state
    .filter((entry) => entry.agentId === agentId)
    .filter((entry) => (key ? entry.key === key : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertState(input: UpsertStateInput) {
  const now = new Date().toISOString();
  let result = null;

  await updateDatabase((db) => {
    const existing = db.state.find(
      (entry) => entry.agentId === input.agentId && entry.key === input.key
    );

    if (existing) {
      const updated = {
        ...existing,
        value: input.value,
        updatedAt: now
      };
      result = updated;

      return {
        ...db,
        state: db.state.map((entry) =>
          entry.id === existing.id ? updated : entry
        )
      };
    }

    const created = {
      id: randomUUID(),
      agentId: input.agentId,
      key: input.key,
      value: input.value,
      updatedAt: now
    };
    result = created;

    return {
      ...db,
      state: [created, ...db.state]
    };
  });

  return result;
}

export async function listMessages(agentId?: string) {
  const db = await readDatabase();
  return db.messages
    .filter((message) => (agentId ? message.fromAgentId === agentId || message.toAgentId === agentId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMessage(input: CreateMessageInput) {
  const message = {
    id: randomUUID(),
    fromAgentId: input.fromAgentId,
    toAgentId: input.toAgentId,
    topic: input.topic,
    payload: input.payload,
    status: "sent" as const,
    createdAt: new Date().toISOString()
  };

  await updateDatabase((db) => ({ ...db, messages: [message, ...db.messages] }));
  return message;
}

export async function acknowledgeMessage(id: string) {
  let updatedMessage = null;

  await updateDatabase((db) => {
    const messages = db.messages.map((message) => {
      if (message.id !== id) {
        return message;
      }

      const updated = {
        ...message,
        status: "acknowledged" as const,
        acknowledgedAt: new Date().toISOString()
      };
      updatedMessage = updated;
      return updated;
    });

    return { ...db, messages };
  });

  return updatedMessage;
}

export async function recordPurchase(orderId: string, email?: string) {
  const purchase = {
    id: randomUUID(),
    orderId,
    email,
    createdAt: new Date().toISOString()
  };

  await updateDatabase((db) => {
    const exists = db.purchases.some((entry) => entry.orderId === orderId);
    if (exists) {
      return db;
    }

    return {
      ...db,
      purchases: [purchase, ...db.purchases]
    };
  });

  return purchase;
}

export async function hasRecordedPurchase(orderId: string) {
  const db = await readDatabase();
  return db.purchases.some((entry) => entry.orderId === orderId);
}

export async function summarizeUsage() {
  const db = await readDatabase();

  const statusBreakdown = db.tasks.reduce(
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

  const memoryByAgent = db.memories.reduce<Record<string, number>>((acc, memory) => {
    acc[memory.agentId] = (acc[memory.agentId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalAgents: db.agents.length,
    totalMemoryRecords: db.memories.length,
    totalTasks: db.tasks.length,
    failedTaskRate:
      db.tasks.length > 0 ? Number((statusBreakdown.failed / db.tasks.length).toFixed(3)) : 0,
    statusBreakdown,
    memoryByAgent,
    requests24h: db.agents.reduce((sum, agent) => sum + agent.requests24h, 0)
  };
}
