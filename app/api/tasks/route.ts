import { NextResponse } from "next/server";
import {
  AgentSchema,
  parseCollection,
  TaskCreateSchema,
  TaskRecordSchema,
  TaskUpdateSchema
} from "@/lib/db/schema";
import { requirePaidAccess } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

const TASKS_FILE = "tasks.json";
const AGENTS_FILE = "agents.json";

export async function GET(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");

  const raw = await readJsonFile<unknown[]>(TASKS_FILE, []);
  const tasks = parseCollection(raw, TaskRecordSchema)
    .filter((task) => task.ownerEmail === auth.email)
    .filter((task) => (agentId ? task.agentId === agentId : true))
    .filter((task) => (status ? task.status === status : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const summary = {
    queued: tasks.filter((task) => task.status === "queued").length,
    running: tasks.filter((task) => task.status === "running").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    failed: tasks.filter((task) => task.status === "failed").length
  };

  return NextResponse.json({ tasks, summary });
}

export async function POST(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const parsed = TaskCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task payload." }, { status: 400 });
  }

  const agentsRaw = await readJsonFile<unknown[]>(AGENTS_FILE, []);
  const agents = parseCollection(agentsRaw, AgentSchema);

  const ownsAgent = agents.some(
    (agent) => agent.id === parsed.data.agentId && agent.ownerEmail === auth.email
  );

  if (!ownsAgent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const raw = await readJsonFile<unknown[]>(TASKS_FILE, []);
  const current = parseCollection(raw, TaskRecordSchema);

  const task = TaskRecordSchema.parse({
    id: crypto.randomUUID(),
    ownerEmail: auth.email,
    agentId: parsed.data.agentId,
    type: parsed.data.type,
    payload: parsed.data.payload,
    status: "queued",
    priority: parsed.data.priority,
    attempts: 0,
    maxAttempts: parsed.data.maxAttempts,
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null
  });

  await writeJsonFile(TASKS_FILE, [task, ...current]);

  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const parsed = TaskUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  const raw = await readJsonFile<unknown[]>(TASKS_FILE, []);
  const current = parseCollection(raw, TaskRecordSchema);

  const idx = current.findIndex(
    (task) => task.id === parsed.data.taskId && task.ownerEmail === auth.email
  );

  if (idx < 0) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const existing = current[idx];
  const updated = TaskRecordSchema.parse({
    ...existing,
    status: parsed.data.status,
    error: parsed.data.error ?? (parsed.data.status === "failed" ? "Task failed." : null),
    result: parsed.data.result ?? existing.result,
    attempts: parsed.data.status === "running" ? existing.attempts + 1 : existing.attempts,
    startedAt: parsed.data.status === "running" ? existing.startedAt || now : existing.startedAt,
    completedAt: parsed.data.status === "completed" ? now : existing.completedAt,
    updatedAt: now
  });

  current[idx] = updated;
  await writeJsonFile(TASKS_FILE, current);

  return NextResponse.json({ task: updated });
}
