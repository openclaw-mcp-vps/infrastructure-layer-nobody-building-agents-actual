import { NextResponse } from "next/server";
import {
  AgentSchema,
  MemoryRecordSchema,
  MemoryWriteSchema,
  parseCollection
} from "@/lib/db/schema";
import { requirePaidAccess } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

const MEMORY_FILE = "memory.json";
const AGENTS_FILE = "agents.json";

export async function GET(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const namespace = searchParams.get("namespace");
  const key = searchParams.get("key");
  const limit = Number(searchParams.get("limit") || 50);

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  }

  const raw = await readJsonFile<unknown[]>(MEMORY_FILE, []);
  const records = parseCollection(raw, MemoryRecordSchema)
    .filter((record) => record.ownerEmail === auth.email)
    .filter((record) => record.agentId === agentId)
    .filter((record) => (namespace ? record.namespace === namespace : true))
    .filter((record) => (key ? record.key === key : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, Number.isNaN(limit) ? 50 : Math.max(1, Math.min(limit, 200)));

  return NextResponse.json({ memory: records });
}

export async function POST(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const parsed = MemoryWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid memory payload." }, { status: 400 });
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
  const raw = await readJsonFile<unknown[]>(MEMORY_FILE, []);
  const current = parseCollection(raw, MemoryRecordSchema);

  const existingIdx = current.findIndex(
    (record) =>
      record.ownerEmail === auth.email &&
      record.agentId === parsed.data.agentId &&
      record.namespace === parsed.data.namespace &&
      record.key === parsed.data.key
  );

  const nextRecord = MemoryRecordSchema.parse({
    id: existingIdx >= 0 ? current[existingIdx].id : crypto.randomUUID(),
    ownerEmail: auth.email,
    agentId: parsed.data.agentId,
    namespace: parsed.data.namespace,
    key: parsed.data.key,
    value: parsed.data.value,
    metadata: parsed.data.metadata || {},
    createdAt: existingIdx >= 0 ? current[existingIdx].createdAt : now,
    updatedAt: now
  });

  if (existingIdx >= 0) {
    current[existingIdx] = nextRecord;
  } else {
    current.unshift(nextRecord);
  }

  await writeJsonFile(MEMORY_FILE, current);

  return NextResponse.json({ memory: nextRecord }, { status: existingIdx >= 0 ? 200 : 201 });
}
